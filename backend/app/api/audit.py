from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission
from app.models.models import User, AuditLog
from app.schemas.schemas import AuditLogResponse

router = APIRouter()


@router.get("/api/audit-logs", response_model=list[AuditLogResponse])
@router.get("/api/audit/logs", response_model=list[AuditLogResponse])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("audit:read")),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        AuditLogResponse(
            id=log.id, user_id=log.user_id, user_email=log.user_email,
            user_role=log.user_role, action=log.action,
            resource_type=log.resource_type, resource_id=log.resource_id,
            details=log.details, ip_address=log.ip_address, created_at=log.created_at,
        )
        for log in logs
    ]
