from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission, require_role
from app.models.models import User, DisasterZone, GISLocation, Household
from app.services.geonode_service import geonode_service

router = APIRouter()


def _zone_response(z: DisasterZone) -> dict:
    return {
        "id": z.id,
        "disaster_event_id": z.disaster_event_id,
        "disaster_id": z.disaster_event_id,
        "name": z.name,
        "zone_type": z.zone_type,
        "geometry": z.geometry,
        "risk_level": z.risk_level,
        "severity": z.risk_level,
        "district": None,
        "status": "active",
        "area_km2": z.area_km2,
        "estimated_population": z.estimated_population,
        "affected_population": z.estimated_population,
        "created_at": z.created_at,
        "updated_at": z.created_at,
    }


def _location_response(location: GISLocation) -> dict:
    props = location.properties_json or {}
    return {
        "id": location.id,
        "name": location.name,
        "location_type": location.location_type,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "district": location.district,
        "disaster_event_id": location.disaster_event_id,
        "properties_json": props,
        "capacity": props.get("capacity", 0),
        "current_occupancy": props.get("current_occupancy", 0),
        "status": props.get("status", "active"),
        "contact_number": props.get("contact") or props.get("contact_number"),
        "location": props.get("location") or location.district,
        "assigned_ngo": props.get("assigned_ngo"),
        "created_at": location.created_at,
    }


# === Disaster Zones ===
@router.get("/api/gis/zones")
def list_zones(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zones = db.query(DisasterZone).order_by(DisasterZone.name).all()
    return [_zone_response(z) for z in zones]


@router.get("/api/gis/stats")
def gis_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_zones = db.query(DisasterZone).count()
    active_shelters = db.query(GISLocation).filter(GISLocation.location_type == "SHELTER").count()
    distribution_points = db.query(GISLocation).filter(GISLocation.location_type == "DISTRIBUTION_POINT").count()
    population = sum(z.estimated_population or 0 for z in db.query(DisasterZone).all())
    return {
        "total_zones": total_zones,
        "active_shelters": active_shelters,
        "distribution_points": distribution_points,
        "population_covered": population,
        "geonode": geonode_service.health(),
    }


@router.post("/api/gis/zones", status_code=201)
@router.post("/api/geo/disaster-zone", status_code=201)
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
    response = _zone_response(zone)
    response["geonode_publish"] = geonode_service.publish_zone(response)
    return response


@router.get("/api/gis/layers")
def list_layers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zones = [_zone_response(zone) for zone in db.query(DisasterZone).order_by(DisasterZone.name).all()]
    shelters = [_location_response(shelter) for shelter in db.query(GISLocation).order_by(GISLocation.name).all()]
    fallback_layers = [
        {"name": "Disaster Zones", "type": "local", "count": len(zones), "features": zones},
        {"name": "GIS Locations", "type": "local", "count": len(shelters), "features": shelters},
    ]
    return geonode_service.list_layers(fallback_layers)


# === GIS Locations (Shelters, etc.) ===
@router.get("/api/gis/shelters")
def list_shelters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    shelters = db.query(GISLocation).filter(
        GISLocation.location_type == "SHELTER"
    ).order_by(GISLocation.name).all()
    return [_location_response(s) for s in shelters]


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
        properties_json=req.get("properties_json") or {
            "capacity": req.get("capacity", 0),
            "location": req.get("location"),
            "contact_number": req.get("contact") or req.get("contact_number"),
            "status": "active",
        },
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return _location_response(shelter)


@router.get("/api/gis/distribution")
def list_distribution_points(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    points = db.query(GISLocation).filter(
        GISLocation.location_type == "DISTRIBUTION_POINT"
    ).order_by(GISLocation.name).all()
    return [_location_response(point) for point in points]


@router.post("/api/gis/eligibility-check")
def household_location_eligibility(
    req: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    household = None
    if req.get("household_id"):
        household = db.query(Household).filter(Household.id == req["household_id"]).first()
        if not household:
            raise HTTPException(status_code=404, detail="Household not found")
        household_data = {
            "id": household.id,
            "latitude": household.latitude,
            "longitude": household.longitude,
            "damage_level": household.damage_level,
        }
    else:
        household_data = {
            "id": None,
            "latitude": req.get("latitude"),
            "longitude": req.get("longitude"),
            "damage_level": req.get("damage_level"),
        }
    zones = [_zone_response(zone) for zone in db.query(DisasterZone).all()]
    return geonode_service.household_eligibility(household_data, zones)
