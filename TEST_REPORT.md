# GovRecover360 Test Report

## Test Date

2026-05-30

## Environment

- Local Docker Compose on macOS
- Project path: `/Users/shurafa28/Desktop/GovRecover360`
- Secrets were not printed in this report.

## Services Tested

- Docker Compose and environment resolution
- Backend FastAPI health, audit logs, and RBAC
- Frontend static app and nginx API proxy
- PostgreSQL and Redis connectivity
- Odoo container and GovAid Disaster Recovery module
- Choreo-compatible notification service
- AI service health endpoint
- Superset container availability

## Commands Executed

- `docker compose config`
- `docker compose up -d --build`
- `docker compose ps`
- `docker compose logs --tail=80 backend`
- `docker compose logs --tail=60 frontend`
- `docker compose logs --tail=60 odoo`
- `docker compose logs --tail=60 choreo-notification-service`
- `docker compose logs --tail=60 nginx`
- `docker compose restart backend`
- `docker compose restart odoo`
- `docker compose restart nginx`
- `docker compose exec -T postgres ... ALTER USER ...`
- `docker compose exec -T odoo ... -i govaid_disaster_recovery --stop-after-init --no-http ...`
- `curl -i http://localhost:8000/api/health`
- `curl -i http://localhost/api/health`
- `curl -i http://localhost:8000/api/audit-logs`
- `curl -i http://localhost/api/audit-logs`
- `curl -i http://localhost:8095/health`
- `npm install` in `choreo-notification-service`
- `npm audit --audit-level=low` in `frontend`
- `npm audit --audit-level=low` in `choreo-notification-service`
- `npm run build` in `frontend`

## Results

| Area | Status | Result |
|---|---|---|
| Docker Compose/env | FIXED | Compose config validates. Full rebuild completes. Existing Postgres role password was aligned to active `.env` value without printing secrets. Compose still warns that `version` is obsolete. |
| Backend health | FIXED | FastAPI startup no longer fails. Direct `/api/health` returns 200. Nginx `/api/health` returns 200 after nginx restart. |
| Backend audit endpoint | PASSED | `/api/audit-logs` returns 403 unauthenticated and 200 for auditor token. No crash/reset. |
| Backend RBAC | PASSED | Minimum RBAC checks passed for Field Officer, Finance Officer, Auditor, and Admin. |
| Frontend/API | PASSED | `http://localhost:3000` returns 200. `http://localhost` returns 200. Nginx API proxy returns 200 for `/api/health`. |
| Seed data/demo users | FIXED | Seeder now creates/updates documented `.local` demo users with shared `Demo@12345` password. |
| Odoo connector/module | FIXED | Odoo is reachable. Module import error fixed. Odoo 17 view modifiers fixed. CLI install of `govaid_disaster_recovery` completed successfully. |
| OpenG2P alignment | NOT IMPLEMENTED | No runtime OpenG2P integration was tested in this pass. |
| Asgardeo | MANUAL ACTION REQUIRED | Docs exist, but no live console configuration or JWT validation flow was proven. |
| WSO2 API Manager | MANUAL ACTION REQUIRED | Docs exist, but no live WSO2 import/publish flow was proven. |
| Choreo notification service | FIXED | Service added to Compose on port 8095 with healthcheck. `http://localhost:8095/health` returns 200. npm audit reports 0 vulnerabilities. |
| Integration status endpoint | NOT IMPLEMENTED | `/api/integrations/status` returns 404 directly and through nginx. |
| Frontend dependency audit | BLOCKED | Current Vite 5.4.21 is latest Vite 5.x but still affected by the moderate esbuild dev-server advisory. `npm audit fix --force` would jump to Vite 8, so it was not applied. Production build passes. |

## Error Messages Found

- Backend startup before fix: `pydantic.errors.PydanticUndefinedAnnotation: name 'UserResponse' is not defined`
- Odoo module before fix: `ImportError: cannot import name 'validation' from 'odoo'`
- Odoo module install before view fix: `Since 17.0, the "attrs" and "states" attributes are no longer used.`
- Backend after full rebuild before DB alignment: `password authentication failed for user "govrecover"`
- Integration endpoint: `404 Not Found`
- Frontend audit: moderate `vite -> esbuild` advisory affecting Vite dev server.

## Fixes Applied

- Moved `TokenResponse` below `UserResponse` and removed the unresolved forward reference.
- Updated demo seed users to documented `.local` accounts and shared demo password.
- Made the seeder update existing demo users idempotently.
- Replaced invalid Odoo `validation` import with `ValidationError`.
- Converted Odoo 17-incompatible `states`/`attrs` XML modifiers to inline `invisible` expressions.
- Installed the Odoo module via CLI to verify module load.
- Standardized notification service local port to 8095.
- Added `choreo-notification-service` to Docker Compose with healthcheck.
- Generated `choreo-notification-service/package-lock.json`.
- Aligned the existing Postgres role password to the active Compose environment without printing it.

## Manual Actions Required

### Odoo UI

The module is installed by CLI. To verify in the UI:

1. Open `http://localhost:8069`.
2. Log in as the Odoo admin user.
3. Enable developer mode.
4. Open Apps.
5. Update Apps List if needed.
6. Search `GovAid Disaster Recovery` or `govaid_disaster_recovery`.
7. Confirm the module is installed.
8. Open the Disaster Recovery menu and verify views load.

### Asgardeo Console

1. Create or open the GovRecover360 application in Asgardeo.
2. Configure redirect/logout URLs for the local frontend.
3. Configure issuer, JWKS URL, and audience in backend env if real Asgardeo mode is added.
4. Test a real login and token validation flow.

### WSO2 API Manager

1. Import the documented API artifacts.
2. Configure gateway URLs and backend endpoints.
3. Publish APIs.
4. Test subscription, token issuance, and gateway routing.

### Choreo Console

1. Deploy `choreo-notification-service`.
2. Configure environment variables for the Choreo environment.
3. Confirm the deployed `/health` endpoint.
4. Configure backend notification URL only after backend integration code exists.

## Final Demo Readiness Status

Demo-ready with manual platform setup.

Core local demo paths are healthy: frontend, nginx, backend, RBAC, seed users, Odoo module, notification service, Postgres, Redis, AI service, and Superset container availability. External platforms such as Asgardeo, WSO2, and Choreo still require real console setup. The backend integration status endpoint is not implemented, and the frontend retains a moderate Vite dev-server advisory unless a tested major Vite upgrade is accepted.
