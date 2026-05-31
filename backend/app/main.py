from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine, Base
from app.api import (
    auth, disasters, households, verification, payments,
    inventory, gis, reports, audit, ai, notifications,
    integrations, openg2p, admin,
)
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.rbac_middleware import RBACMiddleware

app = FastAPI(
    title="GovRecover360 API",
    description="Disaster Recovery, Beneficiary Management, OpenG2P, WSO2, Choreo, Odoo, Superset, AI, and RBAC APIs",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# OLD IMPLEMENTATION - kept for reference
# Reason: replaced with env-based FRONTEND_URL support for deployed frontends.
# cors_origins = ["http://localhost:3000"]
cors_origins = ["http://localhost:3000", "http://localhost:5173"]
if settings.FRONTEND_URL:
    cors_origins.append(settings.FRONTEND_URL.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RBACMiddleware)
app.add_middleware(AuditMiddleware)

app.include_router(auth.router, tags=["Authentication"])
app.include_router(disasters.router, tags=["Disaster Events"])
app.include_router(households.router, tags=["Households"])
app.include_router(verification.router, tags=["Relief Applications"])
app.include_router(payments.router, tags=["Payments"])
app.include_router(inventory.router, tags=["Inventory"])
app.include_router(gis.router, tags=["GIS & Triage"])
app.include_router(reports.router, tags=["Reports"])
app.include_router(audit.router, tags=["Audit Logs"])
app.include_router(ai.router, tags=["AI Tools"])
app.include_router(notifications.router, tags=["Choreo Notifications"])
app.include_router(integrations.router, tags=["Integrations"])
app.include_router(openg2p.router, tags=["OpenG2P Connector"])
app.include_router(admin.router, tags=["Admin"])


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "GovRecover360 API"}
