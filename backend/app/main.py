from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.api import (
    auth, disasters, households, verification, payments,
    inventory, gis, reports, audit, ai, notifications,
    integrations,
)
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.rbac_middleware import RBACMiddleware

app = FastAPI(title="GovRecover360 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "GovRecover360 API"}
