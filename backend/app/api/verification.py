from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission, require_role
from app.models.models import User, ReliefApplication, BeneficiaryVerification
from app.schemas.schemas import (
    ReliefApplicationCreate, ReliefApplicationResponse,
    VerificationRequest, VerificationResponse,
)

router = APIRouter()


@router.get("/api/applications", response_model=list[ReliefApplicationResponse])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ReliefApplication)
    if current_user.role == "ROLE_CITIZEN":
        query = query.filter(ReliefApplication.applicant_user_id == current_user.id)
    elif current_user.role == "ROLE_FIELD_OFFICER":
        query = query.filter(ReliefApplication.applicant_user_id == current_user.id)
    applications = query.order_by(ReliefApplication.created_at.desc()).all()
    return [
        ReliefApplicationResponse(
            id=a.id, household_id=a.household_id,
            disaster_event_id=a.disaster_event_id,
            applicant_user_id=a.applicant_user_id,
            required_items=a.required_items, status=a.status,
            submitted_at=a.submitted_at, verified_by_user_id=a.verified_by_user_id,
            verified_at=a.verified_at, approved_by_user_id=a.approved_by_user_id,
            approved_at=a.approved_at, rejection_reason=a.rejection_reason,
            created_at=a.created_at,
        )
        for a in applications
    ]


@router.get("/api/applications/{application_id}", response_model=ReliefApplicationResponse)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(ReliefApplication).filter(ReliefApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == "ROLE_CITIZEN" and app.applicant_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return ReliefApplicationResponse(
        id=app.id, household_id=app.household_id,
        disaster_event_id=app.disaster_event_id,
        applicant_user_id=app.applicant_user_id,
        required_items=app.required_items, status=app.status,
        submitted_at=app.submitted_at, verified_by_user_id=app.verified_by_user_id,
        verified_at=app.verified_at, approved_by_user_id=app.approved_by_user_id,
        approved_at=app.approved_at, rejection_reason=app.rejection_reason,
        created_at=app.created_at,
    )


@router.post("/api/applications", response_model=ReliefApplicationResponse, status_code=201)
def create_application(
    req: ReliefApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = ReliefApplication(
        id=str(uuid4()),
        household_id=req.household_id,
        disaster_event_id=req.disaster_event_id,
        applicant_user_id=current_user.id,
        required_items=req.required_items,
        status="DRAFT",
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return ReliefApplicationResponse(
        id=app.id, household_id=app.household_id,
        disaster_event_id=app.disaster_event_id,
        applicant_user_id=app.applicant_user_id,
        required_items=app.required_items, status=app.status,
        submitted_at=app.submitted_at, verified_by_user_id=app.verified_by_user_id,
        verified_at=app.verified_at, approved_by_user_id=app.approved_by_user_id,
        approved_at=app.approved_at, rejection_reason=app.rejection_reason,
        created_at=app.created_at,
    )


@router.post("/api/applications/{application_id}/submit", response_model=ReliefApplicationResponse)
def submit_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(ReliefApplication).filter(ReliefApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.applicant_user_id != current_user.id and current_user.role not in ("ROLE_ADMIN", "ROLE_FIELD_OFFICER"):
        raise HTTPException(status_code=403, detail="Not authorized")
    app.status = "SUBMITTED"
    app.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(app)
    return ReliefApplicationResponse(
        id=app.id, household_id=app.household_id,
        disaster_event_id=app.disaster_event_id,
        applicant_user_id=app.applicant_user_id,
        required_items=app.required_items, status=app.status,
        submitted_at=app.submitted_at, verified_by_user_id=app.verified_by_user_id,
        verified_at=app.verified_at, approved_by_user_id=app.approved_by_user_id,
        approved_at=app.approved_at, rejection_reason=app.rejection_reason,
        created_at=app.created_at,
    )


@router.post("/api/applications/{application_id}/verify", response_model=VerificationResponse)
def verify_application(
    application_id: str,
    req: VerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiary:verify")),
):
    app = db.query(ReliefApplication).filter(ReliefApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "VERIFIED"
    app.verified_by_user_id = current_user.id
    app.verified_at = datetime.utcnow()
    verification = BeneficiaryVerification(
        id=str(uuid4()),
        relief_application_id=application_id,
        verifier_id=current_user.id,
        verification_status="PASSED",
        verification_notes=req.notes,
        verified_at=datetime.utcnow(),
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return VerificationResponse(
        id=verification.id, relief_application_id=verification.relief_application_id,
        verifier_id=verification.verifier_id,
        verification_status=verification.verification_status,
        verification_notes=verification.verification_notes,
        verified_at=verification.verified_at,
    )


@router.post("/api/applications/{application_id}/reject", response_model=ReliefApplicationResponse)
def reject_application(
    application_id: str,
    req: VerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("beneficiary:verify")),
):
    app = db.query(ReliefApplication).filter(ReliefApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "REJECTED"
    app.rejection_reason = req.notes
    db.commit()
    db.refresh(app)
    return ReliefApplicationResponse(
        id=app.id, household_id=app.household_id,
        disaster_event_id=app.disaster_event_id,
        applicant_user_id=app.applicant_user_id,
        required_items=app.required_items, status=app.status,
        submitted_at=app.submitted_at, verified_by_user_id=app.verified_by_user_id,
        verified_at=app.verified_at, approved_by_user_id=app.approved_by_user_id,
        approved_at=app.approved_at, rejection_reason=app.rejection_reason,
        created_at=app.created_at,
    )


@router.post("/api/applications/{application_id}/approve-relief", response_model=ReliefApplicationResponse)
def approve_relief(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("relief:approve")),
):
    app = db.query(ReliefApplication).filter(ReliefApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "APPROVED_FOR_RELIEF"
    app.approved_by_user_id = current_user.id
    app.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(app)
    return ReliefApplicationResponse(
        id=app.id, household_id=app.household_id,
        disaster_event_id=app.disaster_event_id,
        applicant_user_id=app.applicant_user_id,
        required_items=app.required_items, status=app.status,
        submitted_at=app.submitted_at, verified_by_user_id=app.verified_by_user_id,
        verified_at=app.verified_at, approved_by_user_id=app.approved_by_user_id,
        approved_at=app.approved_at, rejection_reason=app.rejection_reason,
        created_at=app.created_at,
    )
