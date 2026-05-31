# GovRecover360 Integration Setup

This guide connects the GovRecover360 frontend, FastAPI backend, Asgardeo, Choreo User Store, Supabase/PostgreSQL, and local Odoo module.

Do not commit real secrets. Use the example files as templates and put real values in Vercel, backend hosting environment variables, Choreo, or a private local `.env`.

## 1. Asgardeo

1. Open the `geoedge` organization in Asgardeo.
2. Create or open the application used by GovRecover360.
3. Add callback URLs:
   - `http://localhost:3000/callback`
   - `https://your-vercel-domain.vercel.app/callback`
4. Add allowed logout redirect URLs:
   - `http://localhost:3000/login`
   - `https://your-vercel-domain.vercel.app`
   - `https://your-vercel-domain.vercel.app/login`
5. Copy the Client ID into frontend and backend env values.
6. Create users such as `Admin Demo`.
7. Assign roles or groups that map to GovRecover360 roles, for example `ROLE_ADMIN`.

Frontend Asgardeo URLs:

```env
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/geoedge
VITE_ASGARDEO_AUTH_URL=https://accounts.asgardeo.io/t/geoedge
```

Backend JWT validation URLs:

```env
ASGARDEO_ISSUER=https://api.asgardeo.io/t/geoedge/oauth2/token
ASGARDEO_JWKS_URL=https://api.asgardeo.io/t/geoedge/oauth2/jwks
```

## 2. Supabase/PostgreSQL

Set the backend database URL to the Supabase shared pooler connection string:

```env
DATABASE_URL=postgresql://postgres.rudxmttefdvebhmpzvsj:YOUR_URL_ENCODED_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

If your password contains special characters such as `@`, `#`, `/`, `?`, or `:`, URL-encode it before placing it in the URL.

## 3. Choreo User Store

In Choreo:

1. Open organization `geoedge`.
2. Open project `GovRecover360`.
3. Open component `Docker User Service`.
4. Open endpoint `User Store`.
5. Copy the public Invoke URL.
6. Copy the security header/test key name and value from the endpoint security panel.

Backend env:

```env
CHOREO_USER_SERVICE_URL=https://your-choreo-user-service-invoke-url
CHOREO_SECURITY_HEADER_NAME=your_choreo_security_header_name
CHOREO_SECURITY_HEADER_VALUE=your_choreo_security_header_value
```

The backend Choreo client supports:

- `GET /users`
- `POST /users`
- `GET /users/{id}`
- `PUT /users/{id}`
- `DELETE /users/{id}`

## 4. Backend Hosting

Deploy the FastAPI backend separately from Vercel, for example on Render, Railway, Choreo, or a VPS.

Set these backend environment variables:

```env
DATABASE_URL=postgresql://postgres.rudxmttefdvebhmpzvsj:YOUR_URL_ENCODED_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require
SECRET_KEY=your_strong_secret
FRONTEND_URL=https://your-vercel-domain.vercel.app
AUTH_MODE=asgardeo
ASGARDEO_ISSUER=https://api.asgardeo.io/t/geoedge/oauth2/token
ASGARDEO_JWKS_URL=https://api.asgardeo.io/t/geoedge/oauth2/jwks
ASGARDEO_CLIENT_ID=your_asgardeo_client_id
ASGARDEO_AUDIENCE=your_asgardeo_client_id
CHOREO_USER_SERVICE_URL=https://your-choreo-user-service-invoke-url
CHOREO_SECURITY_HEADER_NAME=your_choreo_security_header_name
CHOREO_SECURITY_HEADER_VALUE=your_choreo_security_header_value
```

## 5. Vercel Frontend

Vercel should deploy only the React/Vite frontend from `frontend/dist`. The FastAPI backend should not be configured as a Vercel Service.

Set these Vercel environment variables:

```env
VITE_AUTH_MODE=asgardeo
VITE_API_BASE_URL=https://your-backend-api-url.com
VITE_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/geoedge
VITE_ASGARDEO_AUTH_URL=https://accounts.asgardeo.io/t/geoedge
VITE_ASGARDEO_CLIENT_ID=your_asgardeo_client_id
VITE_ASGARDEO_REDIRECT_URI=https://your-vercel-domain.vercel.app/callback
VITE_ASGARDEO_LOGOUT_REDIRECT_URI=https://your-vercel-domain.vercel.app
VITE_ASGARDEO_SCOPES=openid profile email groups
VITE_ASGARDEO_SIGN_UP_URL=https://api.asgardeo.io/t/geoedge/accountrecoveryendpoint/register.do
VITE_CHOREO_USER_SERVICE_URL=https://your-choreo-user-service-invoke-url
```

