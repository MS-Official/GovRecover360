# GovRecover360 - System Architecture

## Architecture Overview

GovRecover360 employs a microservices architecture deployed via Docker Compose. The platform consists of eight core services plus supporting infrastructure. Each service runs in its own container and communicates over a shared Docker network. The Nginx reverse proxy serves as the single entry point for all HTTP traffic, routing requests to the appropriate service based on URL path.

## High-Level Architecture

```mermaid
graph TD
    User[Users] --> FE[React Frontend :3000]
    FE --> Nginx[Nginx Reverse Proxy :80]
    Nginx --> BE[FastAPI Backend :8000]
    Nginx --> Odoo[Odoo ERP :8069]
    Nginx --> Superset[Apache Superset :8088]
    BE --> PG[(PostgreSQL/PostGIS)]
    BE --> Redis[(Redis Cache)]
    BE --> AI[AI Service :8050]
    AI --> OpenAI[OpenAI API]
    AI --> Gemini[Google Gemini]
    AI --> Minimax[Minimax AI]
    BE --> WSO2[WSO2 API Manager]
    Odoo --> OdooDB[(Odoo PostgreSQL)]
    Superset --> PG
    GeoNode[GeoNode GIS] --> PostGIS[(PostGIS)]
```

### Component Descriptions

| Component | Technology | Purpose |
|---|---|---|
| React Frontend | React 18, TypeScript, Vite | Single-page application providing role-based dashboards for all user types |
| Nginx Reverse Proxy | Nginx Alpine | Routes traffic to appropriate services, handles CORS, security headers, and SSL termination |
| FastAPI Backend | Python 3.11, FastAPI | Core business logic, REST API, authentication, RBAC enforcement, data persistence |
| PostgreSQL/PostGIS | PostGIS 15 | Primary data store with geospatial extensions for GIS operations |
| Redis Cache | Redis 7 | Session caching, rate limiting, temporary data storage |
| AI Service | Python, FastAPI | LLM-powered features with pluggable provider architecture |
| Odoo ERP | Odoo 17 | Financial management, procurement, HR, and logistics modules |
| Apache Superset | Apache Superset | Analytics dashboards, SQL Lab, scheduled reports |
| WSO2 API Manager | WSO2 APIM | API governance, rate limiting, OAuth2 token validation, analytics |
| GeoNode GIS | GeoNode | Geospatial data management, map visualization, layer publishing |

## Authentication Flow

```mermaid
sequenceDiagram
    User->>Frontend: Login (email+password or OIDC)
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Verify credentials
    Backend->>Backend: Generate JWT (role, permissions)
    Backend-->>Frontend: Return JWT token
    Frontend->>LocalStorage: Store token
    Frontend->>Backend: API calls with Bearer token
    Backend->>Backend: Validate JWT, check permissions
    Backend-->>Frontend: Response
```

The platform supports two authentication modes:

1. **Local Authentication** - The backend verifies email/password against the users table, generates a JWT containing user ID, email, role, and permissions list. The JWT is signed with HS256 using the configured SECRET_KEY.

2. **OIDC Authentication (Asgardeo)** - Users authenticate via Asgardeo's OIDC provider. The frontend redirects to Asgardeo's login page, receives an ID token, and exchanges it with the backend for a platform JWT.

## Disaster Recovery Workflow

```mermaid
graph LR
    GIS[GIS Officer] --> Zone[Mark Flood Zones]
    Field[Field Officer] --> Register[Register Households]
    Register --> Verify[Verifier Checks Eligibility]
    Verify --> Manager[Program Manager Approves]
    Manager --> Finance[Finance Officer Approves Payment]
    Manager --> Warehouse[Warehouse Officer Dispatches Aid]
    Citizen[Citizen] --> Status[Check Application Status]
    Auditor[Auditor] --> Reports[View Reports & Logs]
```

The disaster recovery workflow follows a sequential pipeline:

