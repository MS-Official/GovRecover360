from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import (
    create_access_token, hash_password, verify_password,
    get_current_user, get_user_permissions, require_role,
)
from app.models.models import User, Role, RolePermission, Permission
from app.schemas.schemas import (
    LoginRequest, TokenResponse, UserCreate, UserResponse, UserUpdate, RoleAssignRequest,
)

router = APIRouter()


@router.post("/api/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    permissions = get_user_permissions(db, user)
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "permissions": permissions,
    })
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            district=user.district,
            organization=user.organization,
            department=user.department,
            assigned_region=user.assigned_region,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
    )


@router.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        district=current_user.district,
        organization=current_user.organization,
        department=current_user.department,
        assigned_region=current_user.assigned_region,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@router.get("/api/users", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_ADMIN")),
):
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id, email=u.email, full_name=u.full_name, role=u.role,
            district=u.district, organization=u.organization, department=u.department,
            assigned_region=u.assigned_region, is_active=u.is_active, created_at=u.created_at,
        )
        for u in users
    ]


@router.post("/api/users", response_model=UserResponse, status_code=201)
def create_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_ADMIN")),
):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    role_obj = db.query(Role).filter(Role.name == req.role).first()
    user = User(
        id=str(uuid4()),
        email=req.email,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role=req.role,
        role_id=role_obj.id if role_obj else None,
        district=req.district,
        organization=req.organization,
        department=req.department,
        assigned_region=req.assigned_region,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id, email=user.email, full_name=user.full_name, role=user.role,
        district=user.district, organization=user.organization, department=user.department,
        assigned_region=user.assigned_region, is_active=user.is_active, created_at=user.created_at,
    )


@router.post("/api/users/{user_id}/roles")
def assign_role(
    user_id: str,
    req: RoleAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role_obj = db.query(Role).filter(Role.name == req.role).first()
    if not role_obj:
        raise HTTPException(status_code=400, detail="Invalid role")
    user.role = req.role
    user.role_id = role_obj.id
    db.commit()
    return {"message": "Role updated successfully"}


@router.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ROLE_ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user.id, email=user.email, full_name=user.full_name, role=user.role,
        district=user.district, organization=user.organization, department=user.department,
        assigned_region=user.assigned_region, is_active=user.is_active, created_at=user.created_at,
    )
