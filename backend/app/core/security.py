from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
from urllib.request import urlopen
import json

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.models import User, Role, RolePermission, Permission
from app.services.wso2_service import wso2_service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

ROLE_MAPPING = {
    "ADMIN": "ROLE_ADMIN",
    "Admin": "ROLE_ADMIN",
    "Disaster Manager": "ROLE_DISASTER_MANAGER",
    "Field Officer": "ROLE_FIELD_OFFICER",
    "Verifier": "ROLE_VERIFIER",
    "Program Manager": "ROLE_PROGRAM_MANAGER",
    "Finance Officer": "ROLE_FINANCE_OFFICER",
    "Warehouse Officer": "ROLE_WAREHOUSE_OFFICER",
    "GIS Officer": "ROLE_GIS_OFFICER",
    "NGO Partner": "ROLE_NGO_PARTNER",
    "Auditor": "ROLE_AUDITOR",
    "Citizen": "ROLE_CITIZEN",
    "ROLE_ADMIN": "ROLE_ADMIN",
    "ROLE_DISASTER_MANAGER": "ROLE_DISASTER_MANAGER",
    "ROLE_FIELD_OFFICER": "ROLE_FIELD_OFFICER",
    "ROLE_VERIFIER": "ROLE_VERIFIER",
    "ROLE_PROGRAM_MANAGER": "ROLE_PROGRAM_MANAGER",
    "ROLE_FINANCE_OFFICER": "ROLE_FINANCE_OFFICER",
    "ROLE_WAREHOUSE_OFFICER": "ROLE_WAREHOUSE_OFFICER",
    "ROLE_GIS_OFFICER": "ROLE_GIS_OFFICER",
    "ROLE_NGO_PARTNER": "ROLE_NGO_PARTNER",
    "ROLE_AUDITOR": "ROLE_AUDITOR",
    "ROLE_CITIZEN": "ROLE_CITIZEN",
}

_jwks_cache: dict | None = None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def _credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        if not settings.ASGARDEO_JWKS_URL:
            raise _credentials_exception()
        with urlopen(settings.ASGARDEO_JWKS_URL, timeout=5) as response:
            _jwks_cache = json.loads(response.read().decode("utf-8"))
    return _jwks_cache


def _select_jwk(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    keys = _get_jwks().get("keys", [])
    for key in keys:
        if key.get("kid") == kid:
            return key
    raise _credentials_exception()


def _claim_values(payload: dict, *names: str) -> list[str]:
    values: list[str] = []
    for name in names:
        raw = payload.get(name)
        if isinstance(raw, str):
            values.append(raw)
        elif isinstance(raw, list):
            values.extend(str(item) for item in raw)
    return values


def map_asgardeo_role(payload: dict) -> str | None:
    candidates = _claim_values(
        payload,
        "roles",
        "role",
        "groups",
        "http://wso2.org/claims/roles",
        "http://wso2.org/claims/groups",
    )
    for candidate in candidates:
        mapped = ROLE_MAPPING.get(candidate.strip())
        if mapped:
            return mapped
    return None


def _validate_asgardeo_token(token: str) -> dict:
    if not settings.ASGARDEO_ISSUER:
        raise _credentials_exception()
    audience = settings.ASGARDEO_AUDIENCE or settings.ASGARDEO_CLIENT_ID
    if not audience:
        raise _credentials_exception()
    try:
        return jwt.decode(
            token,
            _select_jwk(token),
            algorithms=["RS256"],
            issuer=settings.ASGARDEO_ISSUER,
            audience=audience,
            options={"verify_at_hash": False},
        )
    except JWTError:
        raise _credentials_exception()


def _get_or_create_asgardeo_user(db: Session, payload: dict) -> User:
    role_name = map_asgardeo_role(payload) or "ROLE_CITIZEN"

    email = (
        payload.get("email")
        or payload.get("username")
        or payload.get("preferred_username")
        or payload.get("sub")
    )
    if not email:
        raise _credentials_exception()

    role_obj = db.query(Role).filter(Role.name == role_name).first()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid4()),
            email=email,
            password_hash=hash_password(str(uuid4())),
        )
        db.add(user)

    user.full_name = payload.get("name") or payload.get("given_name") or email
    user.role = role_name
    user.role_id = role_obj.id if role_obj else None
    user.district = payload.get("district") or payload.get("http://wso2.org/claims/district")
    user.department = payload.get("department") or payload.get("http://wso2.org/claims/department")
    user.assigned_region = payload.get("assigned_region") or payload.get("http://wso2.org/claims/assigned_region")
    user.organization = payload.get("organization") or payload.get("http://wso2.org/claims/organization")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


