{
    'name': 'GovAid Disaster Recovery',
    'version': '17.0.1.1.0',
    'category': 'Government',
    'summary': 'Disaster Recovery, Beneficiary Management & Relief Operations',
    'description': """
        GovAid Disaster Recovery Module
        ================================
        Part of GovRecover360 Platform.
        Manages disaster events, relief applications, beneficiary verification,
        relief packages, dispatch orders, damage assessments, payment requests,
        and OpenG2P-aligned demo beneficiary/entitlement flows.
    """,
    'author': 'GovRecover360',
    'website': 'https://govrecover360.local',
    'depends': ['base', 'mail', 'contacts', 'stock'],
    'data': [
        'security/groups.xml',
        'security/ir.model.access.csv',
        'data/sequence_data.xml',
        'data/demo_data.xml',
        'views/disaster_event_views.xml',
        'views/relief_application_views.xml',
        'views/relief_package_views.xml',
        'views/dispatch_order_views.xml',
        'views/damage_assessment_views.xml',
        'views/payment_request_views.xml',
        'views/openg2p_demo_views.xml',
        'views/menu_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
