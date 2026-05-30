from odoo import api, fields, models


class DisasterEvent(models.Model):
    _name = 'disaster.event'
    _description = 'Disaster Event'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'start_date desc, id desc'

    name = fields.Char(string='Event Name', required=True, tracking=True)
    disaster_type = fields.Selection(
        [
            ('FLOOD', 'Flood'),
            ('EARTHQUAKE', 'Earthquake'),
            ('CYCLONE', 'Cyclone'),
            ('TSUNAMI', 'Tsunami'),
            ('LANDSLIDE', 'Landslide'),
            ('FIRE', 'Fire'),
            ('OTHER', 'Other'),
        ],
        string='Disaster Type',
        required=True,
        tracking=True,
    )
    severity = fields.Selection(
        [
            ('LOW', 'Low'),
            ('MODERATE', 'Moderate'),
            ('HIGH', 'High'),
            ('CRITICAL', 'Critical'),
        ],
        string='Severity',
        required=True,
        default='MODERATE',
        tracking=True,
    )
    status = fields.Selection(
        [
            ('ACTIVE', 'Active'),
            ('CONTAINED', 'Contained'),
            ('RECOVERY', 'Recovery'),
            ('CLOSED', 'Closed'),
        ],
        string='Status',
        required=True,
        default='ACTIVE',
        tracking=True,
    )
    description = fields.Text(string='Description')
    start_date = fields.Date(string='Start Date', required=True)
    end_date = fields.Date(string='End Date')
    affected_districts = fields.Text(string='Affected Districts (JSON)')
    estimated_affected_population = fields.Integer(string='Estimated Affected Population')
    company_id = fields.Many2one(
        'res.company', string='Company', default=lambda self: self.env.company
    )
    active = fields.Boolean(string='Active', default=True)

    relief_application_count = fields.Integer(
        string='Relief Applications', compute='_compute_relief_application_count'
    )

    @api.depends('relief_application_ids')
    def _compute_relief_application_count(self):
        counts = self.env['relief.application'].read_group(
            [('disaster_event_id', 'in', self.ids)],
            ['disaster_event_id'],
            ['disaster_event_id'],
        )
        mapped = {c['disaster_event_id'][0]: c['disaster_event_id_count'] for c in counts}
        for rec in self:
            rec.relief_application_count = mapped.get(rec.id, 0)

    relief_application_ids = fields.One2many(
        'relief.application', 'disaster_event_id', string='Relief Applications'
    )
