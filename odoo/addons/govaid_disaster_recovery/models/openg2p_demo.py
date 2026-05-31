from odoo import api, fields, models


class G2PBeneficiaryDemo(models.Model):
    _name = 'g2p.beneficiary.demo'
    _description = 'OpenG2P-Aligned Demo Beneficiary'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc, id desc'

    name = fields.Char(string='Beneficiary Name', required=True, tracking=True)
    beneficiary_ref = fields.Char(
        string='Beneficiary Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self._get_default_ref(),
    )
    national_id = fields.Char(string='National ID', tracking=True)
    phone = fields.Char(string='Phone', tracking=True)
    district = fields.Char(string='District', tracking=True)
    household_id = fields.Many2one('g2p.household.demo', string='Household')
    relief_application_id = fields.Many2one('relief.application', string='Relief Application')
    eligibility_status = fields.Selection(
        [
            ('pending', 'Pending Verification'),
            ('eligible', 'Eligible'),
            ('not_eligible', 'Not Eligible'),
        ],
        string='Eligibility Status',
        default='pending',
        tracking=True,
    )
    notes = fields.Text(string='Notes')

    @api.model
    def _get_default_ref(self):
        seq = self.env['ir.sequence'].next_by_code('g2p.beneficiary.demo')
        return seq or 'G2P-BEN-NEW'


class G2PHouseholdDemo(models.Model):
    _name = 'g2p.household.demo'
    _description = 'OpenG2P-Aligned Demo Household'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc, id desc'

    name = fields.Char(string='Household Reference', required=True, tracking=True)
    head_name = fields.Char(string='Head of Household', required=True, tracking=True)
    district = fields.Char(string='District', tracking=True)
    family_size = fields.Integer(string='Family Size', default=1, tracking=True)
    damage_level = fields.Selection(
        [
            ('MINOR', 'Minor'),
            ('MODERATE', 'Moderate'),
            ('SEVERE', 'Severe'),
            ('TOTAL', 'Total'),
        ],
        string='Damage Level',
        default='MODERATE',
        tracking=True,
    )
    beneficiary_ids = fields.One2many('g2p.beneficiary.demo', 'household_id', string='Beneficiaries')
    notes = fields.Text(string='Notes')


class G2PProgramEnrollmentDemo(models.Model):
    _name = 'g2p.program.enrollment.demo'
    _description = 'OpenG2P-Aligned Demo Program Enrollment'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'enrollment_date desc, id desc'

    name = fields.Char(
        string='Enrollment Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self._get_default_ref(),
    )
    beneficiary_id = fields.Many2one('g2p.beneficiary.demo', string='Beneficiary', required=True)
    program_name = fields.Char(string='Program Name', default='Emergency Disaster Relief', required=True)
    enrollment_status = fields.Selection(
        [
            ('draft', 'Draft'),
            ('enrolled', 'Enrolled'),
            ('suspended', 'Suspended'),
            ('closed', 'Closed'),
        ],
        string='Enrollment Status',
        default='draft',
        tracking=True,
    )
    enrollment_date = fields.Date(string='Enrollment Date', default=fields.Date.today)
    entitlement_ids = fields.One2many('g2p.entitlement.demo', 'enrollment_id', string='Entitlements')
    notes = fields.Text(string='Notes')

    @api.model
    def _get_default_ref(self):
        seq = self.env['ir.sequence'].next_by_code('g2p.program.enrollment.demo')
        return seq or 'G2P-ENR-NEW'


class G2PEntitlementDemo(models.Model):
    _name = 'g2p.entitlement.demo'
    _description = 'OpenG2P-Aligned Demo Entitlement'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc, id desc'

    name = fields.Char(
        string='Entitlement Reference',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: self._get_default_ref(),
    )
    enrollment_id = fields.Many2one('g2p.program.enrollment.demo', string='Program Enrollment')
    beneficiary_id = fields.Many2one('g2p.beneficiary.demo', string='Beneficiary', required=True)
    entitlement_type = fields.Selection(
        [
            ('cash', 'Cash'),
            ('in_kind', 'In-Kind'),
            ('voucher', 'Voucher'),
        ],
        string='Entitlement Type',
        default='cash',
        required=True,
        tracking=True,
    )
    amount = fields.Float(string='Amount', default=0.0, tracking=True)
    currency = fields.Char(string='Currency', default='LKR')
    entitlement_status = fields.Selection(
        [
            ('draft', 'Draft'),
            ('approved', 'Approved'),
            ('issued', 'Issued'),
            ('cancelled', 'Cancelled'),
        ],
        string='Status',
        default='draft',
        tracking=True,
    )
    notes = fields.Text(string='Notes')

    @api.model
    def _get_default_ref(self):
        seq = self.env['ir.sequence'].next_by_code('g2p.entitlement.demo')
        return seq or 'G2P-ENT-NEW'
