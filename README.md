# GovRecover360 - Disaster Recovery Platform

A comprehensive disaster recovery and relief management platform designed for government agencies to coordinate, track, and manage disaster response operations. Built for the National Disaster Management Centre (NDMC) to handle end-to-end disaster relief workflows including beneficiary registration, verification, relief distribution, payment processing, inventory management, and real-time analytics.

## Business Story

In the aftermath of the 2024 Southwest Monsoon Floods, which affected over 50,000 families across six districts, the NDMC faced significant challenges in coordinating relief efforts. Paper-based processes led to duplication of benefits, delayed disbursements, and lack of transparency. GovRecover360 was built to digitize and streamline the entire disaster recovery lifecycle.

The platform enables government agencies to register affected households, assess damage, verify eligibility, approve relief packages, process payments, dispatch aid through NGO partners, and provide real-time visibility to auditors and citizens. With integrated AI capabilities, the platform generates damage summaries, citizen communications, and disaster reports automatically.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL/PostGIS |
| Cache | Redis 7 |
| ERP | Odoo 17 |
| Analytics | Apache Superset |
| Reverse Proxy | Nginx |
| AI/ML | OpenAI, Google Gemini, Minimax AI (pluggable) |
| API Management | WSO2 API Manager |
| Identity | Asgardeo (OIDC/OAuth2) |
| GIS | GeoNode (PostGIS) |
| Notifications | Node.js/Express (Choreo deployable) |
| Containerization | Docker & Docker Compose |
| CI/CD | GitHub Actions |

## Prerequisites

- Docker (version 24.0 or higher)
- Docker Compose (version 2.20 or higher)
- Git (version 2.40 or higher)

## Quick Start

### Step 1: Clone the Repository

```
git clone https://github.com/government/GovRecover360.git
cd GovRecover360
```

### Step 2: Configure Environment Variables

```
cp .env.example .env
```

Edit the `.env` file to configure database passwords, secret keys, and AI provider settings. The default values work for local development.

To use Supabase Postgres instead of the local Docker Postgres database, set `DATABASE_URL` in `.env` to your Supabase shared pooler connection string:

```
DATABASE_URL=postgresql://postgres.rudxmttefdvebhmpzvsj:YOUR_URL_ENCODED_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Replace `YOUR_URL_ENCODED_PASSWORD` with the database password from Supabase. If the password contains characters such as `@`, `#`, `/`, `?`, or `:`, URL-encode it before placing it in the connection string.

### Step 3: Start All Services

```
docker compose up -d
```

This command builds and starts all services defined in `docker-compose.yml`. The initial startup may take several minutes as Docker images are downloaded and built.

For a connected integration demo with bundled OpenG2P and WSO2 gateway containers, run:

```
docker compose --env-file .env.demo up -d --build
```

### Step 4: Access the Services

Once all containers are running, access the platform at the following URLs:

| Service | URL | Credentials |
|---|---|---|
| Frontend (UI) | http://localhost:3000 | See demo users below |
| Backend API (Swagger) | http://localhost:8000/docs | - |
| Backend Health | http://localhost:8000/api/health | - |
| OpenG2P Demo Runtime | http://localhost:8070/api/health | - |
| WSO2 Demo Gateway | http://localhost:8243/health | - |
| Backend through WSO2 Gateway | http://localhost:8243/api/health | - |
| Notification Health | http://localhost:8095/health | - |
| Odoo ERP | http://localhost:8069 | admin / admin |
| Apache Superset | http://localhost:8088 | admin / admin |
| AI Service | http://localhost:8050 | - |
| Nginx Reverse Proxy | http://localhost:80 | - |

### Step 5: Login

All demo users use the password **Demo@12345**:

