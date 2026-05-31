# GovRecover360 OpenG2P Integration — Demo Alignment

## Overview

GovRecover360 ships with a local **OpenG2P Demo Runtime** (`integrations/openg2p-demo/`) that mimics the real [OpenG2P](https://openg2p.org/) beneficiary registry API. This document describes the actual endpoints, the demo flow, and what is simulated vs real.

---

## Is This Real OpenG2P?

**No — this is a local demo runtime**, not a real OpenG2P deployment.

| Attribute | Demo Runtime | Real OpenG2P |
|---|---|---|
| Container | `govrecover-openg2p` (custom FastAPI) | OpenG2P cluster (Kubernetes) |
| Port | `8070` | Configurable (usually 443) |
| Data persistence | In-memory (resets on restart) | PostgreSQL-backed |
| Authentication | None (open API) | OAuth2 / Keycloak |
| Beneficiary data | Returned as demo echo | Real registry records |

---

## Actual Endpoints (Demo Runtime)

All endpoints are exposed at `http://localhost:8070` in the demo stack.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Short health check |
| `GET` | `/api/health` | Health check with service metadata |
| `POST` | `/api/beneficiaries` | Create/register a new beneficiary |
| `POST` | `/api/beneficiaries/sync` | Sync beneficiary from external system (alias of above) |
| `GET` | `/api/beneficiaries/{id}` | Retrieve a beneficiary by ID |
| `POST` | `/api/eligibility/check` | Check eligibility based on damage level + family size |
| `GET` | `/api/entitlements` | List demo entitlements for the current disaster |
| `POST` | `/api/entitlements` | Create a new entitlement record |
| `POST` | `/api/program-enrollments` | Enroll a beneficiary in a relief program |

---

## Eligibility Rules (Demo)

The demo runtime applies this rule set to `/api/eligibility/check`:

```
eligible = (
  NOT duplicateApplication
  AND insideDisasterZone
  AND (damageLevel in {"SEVERE", "TOTAL"} OR familySize >= 4)
)
```

---

## Demo Flow (demo.sh)

The `demo.sh` script runs the following OpenG2P steps:

1. **Beneficiary Sync** — `POST /api/beneficiaries/sync`  
   Registers a flood relief beneficiary with SEVERE damage, family of 5, Gampaha district.

2. **Eligibility Check** — `POST /api/eligibility/check`  
   Checks eligibility. With `SEVERE` damage + family of 5 inside the disaster zone, result is `eligible: true`.

3. **Entitlements** — `GET /api/entitlements`  
   Returns demo entitlements: LKR 25,000 cash + food/shelter/medical in-kind package.

4. **Program Enrollment** — `POST /api/program-enrollments`  
   Enrolls the beneficiary in "Flood Relief & Recovery Program 2026" with CASH + IN_KIND entitlements.

Each step uses `endpoint_supports()` to discover the actual method/path from the live OpenAPI spec before calling. If an endpoint is absent, the step is **skipped with a warning** (non-fatal).

---

## Response Shapes

### POST /api/beneficiaries/sync
```json
{
  "beneficiaryId": "BEN-...",
  "householdId": "HH-...",
  "status": "synced",
  "mode": "demo-runtime",
  "source": "openg2p-demo",
  "name": "...",
  "district": "...",
  "damageLevel": "SEVERE"
}
```

### POST /api/eligibility/check
```json
{
  "eligible": true,
  "eligibility_status": "eligible",
  "reason": "Household is inside disaster zone and damage level is severe.",
  "programId": "FLOOD-RELIEF-2026",
  "source": "openg2p-demo"
}
```

### GET /api/entitlements
```json
{
  "entitlements": [
    { "programId": "FLOOD-RELIEF-2026", "type": "CASH", "amount": 25000, "currency": "LKR", "status": "approved" },
    { "programId": "FLOOD-RELIEF-2026", "type": "IN_KIND", "items": ["Food Pack", "Water Bottles", "Medical Kit", "Tent"], "status": "approved" }
  ],
  "source": "openg2p-demo",
  "mode": "demo-runtime"
}
```

### POST /api/program-enrollments
```json
{
  "enrollmentId": "enroll-...",
  "status": "enrolled",
  "enrollment_status": "enrolled",
  "programId": "FLOOD-RELIEF-2026",
  "beneficiaryId": "BEN-...",
  "source": "openg2p-demo"
}
```

---

## Connecting to Real OpenG2P

For production, set these env vars in `.env` or `.env.demo`:

```bash
OPENG2P_ENABLED=true
OPENG2P_BASE_URL=https://your-openg2p.example.org
OPENG2P_API_BASE_URL=https://your-openg2p.example.org/api
OPENG2P_DB=openg2p
OPENG2P_USERNAME=admin
OPENG2P_PASSWORD=<your-password>
```

The backend's `integrations/openg2p` connector will then route through your real OpenG2P cluster instead of the demo runtime container.
