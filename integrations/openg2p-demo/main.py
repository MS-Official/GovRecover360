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


@app.post("/api/beneficiaries")
def create_beneficiary(payload: dict):
    beneficiary_id = f"openg2p-{uuid4().hex[:10]}"
    record = {
        "beneficiary_id": beneficiary_id,
        "status": "registered",
        "source": "openg2p-demo",
        "payload": payload,
    }
    beneficiaries[beneficiary_id] = record
    return record


@app.get("/api/beneficiaries/{beneficiary_id}")
def get_beneficiary(beneficiary_id: str):
    return beneficiaries.get(
        beneficiary_id,
        {
            "beneficiary_id": beneficiary_id,
            "status": "not_found",
            "source": "openg2p-demo",
        },
    )


@app.post("/api/eligibility/check")
def check_eligibility(payload: dict):
    family_size = int(payload.get("family_size") or 0)
    damage_level = str(payload.get("damage_level") or "").upper()
    eligible = damage_level in {"SEVERE", "TOTAL"} or family_size >= 4
    return {
        "eligibility_status": "eligible" if eligible else "pending_verification",
        "eligible": eligible,
        "reason": "Demo OpenG2P rule: severe/total damage or family size >= 4.",
        "source": "openg2p-demo",
    }


@app.post("/api/entitlements")
def create_entitlement(payload: dict):
    entitlement_id = f"ent-{uuid4().hex[:10]}"
    record = {
        "entitlement_id": entitlement_id,
        "entitlement_status": "created",
        "disbursement_status": "pending",
        "source": "openg2p-demo",
        "payload": payload,
    }
    entitlements[entitlement_id] = record
    return record


@app.post("/api/program-enrollments")
def enroll_in_program(payload: dict):
    enrollment_id = f"enroll-{uuid4().hex[:10]}"
    record = {
        "enrollment_id": enrollment_id,
        "enrollment_status": "enrolled",
        "source": "openg2p-demo",
        "payload": payload,
    }
    enrollments[enrollment_id] = record
    return record