| Email | Role | District | Organization |
|---|---|---|---|
| admin@govrecover.local | Administrator | Colombo | NDMC |
| field@govrecover.local | Field Officer | Galle | NDMC |
| verifier@govrecover.local | Verifier | Colombo | NDMC |
| manager@govrecover.local | Program Manager | Colombo | NDMC |
| finance@govrecover.local | Finance Officer | Colombo | NDMC |
| warehouse@govrecover.local | Warehouse Officer | Colombo | NDMC |
| gis@govrecover.local | GIS Officer | Colombo | NDMC |
| ngo@govrecover.local | NGO Partner | Colombo | Red Cross |
| auditor@govrecover.local | Auditor | Colombo | Audit Department |
| citizen@govrecover.local | Citizen | Galle | - |
| disaster-manager@govrecover.local | Disaster Manager | Colombo | NDMC |

Seed data includes the demo event **Western Province Flood 2026** with type `Flood`, severity `Critical`, affected districts `Colombo`, `Gampaha`, and `Kalutara`, plus the household **Mohamed Rizwan / 901234567V** in `Gampaha`, `Negombo`, `Pitipana`.

## Project Structure

```
GovRecover360/
├── ai-service/                    # AI/ML microservice (FastAPI)
│   ├── app/
│   │   ├── main.py               # AI service endpoints
│   │   └── config.py             # Provider configuration
│   ├── providers/                 # OpenAI, Gemini, Minimax providers
│   └── Dockerfile
├── backend/                       # Main API service (FastAPI)
│   ├── app/
│   │   ├── api/                   # Route handlers
│   │   │   ├── auth.py           # Authentication & user management
│   │   │   ├── ai.py             # AI summarization endpoints
│   │   │   ├── audit.py          # Audit log retrieval
│   │   │   ├── disasters.py      # Disaster event CRUD
│   │   │   ├── gis.py            # GIS zone & shelter management
│   │   │   ├── households.py     # Household registration
│   │   │   ├── inventory.py      # Inventory & dispatch orders
│   │   │   ├── notifications.py  # User notifications
│   │   │   ├── payments.py       # Payment requests & approval
│   │   │   ├── reports.py        # Aggregated reports
│   │   │   └── verification.py   # Relief application workflow
│   │   ├── core/
│   │   │   ├── config.py         # Application settings
│   │   │   └── security.py       # JWT, password hashing, RBAC
│   │   ├── db/database.py        # SQLAlchemy engine & session
│   │   ├── middleware/
│   │   │   ├── rbac_middleware.py # Request-level RBAC
│   │   │   └── audit_middleware.py # Audit logging middleware
│   │   ├── models/models.py      # SQLAlchemy ORM models
│   │   ├── schemas/schemas.py    # Pydantic request/response schemas
│   │   ├── services/audit_service.py # Audit log creation
│   │   ├── main.py               # FastAPI app entrypoint
│   │   └── seed.py               # Database seeder (roles, users, data)
│   ├── migrations/               # Alembic migrations
│   ├── tests/                    # Test suite
│   └── Dockerfile
├── choreo-notification-service/  # Notification service (Node.js)
│   ├── index.js                  # Express server for SMS/Email
│   ├── openapi.yaml              # OpenAPI specification
│   └── Dockerfile
├── config/
│   ├── nginx/default.conf        # Nginx reverse proxy config
│   ├── superset/superset_config.py # Superset configuration
│   └── wso2/                     # WSO2 API Manager configs
├── data/                         # Volume mount points
│   ├── geonode/
│   ├── odoo/
│   ├── postgres/
│   └── superset/
├── docs/                         # Documentation
│   ├── asgardeo/ASGARDEO_GUIDE.md
│   ├── choreo/CHOREO_GUIDE.md
│   ├── postman/GovRecover360.postman_collection.json
│   ├── superset/SUPERSET_GUIDE.md
│   └── wso2/WSO2_GUIDE.md
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/AuthContext.tsx # Auth state management
│   │   ├── hooks/                # Custom React hooks
│   │   ├── pages/                # Page components per role
│   │   ├── services/api.ts       # Axios API client
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Utility functions
│   └── Dockerfile
├── odoo/
│   └── addons/                   # Custom Odoo modules
├── docker-compose.yml            # Multi-service orchestration
├── .env.example                  # Environment variable template
├── ARCHITECTURE.md               # System architecture document
├── ACCESS_CONTROL_MATRIX.md      # RBAC permission matrix
├── DEMO_SCRIPT.md                # Client demonstration guide
└── TROUBLESHOOTING.md            # Common issues and solutions
```

