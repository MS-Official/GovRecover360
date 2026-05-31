import httpx

from app.core.config import settings


class GeoNodeService:
    def __init__(self) -> None:
        self.enabled = bool(settings.GEONODE_ENABLED)
        self.base_url = (settings.GEONODE_URL or "").rstrip("/")

    @property
    def configured(self) -> bool:
        return bool(self.enabled and self.base_url)

    def health(self) -> dict:
        if not self.enabled:
            return self._response("disabled", reachable=False)
        if not self.base_url:
            return self._response(
                "not_configured",
                reachable=False,
                message="GEONODE_ENABLED is true but GEONODE_URL is missing.",
            )
        try:
            with httpx.Client(timeout=5) as client:
                response = client.get(f"{self.base_url}/api/v2/")
            if 200 <= response.status_code < 300:
                return self._response("live", reachable=True)
        except Exception:
            pass
        return self._response(
            "unreachable",
            reachable=False,
            message="GeoNode is not reachable; local GIS tables are used as fallback.",
        )

    def list_layers(self, fallback_layers: list[dict]) -> dict:
        if not self._live_ready():
            return self._response("mock", layers=fallback_layers)
        try:
            with httpx.Client(timeout=10) as client:
                response = client.get(f"{self.base_url}/api/v2/datasets/")
            response.raise_for_status()
            data = response.json()
            return self._response("live", layers=data.get("datasets") or data.get("objects") or data)
        except Exception:
            return self._response("unreachable", layers=fallback_layers)

    def publish_zone(self, zone: dict) -> dict:
        if not self._live_ready():
            return self._response("mock", published=False, layer=zone)
        return self._response(
            "manual_setup_required",
            published=False,
            message="GeoNode publishing requires a configured upload workflow or GeoServer credentials.",
            layer=zone,
        )

    def household_eligibility(self, household: dict, zones: list[dict]) -> dict:
        lat = household.get("latitude")
        lon = household.get("longitude")
        matching_zones = []
        if lat is not None and lon is not None:
            for zone in zones:
                if self._point_in_zone(float(lat), float(lon), zone.get("geometry")):
                    matching_zones.append(zone)

        damage_level = str(household.get("damage_level") or "").upper()
        eligible = bool(matching_zones) or damage_level in {"SEVERE", "TOTAL"}
        return self._response(
            "local_fallback" if not self.configured else "local_spatial_check",
            eligible=eligible,
            matching_zones=[
                {
                    "id": zone.get("id"),
                    "name": zone.get("name"),
                    "risk_level": zone.get("risk_level"),
                }
                for zone in matching_zones
            ],
            reason="Eligible when household falls inside a disaster zone or has severe/total damage.",
        )

    def _live_ready(self) -> bool:
        return self.configured and self.health().get("mode") == "live"

    def _point_in_zone(self, lat: float, lon: float, geometry: str | dict | None) -> bool:
        if not geometry:
            return False
        try:
            import json

            geom = json.loads(geometry) if isinstance(geometry, str) else geometry
            if geom.get("type") != "Polygon":
                return False
            ring = geom.get("coordinates", [[]])[0]
            points = [(float(x), float(y)) for x, y in ring]
        except Exception:
            return False

        inside = False
        j = len(points) - 1
        for i, (x_i, y_i) in enumerate(points):
            x_j, y_j = points[j]
            intersects = ((y_i > lat) != (y_j > lat)) and (
                lon < (x_j - x_i) * (lat - y_i) / ((y_j - y_i) or 1e-12) + x_i
            )
            if intersects:
                inside = not inside
            j = i
        return inside

    def _response(self, mode: str, **extra) -> dict:
        return {
            "mode": mode,
            "geonode_enabled": self.enabled,
            "geonode_configured": self.configured,
            **extra,
        }


geonode_service = GeoNodeService()
