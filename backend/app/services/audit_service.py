from uuid import uuid4
from sqlalchemy.orm import Session
from app.models.models import AuditLog


def create_audit_log(
    db: Session,
    user_id: str = None,
    user_email: str = None,
    user_role: str = None,
    action: str = None,
    resource_type: str = None,
    resource_id: str = None,
    details: dict = None,
    ip_address: str = None,
) -> AuditLog:
    log = AuditLog(
        id=str(uuid4()),
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
