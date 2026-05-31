from uuid import uuid4

from fastapi import FastAPI

app = FastAPI(title="GovRecover360 OpenG2P Demo Runtime", version="1.0.0")

beneficiaries: dict[str, dict] = {}
entitlements: dict[str, dict] = {}
enrollments: dict[str, dict] = {}


@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "openg2p-demo",
        "mode": "demo-runtime",
    }


# ──────────────────────────────────────────────────────
# Beneficiaries
# ──────────────────────────────────────────────────────

def _build_beneficiary_record(payload: dict, beneficiary_id: str | None = None) -> dict:
    bid = beneficiary_id or payload.get("beneficiaryId") or f"openg2p-{uuid4().hex[:10]}"
    return {
        "beneficiaryId": bid,
        "householdId": payload.get("householdId", f"hh-{bid}"),
        "status": "synced",
        "mode": "demo-runtime",
        "source": "openg2p-demo",
        "name": payload.get("name", ""),
        "district": payload.get("district", ""),
        "damageLevel": payload.get("damageLevel", ""),
        "payload": payload,
    }


@app.post("/api/beneficiaries")
def create_beneficiary(payload: dict):
    """Create / register a beneficiary."""
    record = _build_beneficiary_record(payload)
    beneficiaries[record["beneficiaryId"]] = record
    return record


@app.post("/api/beneficiaries/sync")
def sync_beneficiary(payload: dict):
    """Sync a beneficiary from an external system (alias of create)."""
    record = _build_beneficiary_record(payload)
    record["status"] = "synced"
    beneficiaries[record["beneficiaryId"]] = record
    return record


@app.get("/api/beneficiaries/{beneficiary_id}")
def get_beneficiary(beneficiary_id: str):
    return beneficiaries.get(
        beneficiary_id,
        {
            "beneficiaryId": beneficiary_id,
            "status": "not_found",
            "source": "openg2p-demo",
        },
    )


# ──────────────────────────────────────────────────────
# Eligibility
# ──────────────────────────────────────────────────────

@app.post("/api/eligibility/check")
def check_eligibility(payload: dict):
    family_size = int(payload.get("familySize") or payload.get("family_size") or 0)
    damage_level = str(payload.get("damageLevel") or payload.get("damage_level") or "").upper()
    inside_zone = bool(payload.get("insideDisasterZone", True))
    duplicate = bool(payload.get("duplicateApplication", False))

    eligible = (
        not duplicate
        and inside_zone
        and (damage_level in {"SEVERE", "TOTAL"} or family_size >= 4)
    )
    reason = (
        "Household is inside disaster zone and damage level is severe."
        if eligible
        else "Does not meet eligibility criteria (demo rule)."
    )
    return {
        "eligible": eligible,
        "eligibility_status": "eligible" if eligible else "pending_verification",
        "reason": reason,
        "programId": payload.get("programId", ""),
        "source": "openg2p-demo",
    }


# ──────────────────────────────────────────────────────
# Entitlements
# ──────────────────────────────────────────────────────

@app.get("/api/entitlements")
def list_entitlements():
    """List all demo entitlements (used by demo.sh GET flow)."""
    return {
        "entitlements": [
            {
                "programId": "FLOOD-RELIEF-2026",
                "type": "CASH",
                "amount": 25000,
                "currency": "LKR",
                "status": "approved",
            },
            {
                "programId": "FLOOD-RELIEF-2026",
                "type": "IN_KIND",
                "items": ["Food Pack", "Water Bottles", "Medical Kit", "Tent"],
                "status": "approved",
            },
        ],
        "source": "openg2p-demo",
        "mode": "demo-runtime",
    }


@app.post("/api/entitlements")
def create_entitlement(payload: dict):
    """Create a new entitlement record."""
    entitlement_id = f"ent-{uuid4().hex[:10]}"
    record = {
        "entitlementId": entitlement_id,
        "entitlement_status": "created",
        "disbursement_status": "pending",
        "source": "openg2p-demo",
        "payload": payload,
    }
    entitlements[entitlement_id] = record
    return record


# ──────────────────────────────────────────────────────
# Program Enrollments
# ──────────────────────────────────────────────────────

@app.post("/api/program-enrollments")
def enroll_in_program(payload: dict):
    enrollment_id = f"enroll-{uuid4().hex[:10]}"
    record = {
        "enrollmentId": enrollment_id,
        "status": "enrolled",
        "enrollment_status": "enrolled",
        "programId": payload.get("programId", ""),
        "beneficiaryId": payload.get("beneficiaryId", ""),
        "source": "openg2p-demo",
        "payload": payload,
    }
    enrollments[enrollment_id] = record
    return record
