from fastapi import APIRouter, Depends

from app.core.security import get_current_user, require_permission
from app.models.models import User
from app.services.openg2p_service import openg2p_service

router = APIRouter()


@router.get("/api/openg2p/health")
@router.get("/api/integrations/openg2p/health")
@router.get("/api/integrations/openg2p/status")
def openg2p_health():
    return openg2p_service.health()


@router.post("/api/openg2p/beneficiaries")
def create_beneficiary(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    return openg2p_service.create_beneficiary(payload)


@router.post("/api/integrations/openg2p/sync-beneficiary")
def sync_beneficiary(
    payload: dict,
    current_user: User = Depends(require_permission("beneficiary:verify")),
):
    return openg2p_service.sync_beneficiary(payload)


@router.get("/api/openg2p/beneficiaries/{beneficiary_id}")
def get_beneficiary(
    beneficiary_id: str,
    current_user: User = Depends(get_current_user),
):
    return openg2p_service.get_beneficiary(beneficiary_id)


@router.post("/api/openg2p/eligibility/check")
def check_eligibility(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    return openg2p_service.check_eligibility(payload)


@router.post("/api/integrations/openg2p/check-eligibility")
def integration_check_eligibility(
    payload: dict,
    current_user: User = Depends(require_permission("beneficiary:verify")),
):
    return openg2p_service.check_eligibility(payload)


@router.post("/api/openg2p/entitlements")
def create_entitlement(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    return openg2p_service.create_entitlement(payload)


@router.get("/api/integrations/openg2p/entitlements")
def integration_entitlements(
    current_user: User = Depends(require_permission("beneficiary:read")),
):
    return openg2p_service.list_entitlements()


@router.post("/api/openg2p/program-enrollments")
def enroll_in_program(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    return openg2p_service.enroll_in_program(payload)


@router.post("/api/integrations/openg2p/program-enrollment")
def integration_program_enrollment(
    payload: dict,
    current_user: User = Depends(require_permission("relief:approve")),
):
    return openg2p_service.enroll_in_program(payload)
