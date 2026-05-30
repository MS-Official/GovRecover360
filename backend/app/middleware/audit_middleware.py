from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.services.audit_service import create_audit_log


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        if request.method in ("GET", "OPTIONS"):
            return response

        db: Session = SessionLocal()
        try:
            user_id = None
            user_email = None
            user_role = None
            if hasattr(request.state, "user_id"):
                user_id = request.state.user_id
            if hasattr(request.state, "user_email"):
                user_email = request.state.user_email
            if hasattr(request.state, "user_role"):
                user_role = request.state.user_role

            path_parts = request.url.path.strip("/").split("/")
            resource_type = path_parts[1] if len(path_parts) > 1 else path_parts[0] if path_parts else "unknown"

            action_map = {
                "POST": "CREATE",
                "PATCH": "UPDATE",
                "PUT": "UPDATE",
                "DELETE": "DELETE",
            }
            action = action_map.get(request.method, request.method)

            create_audit_log(
                db=db,
                user_id=user_id,
                user_email=user_email,
                user_role=user_role,
                action=action,
                resource_type=resource_type,
                resource_id=None,
                details={"method": request.method, "path": request.url.path},
                ip_address=request.client.host if request.client else None,
            )
        except Exception:
            pass
        finally:
            db.close()

        return response
