from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission, require_role
from app.models.models import User, InventoryItem, Warehouse, DispatchOrder
from app.schemas.schemas import DispatchActionRequest, DispatchOrderCreate, DispatchOrderResponse
from app.services.notification_service import notify_user

router = APIRouter()


# === Inventory Items ===
@router.get("/api/inventory")
def list_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(InventoryItem).order_by(InventoryItem.name).all()
    return [
        {
            "id": i.id, "name": i.name, "sku": i.sku, "category": i.category,
            "unit": i.unit, "quantity_available": i.quantity_available,
            "reorder_level": i.reorder_level, "warehouse_id": i.warehouse_id,
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.get("/api/inventory/{item_id}")
def get_inventory_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "id": item.id, "name": item.name, "sku": item.sku, "category": item.category,
        "unit": item.unit, "quantity_available": item.quantity_available,
        "reorder_level": item.reorder_level, "warehouse_id": item.warehouse_id,
        "created_at": item.created_at,
    }


@router.post("/api/inventory/items", status_code=201)
def create_inventory_item(
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory:read")),
):
    if current_user.role not in ("ROLE_ADMIN", "ROLE_WAREHOUSE_OFFICER"):
        raise HTTPException(status_code=403, detail="Not authorized")
    item = InventoryItem(
        id=str(uuid4()),
        name=req.get("name"),
        sku=req.get("sku"),
        category=req.get("category"),
        unit=req.get("unit"),
        quantity_available=req.get("quantity_available", 0),
        reorder_level=req.get("reorder_level", 0),
        warehouse_id=req.get("warehouse_id"),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id, "name": item.name, "sku": item.sku, "category": item.category,
        "unit": item.unit, "quantity_available": item.quantity_available,
        "reorder_level": item.reorder_level, "warehouse_id": item.warehouse_id,
        "created_at": item.created_at,
    }


@router.patch("/api/inventory/{item_id}")
def update_inventory_item(
    item_id: str,
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory:read")),
):
    if current_user.role not in ("ROLE_ADMIN", "ROLE_WAREHOUSE_OFFICER"):
        raise HTTPException(status_code=403, detail="Not authorized")
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field in ("name", "sku", "category", "unit", "quantity_available", "reorder_level", "warehouse_id"):
        if field in req:
            setattr(item, field, req[field])
    db.commit()
    db.refresh(item)
    return {
        "id": item.id, "name": item.name, "sku": item.sku, "category": item.category,
        "unit": item.unit, "quantity_available": item.quantity_available,
        "reorder_level": item.reorder_level, "warehouse_id": item.warehouse_id,
        "created_at": item.created_at,
    }


# === Warehouses ===
@router.get("/api/warehouses")
def list_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouses = db.query(Warehouse).all()
    return [
        {
            "id": w.id, "name": w.name, "location": w.location, "district": w.district,
            "capacity": w.capacity, "current_occupancy": w.current_occupancy,
            "contact_person": w.contact_person, "contact_phone": w.contact_phone,
            "created_at": w.created_at,
        }
        for w in warehouses
    ]


@router.post("/api/warehouses", status_code=201)
def create_warehouse(
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_ADMIN")),
):
    warehouse = Warehouse(
        id=str(uuid4()),
        name=req.get("name"),
        location=req.get("location"),
        district=req.get("district"),
        capacity=req.get("capacity"),
        current_occupancy=req.get("current_occupancy", 0),
        contact_person=req.get("contact_person"),
        contact_phone=req.get("contact_phone"),
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return {
        "id": warehouse.id, "name": warehouse.name, "location": warehouse.location,
        "district": warehouse.district, "capacity": warehouse.capacity,
        "current_occupancy": warehouse.current_occupancy,
        "contact_person": warehouse.contact_person,
        "contact_phone": warehouse.contact_phone, "created_at": warehouse.created_at,
    }


# === Dispatch Orders ===
@router.get("/api/dispatch-orders")
def list_dispatch_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = db.query(DispatchOrder).order_by(DispatchOrder.created_at.desc()).all()
    return [
        {
            "id": o.id, "relief_application_id": o.relief_application_id,
            "warehouse_id": o.warehouse_id, "assigned_ngo_id": o.assigned_ngo_id,
            "items_json": o.items_json, "status": o.status,
            "dispatched_by_user_id": o.dispatched_by_user_id,
            "dispatched_at": o.dispatched_at, "delivered_at": o.delivered_at,
            "notes": o.notes, "created_at": o.created_at,
        }
        for o in orders
    ]


@router.post("/api/dispatch-orders", status_code=201)
def create_dispatch_order(
    req: DispatchOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory:read")),
):
    if current_user.role not in ("ROLE_ADMIN", "ROLE_WAREHOUSE_OFFICER", "ROLE_PROGRAM_MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized")
    order = DispatchOrder(
        id=str(uuid4()),
        relief_application_id=req.relief_application_id,
        warehouse_id=req.warehouse_id,
        assigned_ngo_id=req.assigned_ngo_id,
        items_json=req.items_json,
        notes=req.notes,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {
        "id": order.id, "relief_application_id": order.relief_application_id,
        "warehouse_id": order.warehouse_id, "assigned_ngo_id": order.assigned_ngo_id,
        "items_json": order.items_json, "status": order.status,
        "dispatched_by_user_id": order.dispatched_by_user_id,
        "dispatched_at": order.dispatched_at, "delivered_at": order.delivered_at,
        "notes": order.notes, "created_at": order.created_at,
    }


@router.post("/api/dispatch-orders/{order_id}/dispatch")
def dispatch_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory:dispatch")),
):
    order = db.query(DispatchOrder).filter(DispatchOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Dispatch order not found")
    order.status = "DISPATCHED"
    order.dispatched_by_user_id = current_user.id
    order.dispatched_at = datetime.utcnow()
    if order.relief_application:
        order.relief_application.status = "DISPATCHED"
        notify_user(
            db,
            order.relief_application.applicant_user_id,
            "Relief Items Dispatched",
            f"Dispatch order {order.id} is on its way.",
            "DISPATCH",
            "/api/notifications/dispatch-update",
            {"dispatchId": order.id, "status": order.status, "notes": order.notes},
        )
    db.commit()
    db.refresh(order)
    return {
        "id": order.id, "relief_application_id": order.relief_application_id,
        "warehouse_id": order.warehouse_id, "assigned_ngo_id": order.assigned_ngo_id,
        "items_json": order.items_json, "status": order.status,
        "dispatched_by_user_id": order.dispatched_by_user_id,
        "dispatched_at": order.dispatched_at, "delivered_at": order.delivered_at,
        "notes": order.notes, "created_at": order.created_at,
    }


@router.post("/api/inventory/dispatch")
def dispatch_order_alias(
    req: DispatchActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_WAREHOUSE_OFFICER")),
):
    return dispatch_order(req.order_id, db, current_user)
