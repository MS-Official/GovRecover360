from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt

from app.core.config import settings


class RBACMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                request.state.user_id = payload.get("sub")
                request.state.user_email = payload.get("email")
                request.state.user_role = payload.get("role")
                request.state.user_permissions = payload.get("permissions", [])
            except JWTError:
                request.state.user_id = None
                request.state.user_email = None
                request.state.user_role = None
                request.state.user_permissions = []
        else:
            request.state.user_id = None
            request.state.user_email = None
            request.state.user_role = None
            request.state.user_permissions = []

        response = await call_next(request)
        return response
