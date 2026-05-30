from odoo import api, fields, models


class ReliefApplication(models.Model):
    _name = 'relief.application'
    _description = 'Relief Application'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'date_submitted desc, id desc'

    name = fields.Char(
        string='Application No',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self._get_default_name(),
    )
    disaster_event_id = fields.Many2one(
        'disaster.event',
        string='Disaster Event',
        required=True,
        tracking=True,
    )
    applicant_name = fields.Char(string='Applicant Name', required=True, tracking=True)
    applicant_nic = fields.Char(string='NIC Number', tracking=True)
    applicant_phone = fields.Char(string='Phone Number', tracking=True)
    district = fields.Char(string='District', tracking=True)
    ds_division = fields.Char(string='DS Division')
    gn_division = fields.Char(string='GN Division')
    address = fields.Text(string='Address')
    family_size = fields.Integer(string='Family Size', default=1)
    damage_level = fields.Selection(
        [
            ('MINOR', 'Minor'),
            ('MODERATE', 'Moderate'),
            ('SEVERE', 'Severe'),
            ('TOTAL', 'Total'),
        ],
        string='Damage Level',
        default='MINOR',
        tracking=True,
    )
    required_items = fields.Text(string='Required Items (JSON)')
    status = fields.Selection(
        [
            ('DRAFT', 'Draft'),
            ('SUBMITTED', 'Submitted'),
            ('UNDER_VERIFICATION', 'Under Verification'),
            ('VERIFIED', 'Verified'),
            ('REJECTED', 'Rejected'),
            ('APPROVED_FOR_RELIEF', 'Approved for Relief'),
            ('PAYMENT_PENDING', 'Payment Pending'),
            ('PAYMENT_APPROVED', 'Payment Approved'),
            ('DISPATCH_PENDING', 'Dispatch Pending'),
            ('DISPATCHED', 'Dispatched'),
            ('COMPLETED', 'Completed'),
        ],
        string='Status',
        required=True,
        default='DRAFT',
        tracking=True,
    )
    verification_notes = fields.Text(string='Verification Notes')
    rejection_reason = fields.Text(string='Rejection Reason')
    assigned_ngo_id = fields.Many2one(
        'res.partner', string='Assigned NGO', domain=[('is_company', '=', True)]
    )
    created_by = fields.Many2one(
        'res.users', string='Created By', default=lambda self: self.env.user, readonly=True
    )
    verified_by = fields.Many2one('res.users', string='Verified By', readonly=True)
    approved_by = fields.Many2one('res.users', string='Approved By', readonly=True)
    date_submitted = fields.Datetime(string='Date Submitted')
    date_verified = fields.Datetime(string='Date Verified')
    date_approved = fields.Datetime(string='Date Approved')

    relief_package_id = fields.One2many(
        'relief.package', 'relief_application_id', string='Relief Package'
    )
    dispatch_order_ids = fields.One2many(
        'dispatch.order', 'relief_application_id', string='Dispatch Orders'
    )
    damage_assessment_ids = fields.One2many(
        'damage.assessment', 'relief_application_id', string='Damage Assessments'
    )
    payment_request_ids = fields.One2many(
        'payment.request', 'relief_application_id', string='Payment Requests'
    )

    _sql_constraints = [
        ('unique_name', 'unique(name)', 'Application number must be unique.'),
    ]

    @api.model
    def _get_default_name(self):
        seq = self.env['ir.sequence'].next_by_code('relief.application')
        return seq or 'RA-NEW'

    def action_submit(self):
        for rec in self:
            rec.write({
                'status': 'SUBMITTED',
                'date_submitted': fields.Datetime.now(),
            })

    def action_start_verification(self):
        for rec in self:
            rec.write({'status': 'UNDER_VERIFICATION'})

    def action_verify(self):
        for rec in self:
            rec.write({
                'status': 'VERIFIED',
                'verified_by': self.env.user.id,
                'date_verified': fields.Datetime.now(),
            })

    def action_reject(self):
        for rec in self:
            rec.write({'status': 'REJECTED'})

    def action_approve_relief(self):
        for rec in self:
            rec.write({
                'status': 'APPROVED_FOR_RELIEF',
                'approved_by': self.env.user.id,
                'date_approved': fields.Datetime.now(),
            })
