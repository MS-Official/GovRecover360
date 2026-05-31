from uuid import uuid4

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Notification, User


def notify_user(
    db: Session,
    user_id: str | None,
    title: str,
    message: str,
    notification_type: str = "UPDATE",
    choreo_path: str = "/api/notifications/send",
    choreo_payload: dict | None = None,
) -> Notification | None:
    if not user_id:
        return None

    notification = Notification(
        id=str(uuid4()),
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False,
    )
    db.add(notification)
    db.flush()

    if settings.CHOREO_NOTIFIER_API_URL:
        user = db.query(User).filter(User.id == user_id).first()
        payload = choreo_payload or {
            "to": user.email if user else user_id,
            "subject": title,
            "message": message,
            "type": "email",
        }
        try:
            base_url = settings.CHOREO_NOTIFIER_API_URL.rstrip("/")
            httpx.post(f"{base_url}{choreo_path}", json=payload, timeout=5)
        except Exception:
            notification.message = f"{message} (Notification service unavailable; logged locally.)"

    return notification
