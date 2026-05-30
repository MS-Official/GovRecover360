from odoo import api, fields, models


class ReliefPackage(models.Model):
    _name = 'relief.package'
    _description = 'Relief Package'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(string='Package Name', required=True, tracking=True)
    relief_application_id = fields.Many2one(
        'relief.application',
        string='Relief Application',
        required=True,
        ondelete='cascade',
    )
    package_type = fields.Selection(
        [
            ('FOOD', 'Food'),
            ('WATER', 'Water'),
            ('MEDICAL', 'Medical'),
            ('SHELTER', 'Shelter'),
            ('HYGIENE', 'Hygiene'),
            ('MULTI', 'Multi'),
        ],
        string='Package Type',
        required=True,
        default='FOOD',
        tracking=True,
    )
    items_list = fields.Text(string='Items (JSON)')
    total_value = fields.Float(string='Total Value', tracking=True)
    notes = fields.Text(string='Notes')
    state = fields.Selection(
        [
            ('DRAFT', 'Draft'),
            ('PREPARED', 'Prepared'),
            ('DISPATCHED', 'Dispatched'),
            ('DELIVERED', 'Delivered'),
        ],
        string='State',
        required=True,
        default='DRAFT',
        tracking=True,
    )

    def action_prepare(self):
        self.write({'state': 'PREPARED'})

    def action_dispatch(self):
        self.write({'state': 'DISPATCHED'})

    def action_deliver(self):
        self.write({'state': 'DELIVERED'})

    def action_back_to_draft(self):
        self.write({'state': 'DRAFT'})