## Architecture Overview

GovRecover360 follows a microservices architecture with a React frontend communicating through Nginx reverse proxy to a FastAPI backend. The backend handles business logic, authentication, and data persistence with PostgreSQL/PostGIS. Redis provides caching and session management. Supplementary services include Odoo ERP for financial and logistics modules, Apache Superset for analytics dashboards, and a dedicated AI service for LLM-powered features. WSO2 API Manager provides API governance, rate limiting, and security. Asgardeo handles OIDC-based identity management.

For a complete architecture overview including system diagrams and data flows, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Demo Flow

A complete walkthrough of the platform's capabilities from GIS mapping through relief distribution is available in [DEMO_SCRIPT.md](DEMO_SCRIPT.md). The demo covers all 11 roles including admin setup, field operations, verification, approval workflows, and AI features.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DB_PASSWORD` | PostgreSQL password for application database | govrecover_2026 |
| `DATABASE_URL` | Full backend PostgreSQL/Supabase SQLAlchemy connection URL. Overrides local Docker Postgres when set. | local Docker Postgres |
| `SECRET_KEY` | JWT signing and encryption secret | (change in production) |
| `FRONTEND_URL` | Frontend origin allowed by backend CORS | http://localhost:3000 |
| `REDIS_URL` | Redis connection string | redis://redis:6379/0 |
| `AI_PROVIDER` | AI provider (mock, openai, gemini, minimax) | mock |
| `OPENAI_API_KEY` | OpenAI API key | (optional) |
| `GEMINI_API_KEY` | Google Gemini API key | (optional) |
| `MINIMAX_API_KEY` | Minimax AI API key | (optional) |
| `ODOO_DB_PASSWORD` | Odoo database password | odoo@2026 |
| `SUPERSET_SECRET_KEY` | Superset Flask session key | (change in production) |
| `SUPERSET_ADMIN_PASSWORD` | Superset admin password | admin |

## AI Features

The platform includes an AI microservice that supports multiple large language model providers. The default `mock` provider returns sample responses without requiring API keys. To use real AI providers, set `AI_PROVIDER` to `openai`, `gemini`, or `minimax` and configure the corresponding API key.

Available AI endpoints:
- **POST /api/ai/summarize-damage** - Generate damage assessment summaries from field notes
- **POST /api/ai/generate-citizen-message** - Generate personalized citizen notifications
- **POST /api/ai/generate-disaster-report** - Generate comprehensive disaster impact reports
- **POST /api/ai/auditor-summary** - Summarize audit log activity

## API Documentation

Interactive API documentation is available at http://localhost:8000/docs (Swagger UI) when the backend service is running.

### Postman API Tests

Import `docs/postman/GovRecover360.postman_collection.json` into Postman. Start the stack first, then run the Authentication login requests for each seeded role to populate tokens. The Tests folder includes demo RBAC checks for:

- Field Officer can register a citizen through `POST /api/citizens/register`.
- Field Officer cannot approve payment through `POST /api/payments/approve`.
- Finance Officer can approve payment through `POST /api/payments/approve`.
- Auditor can read `GET /api/audit/logs` but cannot dispatch inventory.
- Citizen is denied when reading another citizen's beneficiary/application.

The collection also keeps the original resource URLs such as `/api/households/register`, `/api/applications/{id}/approve-relief`, `/api/payments/{id}/approve`, and `/api/dispatch-orders/{id}/dispatch`.

