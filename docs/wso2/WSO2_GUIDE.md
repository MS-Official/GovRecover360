# GovRecover360 - WSO2 API Manager Guide

## Overview

WSO2 API Manager provides API governance, security, rate limiting, and analytics for the GovRecover360 platform. It sits between the Nginx reverse proxy and the backend services, validating OAuth2 tokens, enforcing rate limits, and providing API analytics.

In the full production architecture, all API calls pass through WSO2 API Gateway before reaching the FastAPI backend. This enables:

- OAuth2/OIDC token validation
- Scope-based authorization mapping to RBAC permissions
- Rate limiting and throttling
- API subscription management via the Developer Portal
- API analytics and monitoring
- Request/response logging

---

## API List

The following APIs should be registered in WSO2 API Manager:

| API Name | Context | Version | Endpoints |
|---|---|---|---|
| Auth API | /api/auth | v1 | POST /login, GET /me |
| Disaster Events API | /api/disasters | v1 | GET, POST, GET /{id}, PATCH /{id} |
| Households API | /api/households | v1 | POST /register, GET, GET /{id}, PATCH /{id}, POST /{id}/damage-assessment |
| Relief Applications API | /api/applications | v1 | GET, POST, GET /{id}, POST /{id}/submit, POST /{id}/verify, POST /{id}/reject, POST /{id}/approve-relief |
| Payments API | /api/payments | v1 | GET, POST, GET /{id}, POST /{id}/approve |
| Inventory API | /api/inventory | v1 | GET, GET /{id}, POST /items, PATCH /{id} |
| Warehouses API | /api/warehouses | v1 | GET, POST |
| Dispatch API | /api/dispatch-orders | v1 | GET, POST, POST /{id}/dispatch |
| GIS API | /api/gis | v1 | GET /zones, POST /zones, GET /shelters, POST /shelters |
| Reports API | /api/reports | v1 | GET /summary, GET /by-district, GET /by-status, GET /inventory, GET /ngo-performance |
| Audit API | /api/audit-logs | v1 | GET |
| Notifications API | /api/notifications | v1 | GET, PATCH /{id}/read, GET /unread-count |
| AI API | /api/ai | v1 | POST /summarize-damage, POST /generate-citizen-message, POST /generate-disaster-report |

---

## Step-by-Step Setup

### Step 1: Download and Run WSO2 API Manager

WSO2 API Manager is not included in the default `docker-compose.yml`. To run it locally:

```bash
docker pull wso2/apim:4.2.0

docker run -d \
  --name govrecover-wso2 \
  -p 9443:9443 \
  -p 8280:8280 \
  -p 8243:8243 \
  -p 9763:9763 \
  wso2/apim:4.2.0
```

**Ports:**
- 9443: Admin Portal / Publisher (HTTPS)
- 8280: Gateway (HTTP)
- 8243: Gateway (HTTPS)
- 9763: Publisher (HTTP, localhost only)

Access the Admin Portal: https://localhost:9443/admin (credentials: admin/admin)

### Step 2: Create APIs

For each API in the list above:

1. Log in to **API Publisher** at https://localhost:9443/publisher
2. Click **Create API** -> **REST API**
3. Enter:
   - **Name**: e.g., "Disaster Events API"
   - **Context**: `/api/disasters`
   - **Version**: `v1`
   - **Endpoint**: `http://backend:8000/api/disasters`
4. Click **Create**
5. Add resources for each endpoint (see Step 3)

### Step 3: Define Resources and Scopes

For each API, add resources with the appropriate HTTP methods and scopes.

**Example: Households API**

| Resource | Method | Scope |
|---|---|---|
| `/api/households/register` | POST | `citizen:write` |
| `/api/households` | GET | `citizen:read` |
| `/api/households/{id}` | GET | `citizen:read` |
| `/api/households/{id}` | PATCH | `citizen:manage` |
| `/api/households/{id}/damage-assessment` | POST | `beneficiary:read` |

To add scopes:
1. Navigate to **API Publisher** -> select your API -> **API Configurations** -> **Scopes**
2. Click **Add Scope** and enter:
   - **Scope Key**: e.g., `citizen:read`
   - **Display Name**: "Read Citizen Data"
   - **Roles**: Select applicable roles (e.g., admin, field_officer)
3. Attach the scope to the corresponding resource

### Step 4: Configure OAuth2/OIDC with Asgardeo

