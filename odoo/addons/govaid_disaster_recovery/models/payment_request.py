from odoo import api, fields, models


class PaymentRequest(models.Model):
    _name = 'payment.request'
    _description = 'Payment Request'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'id desc'

    name = fields.Char(
        string='Payment No',
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
    amount = fields.Float(string='Amount', required=True, tracking=True)
    currency = fields.Char(string='Currency', default='LKR', tracking=True)
    payment_type = fields.Selection(
        [
            ('CASH', 'Cash'),
            ('VOUCHER', 'Voucher'),
            ('BANK_TRANSFER', 'Bank Transfer'),
        ],
        string='Payment Type',
        required=True,
        default='CASH',
        tracking=True,
    )
    status = fields.Selection(
        [
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected'),
            ('PROCESSED', 'Processed'),
        ],
        string='Status',
        required=True,
        default='PENDING',
        tracking=True,
    )
    approved_by = fields.Many2one('res.users', string='Approved By', readonly=True)
    approved_date = fields.Datetime(string='Approved Date')
    processed_date = fields.Datetime(string='Processed Date')
    notes = fields.Text(string='Notes')

    _sql_constraints = [
        ('unique_name', 'unique(name)', 'Payment request number must be unique.'),
    ]

    @api.model
    def _get_default_name(self):
        seq = self.env['ir.sequence'].next_by_code('payment.request')
        return seq or 'PR-NEW'

    def action_approve(self):
        for rec in self:
            rec.write({
                'status': 'APPROVED',
                'approved_by': self.env.user.id,
                'approved_date': fields.Datetime.now(),
            })

    def action_reject(self):
        for rec in self:
            rec.write({'status': 'REJECTED'})

    def action_process(self):
        for rec in self:
            rec.write({
                'status': 'PROCESSED',
                'processed_date': fields.Datetime.now(),
            })

    def action_back_to_pending(self):
        for rec in self:
            rec.write({
                'status': 'PENDING',
                'approved_by': False,
                'approved_date': False,
            })
