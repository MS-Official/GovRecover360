from odoo import api, fields, models


class DispatchOrder(models.Model):
    _name = 'dispatch.order'
    _description = 'Dispatch Order'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(
        string='Dispatch No',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self._get_default_name(),
    )
    relief_application_id = fields.Many2one(
        'relief.application',
        string='Relief Application',
        required=True,
        tracking=True,
    )
    warehouse_id = fields.Many2one(
        'stock.warehouse', string='Warehouse', tracking=True
    )
    assigned_ngo_partner_id = fields.Many2one(
        'res.partner',
        string='Assigned NGO',
        domain=[('is_company', '=', True)],
        tracking=True,
    )
    items_json = fields.Text(string='Items (JSON)')
    status = fields.Selection(
        [
            ('PENDING', 'Pending'),
            ('IN_TRANSIT', 'In Transit'),
            ('DELIVERED', 'Delivered'),
            ('PARTIAL', 'Partially Delivered'),
        ],
        string='Status',
        required=True,
        default='PENDING',
        tracking=True,
    )
    dispatched_by = fields.Many2one('res.users', string='Dispatched By', readonly=True)
    dispatched_date = fields.Datetime(string='Dispatched Date')
    delivered_date = fields.Datetime(string='Delivered Date')
    notes = fields.Text(string='Notes')

    _sql_constraints = [
        ('unique_name', 'unique(name)', 'Dispatch number must be unique.'),
    ]

    @api.model
    def _get_default_name(self):
        seq = self.env['ir.sequence'].next_by_code('dispatch.order')
        return seq or 'DO-NEW'

    def action_in_transit(self):
        for rec in self:
            rec.write({
                'status': 'IN_TRANSIT',
                'dispatched_by': self.env.user.id,
                'dispatched_date': fields.Datetime.now(),
            })

    def action_delivered(self):
        for rec in self:
            rec.write({
                'status': 'DELIVERED',
                'delivered_date': fields.Datetime.now(),
            })

    def action_partial(self):
        for rec in self:
            rec.write({'status': 'PARTIAL'})

    def action_back_to_pending(self):
        for rec in self:
            rec.write({
                'status': 'PENDING',
                'dispatched_by': False,
                'dispatched_date': False,
            })
