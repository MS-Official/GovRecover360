from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission
from app.models.models import (
    User, Household, DamageAssessment, ReliefApplication,
    PaymentRequest, InventoryItem, DispatchOrder,
)

router = APIRouter()


@router.get("/api/reports/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_households = db.query(Household).count()
    total_assessed = db.query(DamageAssessment).count()
    total_applications = db.query(ReliefApplication).count()
    total_payments = db.query(PaymentRequest).count()
    total_dispatched = db.query(DispatchOrder).count()

    damage_counts = {}
    for level in ["MINOR", "MODERATE", "SEVERE", "TOTAL"]:
        count = db.query(Household).filter(Household.damage_level == level).count()
        if count > 0:
            damage_counts[level] = count

    return {
        "total_households": total_households,
        "total_damage_assessments": total_assessed,
        "total_relief_applications": total_applications,
        "total_payment_requests": total_payments,
        "total_dispatch_orders": total_dispatched,
        "damage_level_breakdown": damage_counts,
    }


@router.get("/api/reports/by-district")
def report_by_district(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = db.query(
        Household.district,
        func.count(Household.id).label("total"),
        func.sum(Household.family_size).label("total_population"),
    ).group_by(Household.district).all()

    return [
        {
            "district": r.district,
            "total_households": r.total,
            "total_population": r.total_population or 0,
        }
        for r in results if r.district
    ]


@router.get("/api/reports/by-status")
def report_by_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = db.query(
        ReliefApplication.status,
        func.count(ReliefApplication.id).label("count"),
    ).group_by(ReliefApplication.status).all()

    return [{"status": r.status, "count": r.count} for r in results]


@router.get("/api/reports/inventory")
def report_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_items = db.query(InventoryItem).count()
    total_qty = db.query(func.sum(InventoryItem.quantity_available)).scalar() or 0
    low_stock = db.query(InventoryItem).filter(
        InventoryItem.quantity_available <= InventoryItem.reorder_level
    ).count()

    return {
        "total_items": total_items,
        "total_quantity": total_qty,
        "low_stock_items": low_stock,
    }


@router.get("/api/reports/ngo-performance")
def report_ngo_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.models import NGOPartnerAssignment

    assignments = db.query(NGOPartnerAssignment).all()
    ngo_stats = {}
    for a in assignments:
        ngo_id = a.ngo_user_id or "unknown"
        if ngo_id not in ngo_stats:
            ngo_stats[ngo_id] = {"ngo_user_id": ngo_id, "total_tasks": 0, "completed_tasks": 0}
        ngo_stats[ngo_id]["total_tasks"] += 1
        if a.status == "COMPLETED":
            ngo_stats[ngo_id]["completed_tasks"] += 1

    return list(ngo_stats.values())