Redeploy Vercel after changing environment variables.

## 6. Odoo

Odoo runs locally at:

```txt
http://localhost:8069
```

Install or upgrade the module:

```txt
govaid_disaster_recovery
```

Backend env for Odoo XML-RPC checks:

```env
ODOO_BASE_URL=http://localhost:8069
ODOO_DB=your_odoo_database
ODOO_USERNAME=your_odoo_username
ODOO_PASSWORD=your_odoo_password
```

A deployed Vercel frontend cannot access `localhost:8069` directly. Any deployed Odoo integration must go through the backend or a reachable Odoo deployment.

## 7. OpenG2P Demo Integration

GovRecover360 handles disaster request intake.
Asgardeo authenticates users.
Choreo User Store manages user service API.
Odoo `govaid_disaster_recovery` manages disaster operation/resource workflow.
OpenG2P manages beneficiaries, eligibility, program enrollment, and entitlement/disbursement demo flow.

The main GovRecover360 Docker Compose file does not deploy OpenG2P. If your separate `govaid-connect-openg2p-demo` stack is running, point the backend to that stack:

```env
OPENG2P_ENABLED=true
OPENG2P_BASE_URL=http://localhost:8070
OPENG2P_API_BASE_URL=http://localhost:8070/api
OPENG2P_DB=openg2p
OPENG2P_USERNAME=admin
OPENG2P_PASSWORD=admin
```

When OpenG2P is disabled or unreachable, the backend returns mock demo responses so the disaster-aid flow can still be demonstrated.

OpenG2P backend endpoints:

```txt
GET  /api/openg2p/health
POST /api/openg2p/beneficiaries
GET  /api/openg2p/beneficiaries/{beneficiary_id}
POST /api/openg2p/eligibility/check
POST /api/openg2p/entitlements
```

Demo flow:

1. Sign in to GovRecover360.
2. Open Admin Dashboard, then `OpenG2P Demo`.
3. Enter affected citizen details.
4. Click `Create Beneficiary`.
5. Click `Check Eligibility`.
6. Confirm the result: Eligible, Not eligible, or Pending verification.
7. Click `Create Entitlement`.
8. Use `GET /api/integration/health` or `GET /api/openg2p/health` in Swagger to confirm configuration.

Values the user must input manually for OpenG2P:

- `OPENG2P_BASE_URL`
- `OPENG2P_API_BASE_URL`
- `OPENG2P_DB`
- `OPENG2P_USERNAME`
- `OPENG2P_PASSWORD`
- `OPENG2P_ENABLED`

## 8. Local Docker URLs

Use these while Docker Desktop is running locally:

```txt
Frontend:      http://localhost:3000
Backend API:   http://localhost:8000
Swagger Docs:  http://localhost:8000/docs
Nginx:         http://localhost
Superset:      http://localhost:8088
Odoo:          http://localhost:8069
AI Service:    http://localhost:8050
Notifications: http://localhost:8095
```

## Values The User Must Input Manually

- `VITE_ASGARDEO_CLIENT_ID`
- `VITE_API_BASE_URL`
- `VITE_CHOREO_USER_SERVICE_URL`
- `CHOREO_USER_SERVICE_URL`
- `CHOREO_SECURITY_HEADER_NAME`
- `CHOREO_SECURITY_HEADER_VALUE`
- `DATABASE_URL`
- `ODOO_DB`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`
- `FRONTEND_URL`
- `OPENG2P_BASE_URL`
- `OPENG2P_API_BASE_URL`
- `OPENG2P_DB`
- `OPENG2P_USERNAME`
- `OPENG2P_PASSWORD`
- `OPENG2P_ENABLED`

## Validation

Frontend:

```bash
cd frontend
npm install
npm run build
```

Backend:

```bash
cd backend
python -m compileall .
```

Health checks:

```txt
GET /api/health
GET /api/integrations/status
GET /api/integration/health
GET /api/openg2p/health
```
