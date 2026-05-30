from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission, require_role
from app.models.models import User, DisasterZone, GISLocation

router = APIRouter()


# === Disaster Zones ===
@router.get("/api/gis/zones")
def list_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zones = db.query(DisasterZone).order_by(DisasterZone.name).all()
    return [
        {
            "id": z.id, "disaster_event_id": z.disaster_event_id, "name": z.name,
            "zone_type": z.zone_type, "geometry": z.geometry, "risk_level": z.risk_level,
            "area_km2": z.area_km2, "estimated_population": z.estimated_population,
            "created_at": z.created_at,
        }
        for z in zones
    ]


@router.post("/api/gis/zones", status_code=201)
def create_zone(
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("geo:manage")),
):
    zone = DisasterZone(
        id=str(uuid4()),
        disaster_event_id=req.get("disaster_event_id"),
        name=req.get("name"),
        zone_type=req.get("zone_type"),
        geometry=req.get("geometry"),
        risk_level=req.get("risk_level"),
        area_km2=req.get("area_km2"),
        estimated_population=req.get("estimated_population"),
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return {
        "id": zone.id, "disaster_event_id": zone.disaster_event_id, "name": zone.name,
        "zone_type": zone.zone_type, "geometry": zone.geometry, "risk_level": zone.risk_level,
        "area_km2": zone.area_km2, "estimated_population": zone.estimated_population,
        "created_at": zone.created_at,
    }


# === GIS Locations (Shelters, etc.) ===
@router.get("/api/gis/shelters")
def list_shelters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shelters = db.query(GISLocation).filter(
        GISLocation.location_type == "SHELTER"
    ).order_by(GISLocation.name).all()
    return [
        {
            "id": s.id, "name": s.name, "location_type": s.location_type,
            "latitude": s.latitude, "longitude": s.longitude, "district": s.district,
            "disaster_event_id": s.disaster_event_id, "properties_json": s.properties_json,
            "created_at": s.created_at,
        }
        for s in shelters
    ]


@router.post("/api/gis/shelters", status_code=201)
def create_shelter(
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("geo:manage")),
):
    shelter = GISLocation(
        id=str(uuid4()),
        name=req.get("name"),
        location_type="SHELTER",
        latitude=req.get("latitude"),
        longitude=req.get("longitude"),
        district=req.get("district"),
        disaster_event_id=req.get("disaster_event_id"),
        properties_json=req.get("properties_json"),
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return {
        "id": shelter.id, "name": shelter.name, "location_type": shelter.location_type,
        "latitude": shelter.latitude, "longitude": shelter.longitude,
        "district": shelter.district, "disaster_event_id": shelter.disaster_event_id,
        "properties_json": shelter.properties_json, "created_at": shelter.created_at,
    }
