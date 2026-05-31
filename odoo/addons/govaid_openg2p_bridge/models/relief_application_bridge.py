from odoo import fields, models


class ReliefApplication(models.Model):
    _inherit = 'relief.application'

    g2p_individual_id = fields.Many2one(
        'res.partner',
        string='OpenG2P Individual',
        domain=[('is_group', '=', False)],
        help='Link with official OpenG2P registry individual record.',
        tracking=True,
    )
    g2p_group_id = fields.Many2one(
        'res.partner',
        string='OpenG2P Group/Household',
        domain=[('is_group', '=', True)],
        help='Link with official OpenG2P registry group/household record.',
        tracking=True,
    )
