from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class DamageAssessment(models.Model):
    _name = 'damage.assessment'
    _description = 'Damage Assessment'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'assessment_date desc, id desc'

    name = fields.Char(
        string='Assessment No',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self._get_default_name(),
    )
    relief_application_id = fields.Many2one(
        'relief.application',
        string='Relief Application',
        required=True,
        ondelete='cascade',
        tracking=True,
    )
    assessor_id = fields.Many2one(
        'res.users',
        string='Assessor',
        default=lambda self: self.env.user,
        tracking=True,
    )
    damage_level = fields.Selection(
        [
            ('MINOR', 'Minor'),
            ('MODERATE', 'Moderate'),
            ('SEVERE', 'Severe'),
            ('TOTAL', 'Total'),
        ],
        string='Damage Level',
        required=True,
        default='MINOR',
        tracking=True,
    )
    structural_damage_score = fields.Float(
        string='Structural Damage Score (0-100)',
        tracking=True,
    )
    content_loss_score = fields.Float(
        string='Content Loss Score (0-100)',
        tracking=True,
    )
    casualties = fields.Integer(string='Casualties', default=0)
    injuries = fields.Integer(string='Injuries', default=0)
    assessment_notes = fields.Text(string='Assessment Notes')
    assessment_date = fields.Date(
        string='Assessment Date', default=fields.Date.today, required=True
    )

    @api.constrains('structural_damage_score')
    def _check_structural_score(self):
        for rec in self:
            if rec.structural_damage_score and (
                rec.structural_damage_score < 0 or rec.structural_damage_score > 100
            ):
                raise ValidationError(
                    _('Structural damage score must be between 0 and 100.')
                )

    @api.constrains('content_loss_score')
    def _check_content_score(self):
        for rec in self:
            if rec.content_loss_score and (
                rec.content_loss_score < 0 or rec.content_loss_score > 100
            ):
                raise ValidationError(
                    _('Content loss score must be between 0 and 100.')
                )

    _sql_constraints = [
        ('unique_name', 'unique(name)', 'Assessment number must be unique.'),
    ]

    @api.model
    def _get_default_name(self):
        seq = self.env['ir.sequence'].next_by_code('damage.assessment')
        return seq or 'DA-NEW'
