{
    'name': 'GovAid OpenG2P Bridge',
    'version': '17.0.1.0.0',
    'category': 'Government',
    'summary': 'Bridge GovAid Disaster Recovery and official OpenG2P registry records',
    'description': """
        GovAid OpenG2P Bridge Module
        =============================
        Links relief applications in the custom GovAid Disaster Recovery module
        to official OpenG2P registry records (individuals and groups) inside Odoo.
    """,
    'author': 'GovRecover360',
    'website': 'https://govrecover360.local',
    'depends': [
        'govaid_disaster_recovery',
        'g2p_registry_individual',
        'g2p_registry_group'
    ],
    'data': [
        'views/relief_application_bridge_views.xml',
    ],
    'installable': True,
    'auto_install': True,
    'license': 'LGPL-3',
}
