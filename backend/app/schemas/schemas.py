from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# === Auth Schemas ===
class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    # OLD IMPLEMENTATION - kept for reference
    # email was the only accepted login field. It remains supported for older clients.
    email: Optional[str] = None
    password: str


class UserCreate(BaseModel):
    email: str
    username: Optional[str] = None
    password: str
    full_name: str
    role: str = "ROLE_CITIZEN"
    district: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    assigned_region: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    district: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    assigned_region: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    district: Optional[str] = None
    organization: Optional[str] = None
    department: Optional[str] = None
    assigned_region: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None


class RoleAssignRequest(BaseModel):
    role: str


# === Disaster Event Schemas ===
class DisasterEventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    disaster_type: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    affected_districts: Optional[list] = None


class DisasterEventResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    disaster_type: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    affected_districts: Optional[list] = None
    created_by_user_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === Household Schemas ===
class HouseholdCreate(BaseModel):
    head_full_name: str
    head_nic: Optional[str] = None
    head_phone: Optional[str] = None
    district: Optional[str] = None
    ds_division: Optional[str] = None
    gn_division: Optional[str] = None
    address: Optional[str] = None
    family_size: int = 1
    damage_level: Optional[str] = None
    damage_description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    disaster_event_id: Optional[str] = None


class HouseholdResponse(BaseModel):
    id: str
    head_full_name: str
    head_nic: Optional[str] = None
    head_phone: Optional[str] = None
    district: Optional[str] = None
    ds_division: Optional[str] = None
    gn_division: Optional[str] = None
    address: Optional[str] = None
    family_size: int
    damage_level: Optional[str] = None
    damage_description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str
    registered_by_user_id: Optional[str] = None
    disaster_event_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DamageAssessmentCreate(BaseModel):
    damage_level: str
    structural_damage_score: Optional[int] = None
    content_loss_score: Optional[int] = None
    casualties: int = 0
    injuries: int = 0
    notes: Optional[str] = None


# === Relief Application Schemas ===
class ReliefApplicationCreate(BaseModel):
    household_id: str
    disaster_event_id: Optional[str] = None
    required_items: Optional[list] = None


class ReliefApplicationResponse(BaseModel):
    id: str
    household_id: str
    disaster_event_id: Optional[str] = None
    applicant_user_id: Optional[str] = None
    required_items: Optional[list] = None
    status: str
    submitted_at: Optional[datetime] = None
    verified_by_user_id: Optional[str] = None
    verified_at: Optional[datetime] = None
    approved_by_user_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VerificationRequest(BaseModel):
    notes: Optional[str] = None


class VerificationResponse(BaseModel):
    id: str
    relief_application_id: str
    verifier_id: Optional[str] = None
    verification_status: str
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === Relief Program Schemas ===
class ReliefProgramCreate(BaseModel):
    name: str
    description: Optional[str] = None
    disaster_event_id: Optional[str] = None
    budget: Optional[float] = None
    currency: str = "LKR"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = "ACTIVE"


class ReliefProgramResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    disaster_event_id: Optional[str] = None
    budget: Optional[float] = None
    currency: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    created_by_user_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReliefPackageCreate(BaseModel):
    relief_program_id: str
    name: str
    items_json: Optional[dict] = None
    total_value: float = 0.0


# === Payment Schemas ===
class PaymentRequestCreate(BaseModel):
    relief_application_id: str
    household_id: Optional[str] = None
    amount: float
    currency: str = "LKR"
    payment_type: str = "CASH"
    notes: Optional[str] = None


class PaymentRequestResponse(BaseModel):
    id: str
    relief_application_id: str
    household_id: Optional[str] = None
    amount: float
    currency: Optional[str] = None
    payment_type: Optional[str] = None
    status: str
    approved_by_user_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === Dispatch Schemas ===
class DispatchOrderCreate(BaseModel):
    relief_application_id: str
    warehouse_id: Optional[str] = None
    assigned_ngo_id: Optional[str] = None
    items_json: Optional[dict] = None
    notes: Optional[str] = None


class DispatchOrderResponse(BaseModel):
    id: str
    relief_application_id: str
    warehouse_id: Optional[str] = None
    assigned_ngo_id: Optional[str] = None
    items_json: Optional[dict] = None
    status: str
    dispatched_by_user_id: Optional[str] = None
    dispatched_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NGOPartnerAssignmentCreate(BaseModel):
    ngo_user_id: str
    relief_application_id: Optional[str] = None
    task_description: Optional[str] = None


# === Audit & Notification Schemas ===
class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: Optional[str] = None
    type: Optional[str] = None
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === GIS Schemas ===
class GISLocationCreate(BaseModel):
    name: str
    location_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    disaster_event_id: Optional[str] = None
    properties_json: Optional[dict] = None


class GISLocationResponse(BaseModel):
    id: str
    name: str
    location_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    disaster_event_id: Optional[str] = None
    properties_json: Optional[dict] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# === AI Schemas ===
class AIRequest(BaseModel):
    prompt: str
    type: str = "summarize-damage"


class AIResponse(BaseModel):
    result: str
    type: str
    structured_data: Optional[dict] = None
