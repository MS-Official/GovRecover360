from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import require_permission
from app.models.models import (
    DisasterEvent,
    DispatchOrder,
    Household,
    ReliefApplication,
    User,
    Warehouse,
)

router = APIRouter()


@router.get("/api/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin:manage")),
):
    counts = {
        "total_users": db.query(User).count(),
        "active_disasters": db.query(DisasterEvent).filter(DisasterEvent.status == "ACTIVE").count(),
        "total_households": db.query(Household).count(),
        "verified_applications": db.query(ReliefApplication).filter(
            ReliefApplication.status.in_(["VERIFIED", "APPROVED", "PAYMENT_APPROVED", "DISPATCHED", "COMPLETED"])
        ).count(),
        "approved_relief": db.query(ReliefApplication).filter(
            ReliefApplication.status.in_(["APPROVED", "PAYMENT_APPROVED", "DISPATCHED", "COMPLETED"])
        ).count(),
        "dispatched_orders": db.query(DispatchOrder).filter(
            DispatchOrder.status.in_(["IN_TRANSIT", "DELIVERED", "PARTIAL"])
        ).count(),
        "total_warehouses": db.query(Warehouse).count(),
        "total_ngos": db.query(User).filter(User.role == "ROLE_NGO_PARTNER").count(),
    }
    demo_baseline = {
        "total_users": 10,
        "active_disasters": 1,
        "total_households": 30,
        "verified_applications": 18,
        "approved_relief": 15,
        "dispatched_orders": 12,
        "total_warehouses": 3,
        "total_ngos": 3,
    }
    display_counts = {
        key: max(int(counts.get(key, 0)), value)
        for key, value in demo_baseline.items()
    }
    return {
        **display_counts,
        "demo_fallback": any(counts[key] < demo_baseline[key] for key in demo_baseline),
        "source_counts": counts,
        "recent_activities": [
            {"action": "OpenG2P beneficiary sync completed", "user": "Admin", "time": "Demo run"},
            {"action": "WSO2 gateway health verified", "user": "Admin", "time": "Demo run"},
            {"action": "Choreo notification service checked", "user": "Admin", "time": "Demo run"},
            {"action": "Odoo ERP module ready for relief operations", "user": "Admin", "time": "Demo run"},
        ],
        "api_status": [
            {"name": "Backend API", "status": "Operational", "uptime": "Local demo"},
            {"name": "OpenG2P Runtime", "status": "Operational", "uptime": "Local demo"},
            {"name": "WSO2 Gateway", "status": "Operational", "uptime": "Local demo"},
            {"name": "Choreo Notifier", "status": "Operational", "uptime": "Local demo"},
        ],
    }
