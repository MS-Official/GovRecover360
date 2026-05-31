# Asgardeo Setup for GovRecover360

GovRecover360 supports two authentication modes:

- `AUTH_MODE=mock` for local demos with seeded users.
- `AUTH_MODE=asgardeo` for real OIDC login through Asgardeo.

The frontend uses Authorization Code with PKCE. Do not configure or expose a client secret in the frontend.

## Manual Console Setup

1. Open Asgardeo Console.
2. Select your organization.
3. Create an application:
   - Name: `GovRecover360`
   - Type: Single Page Application
4. Configure redirect URL:
   - `http://localhost:3000/callback`
5. Configure allowed origin:
   - `http://localhost:3000`
6. Configure logout redirect URL:
   - `http://localhost:3000/login`
7. Copy the Client ID into:
   - `VITE_ASGARDEO_CLIENT_ID`
   - `ASGARDEO_CLIENT_ID`
8. Copy the base organization URL into:
   - `VITE_ASGARDEO_BASE_URL`
9. Configure backend JWT validation:
   - `ASGARDEO_ISSUER`
   - `ASGARDEO_JWKS_URL`
   - `ASGARDEO_AUDIENCE`
   - `ASGARDEO_CLIENT_ID`
10. Create roles:
   - `ROLE_ADMIN`
   - `ROLE_DISASTER_MANAGER`
   - `ROLE_FIELD_OFFICER`
   - `ROLE_VERIFIER`
   - `ROLE_PROGRAM_MANAGER`
   - `ROLE_FINANCE_OFFICER`
   - `ROLE_WAREHOUSE_OFFICER`
   - `ROLE_GIS_OFFICER`
   - `ROLE_NGO_PARTNER`
   - `ROLE_AUDITOR`
   - `ROLE_CITIZEN`
11. Create test users.
12. Assign roles to users.
13. Add claims to the token:
   - `email`
   - `groups`
   - `roles`
   - `district`
   - `department`
   - `assigned_region`
   - `organization`
14. Enable self-registration if the Register page should work.
15. Restart frontend and backend.
16. Test login from `http://localhost:3000/login`.
17. Test `/api/me` with the Asgardeo access token.
18. Test role-based dashboard access.

## Environment Variables

Backend:

```env
AUTH_MODE=asgardeo
ASGARDEO_ISSUER=
ASGARDEO_JWKS_URL=
ASGARDEO_AUDIENCE=
ASGARDEO_CLIENT_ID=
ASGARDEO_ORG_NAME=
ASGARDEO_SIGN_UP_URL=
```

Frontend:

```env
VITE_AUTH_MODE=asgardeo
VITE_API_BASE_URL=http://localhost/api
VITE_ASGARDEO_CLIENT_ID=
VITE_ASGARDEO_BASE_URL=
VITE_ASGARDEO_SIGN_IN_REDIRECT_URL=http://localhost:3000/callback
VITE_ASGARDEO_SIGN_OUT_REDIRECT_URL=http://localhost:3000/login
VITE_ASGARDEO_SCOPES=openid profile email groups
VITE_ASGARDEO_SIGN_UP_URL=
```

## Troubleshooting

### Callback URL mismatch

Confirm the Asgardeo application redirect URL exactly matches `VITE_ASGARDEO_SIGN_IN_REDIRECT_URL`.

### CORS issue

Confirm `http://localhost:3000` is listed as an allowed origin in the Asgardeo application.

### Invalid issuer

Check that `ASGARDEO_ISSUER` exactly matches the token issuer claim.

### Invalid audience

Check that `ASGARDEO_AUDIENCE` matches the token audience. If omitted, the backend uses `ASGARDEO_CLIENT_ID`.

### Token missing roles

The backend returns 403 with `No GovRecover360 role found in token. Please assign a role in Asgardeo.` Assign one of the supported GovRecover360 roles or groups to the user.

### 403 after successful login

Check the user's role/group claim and confirm it maps to a GovRecover360 internal role.

### Register button not working

Enable self-registration in Asgardeo and set `VITE_ASGARDEO_SIGN_UP_URL`.

### Self-registration not enabled

The frontend cannot create Asgardeo users by itself. Enable self-registration in the Asgardeo Console or use Asgardeo administrative user provisioning.
