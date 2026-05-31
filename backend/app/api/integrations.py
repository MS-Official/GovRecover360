from datetime import datetime, timezone
import socket
from urllib.parse import urlparse
from urllib.request import urlopen
import xmlrpc.client

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine
from app.services.choreo_user_service import choreo_user_service

router = APIRouter()


def _http_health(url: str | None, path: str = "/health") -> str:
    if not url:
        return "not_configured"
    try:
        target = url.rstrip("/")
        if not target.endswith(path):
            target = f"{target}{path}"
        with urlopen(target, timeout=3) as response:
            return "ok" if 200 <= response.status < 300 else "error"
    except Exception:
        return "error"


def _database_status() -> str:
    try:
        with engine.connect() as connection:
            connection.execute(text("select 1"))
        return "ok"
    except Exception:
        return "error"


def _redis_status() -> str:
    if not settings.REDIS_URL:
        return "not_configured"
    try:
        parsed = urlparse(settings.REDIS_URL)
        host = parsed.hostname or "localhost"
        port = parsed.port or 6379
        with socket.create_connection((host, port), timeout=3) as sock:
            sock.sendall(b"*1\r\n$4\r\nPING\r\n")
            return "ok" if b"PONG" in sock.recv(1024) else "error"
    except Exception:
        return "error"


def _odoo_status() -> str:
    odoo_url = settings.ODOO_BASE_URL or settings.ODOO_URL
    required = [
        odoo_url,
        settings.ODOO_DB,
        settings.ODOO_USERNAME,
        settings.ODOO_PASSWORD,
    ]
    if not all(required):
        return "not_configured"
    try:
        # Local Odoo defaults to http://localhost:8069 from the host, or the
        # docker-compose service URL from another container.
        #
        # OLD IMPLEMENTATION - kept for reference
        # Reason: replaced with env-based ODOO_BASE_URL with ODOO_URL fallback.
        # common = xmlrpc.client.ServerProxy(f"{settings.ODOO_URL.rstrip('/')}/xmlrpc/2/common")
        common = xmlrpc.client.ServerProxy(f"{odoo_url.rstrip('/')}/xmlrpc/2/common")
        uid = common.authenticate(
            settings.ODOO_DB,
            settings.ODOO_USERNAME,
            settings.ODOO_PASSWORD,
            {},
        )
        return "ok" if uid else "error"
    except Exception:
        return "error"


def _asgardeo_status() -> dict:
    auth_mode = (settings.AUTH_MODE or "mock").lower()
    client_id_configured = bool(settings.ASGARDEO_CLIENT_ID)
    issuer_configured = bool(settings.ASGARDEO_ISSUER)
    jwks_configured = bool(settings.ASGARDEO_JWKS_URL)
    register_url_configured = bool(settings.ASGARDEO_SIGN_UP_URL)
    if auth_mode == "mock":
        status_value = "mock_mode"
    elif auth_mode == "asgardeo":
        status_value = "configured" if all([
            client_id_configured,
            issuer_configured,
            jwks_configured,
            bool(settings.ASGARDEO_AUDIENCE or settings.ASGARDEO_CLIENT_ID),
        ]) else "missing_env"
    else:
        status_value = "manual_setup_required"
    return {
        "status": status_value,
        "authMode": "asgardeo" if auth_mode == "asgardeo" else "mock",
        "clientIdConfigured": client_id_configured,
        "issuerConfigured": issuer_configured,
        "jwksConfigured": jwks_configured,
        "registerUrlConfigured": register_url_configured,
    }


def _integration_env_status() -> dict:
    odoo_url = settings.ODOO_BASE_URL or settings.ODOO_URL
    asgardeo_configured = all([
        settings.ASGARDEO_ISSUER,
        settings.ASGARDEO_JWKS_URL,
        settings.ASGARDEO_CLIENT_ID,
    ])
    return {
        "frontend_url_configured": bool(settings.FRONTEND_URL),
        "asgardeo_configured": bool(asgardeo_configured),
        "choreo_user_service_configured": choreo_user_service.configured,
        "odoo_configured": bool(
            odoo_url
            and settings.ODOO_DB
            and settings.ODOO_USERNAME
            and settings.ODOO_PASSWORD
        ),
        "odoo_module": "govaid_disaster_recovery",
    }


def _wso2_status() -> str:
    if settings.WSO2_GATEWAY_URL or settings.WSO2_PUBLISHER_URL:
        return "configured"
    return "manual_setup_required"


def _superset_status() -> str:
    if not settings.SUPERSET_URL:
        return "manual_check_required"
    return _http_health(settings.SUPERSET_URL, path="/")


def _geonode_status() -> str:
    if not settings.GEONODE_URL:
        return "not_configured"
    return "manual_check_required"


@router.get("/api/integrations/status")
def integration_status():
    auth_mode = (settings.AUTH_MODE or "mock").lower()
    return {
        "backend": "ok",
        "database": _database_status(),
        "redis": _redis_status(),
        "odoo": _odoo_status(),
        "openg2p": "aligned",
        "wso2": _wso2_status(),
        "asgardeo": _asgardeo_status(),
        "choreo": _http_health(settings.CHOREO_NOTIFIER_API_URL),
        "choreoUserService": choreo_user_service.health(),
        "superset": _superset_status(),
        "geonode": _geonode_status(),
        "aiService": _http_health(settings.AI_SERVICE_URL),
        "authMode": "asgardeo" if auth_mode == "asgardeo" else "mock",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/api/integration/health")
def integration_health():
    return _integration_env_status()