1. **GIS Officer** maps affected zones using GeoNode
2. **Field Officer** registers affected households with damage assessments
3. **Citizen** (or Field Officer) submits a relief application
4. **Verifier** reviews documentation and verifies eligibility
5. **Program Manager** approves relief allocation
6. **Finance Officer** approves payment disbursement
7. **Warehouse Officer** dispatches physical aid items
8. **NGO Partner** delivers aid to the household
9. **Citizen** tracks application status
10. **Auditor** reviews reports and audit logs

## Role-Based Access Control (RBAC)

```mermaid
graph TD
    User[User Request] --> Auth{Authenticated?}
    Auth -->|No| Login[Login Page]
    Auth -->|Yes| RoleCheck{Role Check}
    RoleCheck -->|Admin| Admin[Full Access]
    RoleCheck -->|Field Officer| FO[Register Households]
    RoleCheck -->|Verifier| Ver[Verify Applications]
    RoleCheck -->|Program Manager| PM[Approve Relief]
    RoleCheck -->|Finance Officer| Fin[Approve Payments]
    RoleCheck -->|Warehouse Officer| WH[Dispatch Inventory]
    RoleCheck -->|GIS Officer| GIS[Manage Zones]
    RoleCheck -->|NGO Partner| NGO[View Assigned Tasks]
    RoleCheck -->|Auditor| Aud[Read-only Reports]
    RoleCheck -->|Citizen| Cit[Own Application]
```

The RBAC system enforces access control at two levels:

- **Middleware Level** - The RBACMiddleware extracts JWT claims (role, permissions) on every request and attaches them to `request.state`
- **Dependency Level** - Route handlers use `require_permission()` and `require_role()` FastAPI dependencies to enforce granular access
- Admin users bypass all role checks and have full system access

## Data Flow

```mermaid
graph TD
    GeoNode -->|Exports GIS Layers| PG[(PostGIS)]
    Odoo -->|Syncs Inventory| PG
    FieldOfficer -->|Registers| PG
    Backend -->|Reads/Writes| PG
    Backend -->|Caches| Redis
    Backend -->|Generates Reports| Superset
    Superset -->|Reads| PG
    Backend -->|AI Requests| AI[AI Service]
    AI -->|LLM Calls| OpenAI
    AI -->|LLM Calls| Gemini
    AI -->|LLM Calls| Minimax
    Backend -->|Notifications| Choreo[Notification Service]
    Choreo -->|SMS/Email| Citizen
```

## Security Architecture

### Authentication & Authorization

- **Password Hashing**: bcrypt via passlib
- **JWT Tokens**: HS256 signed with configurable SECRET_KEY
- **Token Expiry**: 60 minutes by default (configurable)
- **Role Enforcement**: Requires appropriate role or `admin:manage` permission for admin-level operations
- **Permission Checks**: Fine-grained permissions enforced via FastAPI dependency injection

### Network Security

- All inter-service communication occurs over Docker's internal network
- Nginx adds security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- CORS is restricted to frontend origin (http://localhost:3000)
- Backend CORS middleware enforces allowed origins

### Audit Trail

The AuditMiddleware automatically logs all non-GET, non-OPTIONS requests to the `audit_logs` table, capturing:
- User ID, email, and role
- HTTP method and path
- Resource type derived from URL path
- IP address
- Timestamp

### API Security

- WSO2 API Manager provides OAuth2 token validation
- Rate limiting and throttling policies
- API subscription management
- Request/response logging and analytics

## Service Dependencies

```
frontend  ──depends-on──> backend
backend   ──depends-on──> postgres, redis
odoo      ──depends-on──> odoo-db
superset  ──depends-on──> postgres
nginx     ──depends-on──> frontend, backend
```

All services are defined in `docker-compose.yml` with health checks for PostgreSQL and Redis to ensure proper startup ordering.

## Container Volumes

| Volume | Mount Point | Service | Purpose |
|---|---|---|---|
| postgres_data | /var/lib/postgresql/data | postgres | Persistent database storage |
| redis_data | /data | redis | Cache persistence across restarts |
| odoo_data | /var/lib/odoo | odoo | Odoo filestore and database |
| odoo_db_data | /var/lib/postgresql/data | odoo-db | Odoo's PostgreSQL data |
| superset_data | /app/superset_home | superset | Superset metadata and uploads |
