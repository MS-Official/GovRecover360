from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission, require_role
from app.models.models import User, DisasterEvent
from app.schemas.schemas import DisasterEventCreate, DisasterEventResponse

router = APIRouter()


@router.get("/api/disasters", response_model=list[DisasterEventResponse])
def list_disasters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DisasterEvent)
    if current_user.role == "ROLE_CITIZEN":
        query = query.filter(DisasterEvent.status == "ACTIVE")
    disasters = query.order_by(DisasterEvent.created_at.desc()).all()
    return [
        DisasterEventResponse(
            id=d.id, name=d.name, description=d.description,
            disaster_type=d.disaster_type, severity=d.severity, status=d.status,
            start_date=d.start_date, end_date=d.end_date,
            affected_districts=d.affected_districts,
            created_by_user_id=d.created_by_user_id, created_at=d.created_at,
        )
        for d in disasters
    ]


@router.post("/api/disasters", response_model=DisasterEventResponse, status_code=201)
def create_disaster(
    req: DisasterEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report:read")),
):
    if current_user.role not in ("ROLE_ADMIN", "ROLE_DISASTER_MANAGER", "ROLE_PROGRAM_MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to create disasters")
    disaster = DisasterEvent(
        id=str(uuid4()),
        name=req.name,
        description=req.description,
        disaster_type=req.disaster_type,
        severity=req.severity,
        status=req.status or "ACTIVE",
        start_date=req.start_date,
        end_date=req.end_date,
        affected_districts=req.affected_districts,
        created_by_user_id=current_user.id,
    )
    db.add(disaster)
    db.commit()
    db.refresh(disaster)
    return DisasterEventResponse(
        id=disaster.id, name=disaster.name, description=disaster.description,
        disaster_type=disaster.disaster_type, severity=disaster.severity,
        status=disaster.status, start_date=disaster.start_date,
        end_date=disaster.end_date, affected_districts=disaster.affected_districts,
        created_by_user_id=disaster.created_by_user_id, created_at=disaster.created_at,
    )


@router.get("/api/disasters/{disaster_id}", response_model=DisasterEventResponse)
def get_disaster(
    disaster_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    disaster = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster event not found")
    if current_user.role == "ROLE_CITIZEN" and disaster.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Access denied")
    return DisasterEventResponse(
        id=disaster.id, name=disaster.name, description=disaster.description,
        disaster_type=disaster.disaster_type, severity=disaster.severity,
        status=disaster.status, start_date=disaster.start_date,
        end_date=disaster.end_date, affected_districts=disaster.affected_districts,
        created_by_user_id=disaster.created_by_user_id, created_at=disaster.created_at,
    )


@router.patch("/api/disasters/{disaster_id}", response_model=DisasterEventResponse)
def update_disaster(
    disaster_id: str,
    req: DisasterEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report:read")),
):
    if current_user.role not in ("ROLE_ADMIN", "ROLE_DISASTER_MANAGER", "ROLE_PROGRAM_MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to update disasters")
    disaster = db.query(DisasterEvent).filter(DisasterEvent.id == disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster event not found")
    for field, value in req.dict(exclude_unset=True).items():
        setattr(disaster, field, value)
    db.commit()
    db.refresh(disaster)
    return DisasterEventResponse(
        id=disaster.id, name=disaster.name, description=disaster.description,
        disaster_type=disaster.disaster_type, severity=disaster.severity,
        status=disaster.status, start_date=disaster.start_date,
        end_date=disaster.end_date, affected_districts=disaster.affected_districts,
        created_by_user_id=disaster.created_by_user_id, created_at=disaster.created_at,
    )
