from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission, require_role
from app.models.models import User, Household, DamageAssessment, DisasterEvent
from app.schemas.schemas import (
    HouseholdCreate, HouseholdResponse, DamageAssessmentCreate,
)

router = APIRouter()


@router.post("/api/households/register", response_model=HouseholdResponse, status_code=201)
@router.post("/api/citizens/register", response_model=HouseholdResponse, status_code=201)
def register_household(
    req: HouseholdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("citizen:create")),
):
    household = Household(
        id=str(uuid4()),
        head_full_name=req.head_full_name,
        head_nic=req.head_nic,
        head_phone=req.head_phone,
        district=req.district,
        ds_division=req.ds_division,
        gn_division=req.gn_division,
        address=req.address,
        family_size=req.family_size,
        damage_level=req.damage_level,
        damage_description=req.damage_description,
        latitude=req.latitude,
        longitude=req.longitude,
        disaster_event_id=req.disaster_event_id,
        registered_by_user_id=current_user.id,
    )
    db.add(household)
    db.commit()
    db.refresh(household)
    return HouseholdResponse(
        id=household.id, head_full_name=household.head_full_name,
        head_nic=household.head_nic, head_phone=household.head_phone,
        district=household.district, ds_division=household.ds_division,
        gn_division=household.gn_division, address=household.address,
        family_size=household.family_size, damage_level=household.damage_level,
        damage_description=household.damage_description,
        latitude=household.latitude, longitude=household.longitude,
        status=household.status, registered_by_user_id=household.registered_by_user_id,
        disaster_event_id=household.disaster_event_id, created_at=household.created_at,
    )


@router.get("/api/households", response_model=list[HouseholdResponse])
def list_households(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Household)
    if current_user.role == "ROLE_CITIZEN":
        query = query.filter(Household.registered_by_user_id == current_user.id)
    elif current_user.role == "ROLE_FIELD_OFFICER":
        query = query.filter(
            (Household.registered_by_user_id == current_user.id) |
            (Household.status == "REGISTERED")
        )
    elif current_user.role in ("ROLE_VERIFIER", "ROLE_PROGRAM_MANAGER", "ROLE_FINANCE_OFFICER"):
        query = query.filter(Household.status.in_(["REGISTERED", "ASSESSED"]))
    households = query.order_by(Household.created_at.desc()).all()
    return [
        HouseholdResponse(
            id=h.id, head_full_name=h.head_full_name, head_nic=h.head_nic,
            head_phone=h.head_phone, district=h.district,
            ds_division=h.ds_division, gn_division=h.gn_division,
            address=h.address, family_size=h.family_size,
            damage_level=h.damage_level, damage_description=h.damage_description,
            latitude=h.latitude, longitude=h.longitude, status=h.status,
            registered_by_user_id=h.registered_by_user_id,
            disaster_event_id=h.disaster_event_id, created_at=h.created_at,
        )
        for h in households
    ]


@router.get("/api/households/{household_id}", response_model=HouseholdResponse)
def get_household(
    household_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    if current_user.role == "ROLE_CITIZEN" and household.registered_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return HouseholdResponse(
        id=household.id, head_full_name=household.head_full_name,
        head_nic=household.head_nic, head_phone=household.head_phone,
        district=household.district, ds_division=household.ds_division,
        gn_division=household.gn_division, address=household.address,
        family_size=household.family_size, damage_level=household.damage_level,
        damage_description=household.damage_description,
        latitude=household.latitude, longitude=household.longitude,
        status=household.status, registered_by_user_id=household.registered_by_user_id,
        disaster_event_id=household.disaster_event_id, created_at=household.created_at,
    )


@router.patch("/api/households/{household_id}", response_model=HouseholdResponse)
def update_household(
    household_id: str,
    req: HouseholdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ROLE_ADMIN", "ROLE_FIELD_OFFICER"):
        raise HTTPException(status_code=403, detail="Not authorized")
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    for field, value in req.dict(exclude_unset=True).items():
        setattr(household, field, value)
    db.commit()
    db.refresh(household)
    return HouseholdResponse(
        id=household.id, head_full_name=household.head_full_name,
        head_nic=household.head_nic, head_phone=household.head_phone,
        district=household.district, ds_division=household.ds_division,
        gn_division=household.gn_division, address=household.address,
        family_size=household.family_size, damage_level=household.damage_level,
        damage_description=household.damage_description,
        latitude=household.latitude, longitude=household.longitude,
        status=household.status, registered_by_user_id=household.registered_by_user_id,
        disaster_event_id=household.disaster_event_id, created_at=household.created_at,
    )


@router.post("/api/households/{household_id}/damage-assessment")
def create_damage_assessment(
    household_id: str,
    req: DamageAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_FIELD_OFFICER")),
):
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    assessment = DamageAssessment(
        id=str(uuid4()),
        household_id=household_id,
        field_officer_id=current_user.id,
        damage_level=req.damage_level,
        structural_damage_score=req.structural_damage_score,
        content_loss_score=req.content_loss_score,
        casualties=req.casualties,
        injuries=req.injuries,
        notes=req.notes,
    )
    household.damage_level = req.damage_level
    household.status = "ASSESSED"
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return {
        "id": assessment.id,
        "household_id": assessment.household_id,
        "field_officer_id": assessment.field_officer_id,
        "damage_level": assessment.damage_level,
        "structural_damage_score": assessment.structural_damage_score,
        "content_loss_score": assessment.content_loss_score,
        "casualties": assessment.casualties,
        "injuries": assessment.injuries,
        "notes": assessment.notes,
        "assessment_date": assessment.assessment_date,
    }
