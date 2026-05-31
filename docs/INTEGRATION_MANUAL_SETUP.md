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

## F. OpenG2P

The current demo is aligned with OpenG2P concepts through model mapping and workflow naming. It is not connected to a live OpenG2P runtime.

Current demo alignment:

- Household and citizen records align to beneficiary registry concepts.
- Relief programs align to G2P program concepts.
- Relief applications align to enrollment concepts.
- Relief packages align to entitlement concepts.
- Payment requests and dispatch orders align to benefit delivery concepts.

The local Docker demo also includes an OpenG2P-compatible runtime with `/api/health`, beneficiary sync, eligibility, entitlements, and program enrollment endpoints. Future full runtime integration would require connecting to actual OpenG2P services, synchronizing beneficiary registry data, mapping program enrollment APIs, and validating benefit delivery flows end to end.

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
