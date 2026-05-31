# GovRecover360 Integration Manual Setup

This document covers external platform setup that cannot be completed purely from the local codebase.

## A. Odoo UI Verification

Developer mode URLs:

- `http://localhost:8069/web?debug=1`
- `http://localhost:8069/web?debug=assets`

1. Open `http://localhost:8069/web?debug=1`.
2. Log in as the Odoo admin user.
3. Go to Apps.
4. Remove the Apps filter if needed.
5. Click Update Apps List.
6. Search for `GovAid Disaster Recovery` or `govaid_disaster_recovery`.
7. Install or Upgrade the module.
8. Open the Disaster Recovery menu and confirm the views load.

The `stock_move_sms_validation` Settings crash is caused by an active `stock_sms` settings view when `stock_sms` is not installed. Install `stock_sms` with the Odoo CLI and restart Odoo. See `docs/ODOO_SETUP.md`.

## B. Asgardeo

Detailed setup is also available in `integrations/asgardeo/ASGARDEO_SETUP.md`.

1. Create an application in Asgardeo.
2. Add redirect URL `http://localhost:3000/callback`.
3. Add allowed origin `http://localhost:3000`.
4. Create roles that match GovRecover360 roles.
5. Assign users to roles.
6. Add issuer, JWKS URL, audience, and client values to environment variables.
7. Restart frontend and backend.
8. Test login and backend JWT validation.

## C. WSO2 API Manager

1. Open WSO2 Publisher.
2. Import the GovRecover360 API definitions.
3. Configure the backend endpoint.
4. Add required scopes.
5. Publish the APIs.
6. Subscribe from the Developer Portal.
7. Generate an access token.
8. Test the APIs with Postman through the WSO2 gateway.

## D. Choreo

1. Create a service component.
2. Connect the GitHub repository.
3. Select the `choreo-notification-service` folder.
4. Configure required environment variables.
5. Deploy the service.
6. Copy the invoke URL.
7. Set `CHOREO_NOTIFIER_API_URL` to the Choreo invoke URL for deployed environments.
8. Restart the backend.
9. Test notification health and send flows.

The frontend opens Choreo in a new browser tab instead of relying on iframe embedding. Choreo Cloud may block embedding with browser security headers, which is expected.

## E. Superset

1. Open Superset.
2. Connect Superset to the GovRecover360 PostgreSQL database.
3. Import or create dashboards.
4. Test disaster recovery KPIs, including household counts, relief application status, payments, and dispatches.

## F. OpenG2P & Odoo Addons

GovRecover360 has three layers of OpenG2P integration:
1. **OpenG2P Demo Runtime**: A FastAPI-based API simulator running on port `8070` for isolated API synchronization checks.
2. **Official OpenG2P Odoo Addons**: Cloned from the official repository `OpenG2P/openg2p-registry` (branch `17.0-develop`) and mounted under `odoo/openg2p-addons`. The core registry modules (`g2p_registry_base`, `g2p_registry_individual`, `g2p_registry_group`, `g2p_registry_membership`) are installed in the Odoo database.
3. **GovAid Disaster Recovery Custom Module**: Our custom relief operations module (`govaid_disaster_recovery`) linked to official OpenG2P registry records using a separate bridge module (`govaid_openg2p_bridge`), which adds Many2one fields for `g2p_individual_id` and `g2p_group_id` pointing to registry contacts.

Note: The official OpenG2P PBMS/program modules (`g2p_programs` etc.) require external dependencies (such as `formio` and `formio_storage_filestore`) that are not present in this workspace. Installing those modules is documented as a manual production setup step.

## G. Admin Integration Command Center

Open Admin -> Integrations to present the full platform view. The page includes:

- Integration Overview cards for Backend, Database, Redis, Odoo, OpenG2P, WSO2, Asgardeo, Choreo, Superset, AI Service, and GeoNode.
- Architecture Journey: Citizen / Officer -> Asgardeo Login -> WSO2 API Gateway -> GovRecover360 Backend -> OpenG2P / Odoo / Choreo / Superset.
- Demo Actions for backend health, OpenG2P health, WSO2 gateway/proxy, Choreo notifier, AI health, and console launch buttons.
- Manual setup labels that separate local demo mode from production setup requirements.

For the local Docker frontend on `http://localhost:3000`, use `VITE_API_BASE_URL=http://localhost:8000`. For the Nginx-hosted demo, use `VITE_API_BASE_URL=http://localhost/api`. If this is wrong, the frontend will show `Backend API returned HTML instead of JSON. Check VITE_API_BASE_URL.` instead of crashing.

## H. Final Government / UN Demo Flow

1. Start with Admin -> Integrations to show platform readiness and demo mode.
2. Open WSO2 gateway health and backend proxy to show governed routing.
3. Open OpenG2P health/OpenAPI and run the OpenG2P demo tab for beneficiary, eligibility, entitlement, and enrollment.
4. Open Choreo local notifier and run notification approvals.
5. Open Odoo directly to the Disaster Recovery module for back-office workflows.
6. Open Superset for KPI dashboards.
7. Explain that Asgardeo, real WSO2 APIM, Choreo Cloud, GeoNode, and production Odoo configuration are manual production setup steps.
