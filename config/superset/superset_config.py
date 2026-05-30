import os

SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY", "superset-super-secret-change-me")

SQLALCHEMY_DATABASE_URI = os.environ.get(
    "SUPERSET_DATABASE_URI",
    "postgresql://govrecover:govrecover_2026@postgres:5432/govrecover",
)

SQLALCHEMY_TRACK_MODIFICATIONS = False

WTF_CSRF_ENABLED = True
WTF_CSRF_EXEMPT_LIST = []

FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "ALERTS_ATTACH_REPORTS": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
}

PUBLIC_ROLE_LIKE = "Gamma"

ROW_LIMIT = 5000
SUPERSET_WORKERS = 4

SUPERSET_WEBSERVER_PORT = 8088
SUPERSET_WEBSERVER_TIMEOUT = 120

ENABLE_PROXY_FIX = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": ["*"],
    "origins": ["*"],
}

TALISMAN_ENABLED = False

# GovRecover database connection for dashboards
EXTRA_DATABASES = [
    {
        "database_name": "GovRecover360",
        "sqlalchemy_uri": "postgresql://govrecover:govrecover_2026@postgres:5432/govrecover",
        "cache_timeout": None,
        "expose_in_sqllab": True,
        "allow_dml": False,
        "allow_multi_schema_metadata_fetch": True,
    }
]
