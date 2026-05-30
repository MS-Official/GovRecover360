# GovRecover360 Integration Manual Setup

This document covers external platform setup that cannot be completed purely from the local codebase.

## A. Odoo UI Verification

1. Open `http://localhost:8069`.
2. Log in as the Odoo admin user.
3. Enable developer mode.
4. Go to Apps.
5. Click Update Apps List.
6. Search for `GovAid Disaster Recovery` or `govaid_disaster_recovery`.
7. Install or Upgrade the module.
8. Open the Disaster Recovery menu and confirm the views load.

## B. Asgardeo

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

Future full runtime integration would require connecting to actual OpenG2P services, synchronizing beneficiary registry data, mapping program enrollment APIs, and validating benefit delivery flows end to end.
