from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine, Base
from app.api import (
    auth, disasters, households, verification, payments,
    inventory, gis, reports, audit, ai, notifications,
    integrations, openg2p,
)
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.rbac_middleware import RBACMiddleware

app = FastAPI(title="GovRecover360 API", version="1.0.0")

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

app.include_router(auth.router)
app.include_router(disasters.router)
app.include_router(households.router)
app.include_router(verification.router)
app.include_router(payments.router)
app.include_router(inventory.router)
app.include_router(gis.router)
app.include_router(reports.router)
app.include_router(audit.router)
app.include_router(ai.router)
app.include_router(notifications.router)
app.include_router(integrations.router)
app.include_router(openg2p.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "GovRecover360 API"}