### External Integrations

Local demo mode works without Asgardeo, GeoNode, Odoo credentials, or Choreo invoke URLs. The Docker Compose demo includes OpenG2P-compatible and WSO2 API Manager-compatible services so they appear in `docker compose ps` and can be shown during the demo.

To force all external integrations off, use:

```
OPENG2P_ENABLED=false
WSO2_APIM_ENABLED=false
GEONODE_ENABLED=false
```

For the bundled connected demo, run `docker compose --env-file .env.demo up -d --build`. For live external platforms, configure these values in `.env`: `AUTH_MODE=hybrid`, `ASGARDEO_*`, `WSO2_APIM_ENABLED=true`, `WSO2_*`, `CHOREO_NOTIFIER_API_URL`, `CHOREO_USER_SERVICE_URL`, `GEONODE_ENABLED=true`, `GEONODE_URL`, `ODOO_*`, and `OPENG2P_ENABLED=true` with `OPENG2P_*`. If any external service is disabled or unavailable, the backend returns a clear health status and keeps using local fallback behavior.

Integration health endpoints:

- `GET /api/integrations/openg2p/health`
- `GET /api/integrations/openg2p/status`
- `GET /api/integrations/wso2/health`
- `GET /api/integrations/wso2/status`
- `GET /api/integrations/geonode/health`

Integration functions:

- OpenG2P beneficiary sync: `POST /api/openg2p/beneficiaries`
- Backend-mediated OpenG2P sync: `POST /api/integrations/openg2p/sync-beneficiary`
- Backend-mediated OpenG2P eligibility: `POST /api/integrations/openg2p/check-eligibility`
- Backend-mediated OpenG2P entitlements: `GET /api/integrations/openg2p/entitlements`
- OpenG2P relief program enrollment: `POST /api/openg2p/program-enrollments`
- WSO2 scope support: when `WSO2_APIM_ENABLED=true` and JWT settings are present, backend can validate WSO2-issued JWTs and map scopes such as `citizen:create`, `relief:approve`, `payment:approve`, and `geo:manage` to platform permissions.
- GeoNode layers and GIS fallback: `GET /api/gis/layers`, `GET /api/gis/zones`, and `POST /api/gis/eligibility-check`

### Admin Integration Command Center

Admins can open `/admin/integrations` to show the GovRecover360 Integration Command Center. The page normalizes both string and object integration statuses, shows demo mode vs production setup requirements, and provides console buttons for WSO2, Asgardeo, Choreo, Superset, Odoo, OpenG2P, and the AI service.

For the local Docker frontend on `http://localhost:3000`, set `VITE_API_BASE_URL=http://localhost:8000` so browser API calls go directly to FastAPI. For the Nginx-hosted demo, use `VITE_API_BASE_URL=http://localhost/api`. If the browser receives the React HTML shell instead of JSON, the page displays: `Backend API returned HTML instead of JSON. Check VITE_API_BASE_URL.`

Asgardeo and Choreo are opened in new tabs because cloud consoles commonly block iframe embedding with `X-Frame-Options` or Content Security Policy. The local WSO2 service is a demo-compatible gateway; production uses full WSO2 API Manager with published APIs, subscriptions, and token validation. If Odoo General Settings shows a `stock_move_sms_validation` popup, use the direct Odoo Disaster Recovery module button during the demo and install the missing optional dependency only after confirming the Odoo module source.

## Troubleshooting

If you encounter issues during setup or operation, refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for solutions to common problems including Docker Compose issues, database connection failures, and service-specific errors.

## License

This project is developed for government use. All rights reserved.

## Disclaimer

This software is provided for demonstration and evaluation purposes. Production deployment requires additional security hardening, including but not limited to: strong encryption keys, TLS certificates, network segmentation, regular security audits, and compliance with applicable data protection regulations.
