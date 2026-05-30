from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user
from app.models.models import User, Notification
from app.schemas.schemas import NotificationResponse

router = APIRouter()


@router.get("/api/notifications", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [
        NotificationResponse(
            id=n.id, user_id=n.user_id, title=n.title, message=n.message,
            type=n.type, is_read=n.is_read, created_at=n.created_at,
        )
        for n in notifications
    ]


@router.patch("/api/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return NotificationResponse(
        id=notification.id, user_id=notification.user_id,
        title=notification.title, message=notification.message,
        type=notification.type, is_read=notification.is_read,
        created_at=notification.created_at,
    )


@router.get("/api/notifications/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
        .count()
    )
    return {"unread_count": count}