1. In WSO2 Admin Portal, go to **Key Managers** -> **Add Key Manager**
2. Configure:
   - **Name**: Asgardeo
   - **Type**: OIDC
   - **Well-Known URL**: `https://api.asgardeo.io/t/<your-org>/oauth2/token/.well-known/openid-configuration`
   - **Client ID**: (from Asgardeo application)
   - **Client Secret**: (from Asgardeo application)
3. Click **Add**

### Step 5: Publish APIs to Developer Portal

1. In API Publisher, select the API
2. Go to **Lifecycle**
3. Click **Publish**
4. The API is now available in the Developer Portal at https://localhost:9443/devportal

### Step 6: Create Application and Subscribe

1. Log in to **Developer Portal** at https://localhost:9443/devportal
2. Click **Applications** -> **Add Application**
3. Name: "GovRecover360 Frontend"
4. **Token Type**: OAuth2
5. Click **Save**
6. Go to **Subscriptions** -> **Subscribe**
7. Select the published APIs and subscribe

### Step 7: Generate Access Tokens

1. In the Developer Portal, go to **Applications** -> **GovRecover360 Frontend** -> **Production Keys**
2. Click **Generate Keys**
3. To generate a token with specific scopes:

```bash
curl -X POST https://localhost:9443/oauth2/token \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=citizen:read citizen:write beneficiary:verify"
```

4. The response includes an `access_token` which can be used to call APIs

### Step 8: Test APIs with Different Role Tokens

Test that role-based access is enforced through WSO2:

```bash
# Test with Field Officer token (should succeed)
curl -H "Authorization: Bearer <field-officer-token>" \
  http://localhost:8280/api/households/register

# Test with Citizen token trying to access audit (should fail)
curl -H "Authorization: Bearer <citizen-token>" \
  http://localhost:8280/api/audit-logs
```

---

## Scope Mapping Table

| WSO2 Scope | Platform Permission | Description |
|---|---|---|
| `citizen:read` | citizen:read | View citizen/household data |
| `citizen:write` | citizen:create | Register new households |
| `citizen:manage` | citizen:update | Update household records |
| `beneficiary:read` | beneficiary:read | View beneficiary information |
| `beneficiary:verify` | beneficiary:verify | Verify beneficiary applications |
| `relief:read` | relief:read | View relief programs |
| `relief:approve` | relief:approve | Approve relief applications |
| `payment:read` | payment:read | View payment requests |
| `payment:approve` | payment:approve | Approve payments |
| `inventory:read` | inventory:read | View inventory |
| `inventory:dispatch` | inventory:dispatch | Dispatch inventory |
| `geo:read` | geo:read | View GIS data |
| `geo:manage` | geo:manage | Manage GIS zones |
| `audit:read` | audit:read | View audit logs |
| `admin:manage` | admin:manage | Full admin access |
| `report:read` | report:read | View reports |
| `ai:generate` | ai:generate | Use AI features |

---

## Throttling Policies

Configure the following throttling policies in WSO2:

| Policy | Rate Limit | Burst Limit | Applied To |
|---|---|---|---|
| Silver | 1000 req/min | 100 req | All standard APIs |
| Gold | 5000 req/min | 500 req | Admin and reporting APIs |
| Unlimited | - | - | Internal/admin APIs |

To configure:
1. In Admin Portal, go to **Rate Limiting Policies**
2. Click **Add Policy** -> **Subscription Level**
3. Configure rate limits and assign to API subscriptions

---

## API Analytics Configuration

1. In Admin Portal, go to **Analytics** -> **Configuration**
2. Enable **Analytics for all APIs**
3. Configure dashboard refresh intervals
4. Access analytics at https://localhost:9443/analytics

Analytics available:
- API usage statistics (requests per API, per application)
- Response time metrics
- Error rate tracking
- Top users and applications
- Geographic distribution of API calls

---

## Docker Compose Option for WSO2

To run WSO2 as part of the Docker Compose stack, add the following to `docker-compose.yml`:

```yaml
wso2-apim:
  image: wso2/apim:4.2.0
  container_name: govrecover-wso2
  ports:
    - "9443:9443"
    - "8280:8280"
    - "8243:8243"
  volumes:
    - ./config/wso2/deployment.toml:/home/wso2carbon/wso2am-4.2.0/repository/conf/deployment.toml
  environment:
    - DATABASE_URL=jdbc:postgresql://postgres:5432/govrecover
    - DATABASE_USER=govrecover
    - DATABASE_PASSWORD=${DB_PASSWORD:-govrecover_2026}
  depends_on:
    postgres:
      condition: service_healthy
```

Note: Production WSO2 deployment requires significant memory (recommended 4GB+ RAM) and a proper database configuration with PostgreSQL or Oracle.
