# Odoo Setup for GovRecover360

GovRecover360 uses Odoo as the ERP back office for relief operations, inventory dispatch, payments, and the OpenG2P-aligned demo module.

## Developer Mode URLs

- `http://localhost:8069/web?debug=1`
- `http://localhost:8069/web?debug=assets`

## Install or Upgrade GovAid Disaster Recovery

1. Open `http://localhost:8069/web?debug=1`.
2. Log in as the Odoo admin user.
3. Go to Apps.
4. Remove the Apps filter if needed.
5. Search `GovAid Disaster Recovery`.
6. Click Install or Upgrade.
7. Open the Disaster Recovery menu.

## OpenG2P-Aligned Demo Module

The local Odoo addon does not claim real OpenG2P Odoo modules are installed. It provides an **OpenG2P-aligned demo module** with:

- Beneficiary Registry
- Household Registry
- Program Enrollments
- Entitlements

This module demonstrates OpenG2P-style beneficiary, entitlement, and program enrollment flows for disaster recovery.

## Settings Error Fix

If Odoo Settings reports `"res.config.settings"."stock_move_sms_validation" field is undefined`, inspect module state:

```bash
docker compose --env-file .env.demo exec -T odoo-db psql -U odoo -d GovRecover360 -c "SELECT name, state FROM ir_module_module WHERE name IN ('stock', 'sms', 'stock_sms');"
```

The safe fix is to install `stock_sms`:

```bash
docker compose --env-file .env.demo exec -T odoo odoo -c /etc/odoo/odoo.conf --db_host=odoo-db --db_user=odoo --db_password='odoo@2026' -d GovRecover360 -i stock_sms --stop-after-init
docker compose --env-file .env.demo restart odoo
```

Then open `http://localhost:8069/web?debug=1` and verify Settings and Apps load.
