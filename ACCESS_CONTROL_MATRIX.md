# GovRecover360 - Access Control Matrix

## Role-Based Permissions

The following matrix defines the permissions assigned to each role. Permissions are enforced via the RBAC middleware and FastAPI dependency injection.

| Permission | Admin | Disaster Manager | Field Officer | Verifier | Program Manager | Finance Officer | Warehouse Officer | GIS Officer | NGO Partner | Auditor | Citizen |
|---|---|---|---|---|---|---|---|---|---|---|---|
| citizen:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| citizen:create | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| citizen:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| beneficiary:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| beneficiary:verify | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| relief:read | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| relief:approve | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| payment:read | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| payment:approve | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| inventory:read | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| inventory:dispatch | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| geo:read | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| geo:manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| audit:read | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| admin:manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| report:read | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| ai:generate | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## API Endpoint to Permission Mapping

| Endpoint | Method | Permission | Allowed Roles |
|---|---|---|---|
| `/api/auth/login` | POST | None (public) | All |
| `/api/auth/me` | GET | None (authenticated) | All authenticated |
| `/api/users` | GET | admin:manage | Admin |
| `/api/users` | POST | admin:manage | Admin |
| `/api/users/{id}/roles` | POST | admin:manage | Admin |
| `/api/users/{id}` | GET | admin:manage | Admin |
| `/api/disasters` | GET | None (authenticated) | All authenticated |
| `/api/disasters` | POST | report:read (+role check) | Admin, Disaster Manager, Program Manager |
| `/api/disasters/{id}` | GET | None (authenticated) | All authenticated |
| `/api/disasters/{id}` | PATCH | report:read (+role check) | Admin, Disaster Manager, Program Manager |
| `/api/households/register` | POST | citizen:create | Admin, Field Officer, Citizen |
| `/api/households` | GET | None (authenticated) | All authenticated |
| `/api/households/{id}` | GET | None (authenticated) | All authenticated |
| `/api/households/{id}` | PATCH | None (authenticated + role check) | Admin, Field Officer |
| `/api/households/{id}/damage-assessment` | POST | ROLE_FIELD_OFFICER | Field Officer |
| `/api/applications` | POST | None (authenticated) | All authenticated |
| `/api/applications` | GET | None (authenticated) | All authenticated |
| `/api/applications/{id}` | GET | None (authenticated) | All authenticated |
| `/api/applications/{id}/submit` | POST | None (authenticated) | Citizen, Field Officer, Admin |
| `/api/applications/{id}/verify` | POST | beneficiary:verify | Admin, Verifier |
| `/api/applications/{id}/reject` | POST | beneficiary:verify | Admin, Verifier |
| `/api/applications/{id}/approve-relief` | POST | relief:approve | Admin, Disaster Manager, Program Manager |
| `/api/payments` | GET | None (authenticated) | All authenticated |
| `/api/payments` | POST | payment:read | Requires payment:read |
| `/api/payments/{id}` | GET | None (authenticated) | All authenticated |
| `/api/payments/{id}/approve` | POST | payment:approve | Admin, Finance Officer |
| `/api/inventory` | GET | None (authenticated) | All authenticated |
| `/api/inventory/{id}` | GET | None (authenticated) | All authenticated |
| `/api/inventory/items` | POST | inventory:read (+role check) | Admin, Warehouse Officer |
| `/api/inventory/{id}` | PATCH | inventory:read (+role check) | Admin, Warehouse Officer |
| `/api/warehouses` | GET | None (authenticated) | All authenticated |
| `/api/warehouses` | POST | ROLE_ADMIN | Admin |
| `/api/dispatch-orders` | GET | None (authenticated) | All authenticated |
| `/api/dispatch-orders` | POST | inventory:read (+role check) | Admin, Warehouse Officer, Program Manager |
| `/api/dispatch-orders/{id}/dispatch` | POST | inventory:dispatch | Admin, Warehouse Officer |
| `/api/gis/zones` | GET | None (authenticated) | All authenticated |
| `/api/gis/zones` | POST | geo:manage | Admin, GIS Officer |
| `/api/gis/shelters` | GET | None (authenticated) | All authenticated |
| `/api/gis/shelters` | POST | geo:manage | Admin, GIS Officer |
| `/api/reports/summary` | GET | None (authenticated) | All authenticated |
| `/api/reports/by-district` | GET | None (authenticated) | All authenticated |
| `/api/reports/by-status` | GET | None (authenticated) | All authenticated |
| `/api/reports/inventory` | GET | None (authenticated) | All authenticated |
| `/api/reports/ngo-performance` | GET | None (authenticated) | All authenticated |
| `/api/audit-logs` | GET | audit:read | Admin, Disaster Manager, Auditor |
| `/api/notifications` | GET | None (authenticated) | All authenticated |
| `/api/notifications/{id}/read` | PATCH | None (authenticated) | All authenticated |
| `/api/notifications/unread-count` | GET | None (authenticated) | All authenticated |
| `/api/ai/summarize-damage` | POST | None (authenticated) | All authenticated |
| `/api/ai/generate-citizen-message` | POST | None (authenticated) | All authenticated |
| `/api/ai/generate-disaster-report` | POST | None (authenticated) | All authenticated |
| `/api/health` | GET | None (public) | All |