def _role_from_permissions(permissions: list[str]) -> str:
    permission_set = set(permissions)
    if "admin:manage" in permission_set:
        return "ROLE_ADMIN"
    if "geo:manage" in permission_set:
        return "ROLE_GIS_OFFICER"
    if "inventory:dispatch" in permission_set:
        return "ROLE_WAREHOUSE_OFFICER"
    if "payment:approve" in permission_set:
        return "ROLE_FINANCE_OFFICER"
    if "relief:approve" in permission_set:
        return "ROLE_PROGRAM_MANAGER"
    if "beneficiary:verify" in permission_set:
        return "ROLE_VERIFIER"
    if "citizen:create" in permission_set:
        return "ROLE_FIELD_OFFICER"
    if "audit:read" in permission_set:
        return "ROLE_AUDITOR"
    return "ROLE_CITIZEN"


def _get_or_create_wso2_user(db: Session, payload: dict) -> User:
    permissions = wso2_service.permissions_from_claims(payload)
    role_name = map_asgardeo_role(payload) or _role_from_permissions(permissions)
    email = payload.get("email") or payload.get("sub") or payload.get("username")
    if not email:
        raise _credentials_exception()

    role_obj = db.query(Role).filter(Role.name == role_name).first()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid4()),
            email=email,
            password_hash=hash_password(str(uuid4())),
        )
        db.add(user)

    user.full_name = payload.get("name") or payload.get("given_name") or email
    user.role = role_name
    user.role_id = role_obj.id if role_obj else None
    user.is_active = True
    db.commit()
    db.refresh(user)
    user._external_permissions = permissions
    return user


def _get_local_user_from_token(db: Session, token: str) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise _credentials_exception()
    except JWTError:
        raise _credentials_exception()

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise _credentials_exception()
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _credentials_exception()
    token = credentials.credentials
    auth_mode = (settings.AUTH_MODE or "mock").lower()
    if auth_mode == "asgardeo":
        return _get_or_create_asgardeo_user(db, _validate_asgardeo_token(token))
    if auth_mode == "hybrid":
        try:
            return _get_local_user_from_token(db, token)
        except HTTPException:
            try:
                return _get_or_create_asgardeo_user(db, _validate_asgardeo_token(token))
            except HTTPException:
                if settings.WSO2_APIM_ENABLED:
                    return _get_or_create_wso2_user(db, wso2_service.validate_access_token(token))
                raise
    if settings.WSO2_APIM_ENABLED:
        try:
            return _get_local_user_from_token(db, token)
        except HTTPException:
            return _get_or_create_wso2_user(db, wso2_service.validate_access_token(token))

    return _get_local_user_from_token(db, token)


def get_user_permissions(db: Session, user: User) -> list[str]:
    external_permissions = getattr(user, "_external_permissions", None)
    if external_permissions:
        return list(external_permissions)
    permissions = (
        db.query(Permission.codename)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .filter(RolePermission.role_id == user.role_id)
        .all()
    )
    return [p[0] for p in permissions]


def require_permission(permission: str):
    def permission_dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        user_permissions = get_user_permissions(db, current_user)
        if permission not in user_permissions and "admin:manage" not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}",
            )
        return current_user
    return permission_dependency


def require_role(role: str):
    def role_dependency(
        current_user: User = Depends(get_current_user),
    ):
        if current_user.role != role and current_user.role != "ROLE_ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: {role}",
            )
        return current_user
    return role_dependency