## WSO2 Scope Mapping

When API management is handled through WSO2 API Manager, the following scopes map to platform permissions:

| WSO2 Scope | Platform Permission | Description |
|---|---|---|
| `citizen:read` | citizen:read | View citizen/household information |
| `citizen:write` | citizen:create | Register new citizens/households |
| `citizen:manage` | citizen:update | Update citizen records |
| `beneficiary:read` | beneficiary:read | View beneficiary data |
| `beneficiary:verify` | beneficiary:verify | Verify beneficiary applications |
| `relief:read` | relief:read | View relief program information |
| `relief:approve` | relief:approve | Approve relief applications |
| `payment:read` | payment:read | View payment requests |
| `payment:approve` | payment:approve | Approve payment disbursements |
| `inventory:read` | inventory:read | View inventory levels |
| `inventory:dispatch` | inventory:dispatch | Dispatch inventory items |
| `geo:read` | geo:read | View GIS data and zones |
| `geo:manage` | geo:manage | Create and edit GIS zones |
| `audit:read` | audit:read | View audit logs |
| `admin:manage` | admin:manage | Full administrative access |
| `report:read` | report:read | View reports and dashboards |
| `ai:generate` | ai:generate | Generate AI-powered content |

## Role Hierarchy

```
ROLE_ADMIN (Full System Access)
  |
  ├── ROLE_DISASTER_MANAGER (Strategic oversight, relief approval, audit view)
  |
  ├── ROLE_PROGRAM_MANAGER (Program management, relief approval, inventory view)
  |
  ├── ROLE_FINANCE_OFFICER (Payment processing and approval)
  |
  ├── ROLE_WAREHOUSE_OFFICER (Inventory management and dispatch)
  |
  ├── ROLE_GIS_OFFICER (Geospatial data management)
  |
  ├── ROLE_VERIFIER (Beneficiary verification)
  |
  ├── ROLE_FIELD_OFFICER (Household registration and assessment)
  |
  ├── ROLE_NGO_PARTNER (Relief delivery and task management)
  |
  ├── ROLE_AUDITOR (Read-only access to reports and logs)
  |
  └── ROLE_CITIZEN (Self-service: own household and applications only)
```

### Permission Inheritance

The system uses explicit permission assignment rather than hierarchical inheritance. Each role is assigned a distinct set of permissions as defined in `backend/app/seed.py`. The `ROLE_ADMIN` is the only role that includes the `admin:manage` permission, which serves as a super-admin flag that bypasses all permission checks in the `require_permission` dependency.

### Data-Level Access Controls

Beyond API-level permissions, certain endpoints enforce row-level access based on the authenticated user's role and identity:

- **Citizens**: Can only view their own households, applications, and notifications
- **Field Officers**: Can view households they registered plus unassigned registered households
- **Verifiers/Program Managers/Finance Officers**: Can view households in relevant statuses (REGISTERED, ASSESSED)
- **Auditors**: Can view all reports and audit logs (read-only)
- **Admin**: Full unrestricted access to all records

### Security Notes

- All permission checks are server-side; frontend role-based UI rendering is for user experience only
- The `require_permission` dependency checks the user's assigned permissions against the required permission
- Admin users bypass permission checks via the `admin:manage` override
- Role checks via `require_role` are used for operations where specific role identity matters (e.g., damage assessment requires Field Officer role specifically)
