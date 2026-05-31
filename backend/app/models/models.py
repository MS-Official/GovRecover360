from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


DAMAGE_LEVELS = ['MINOR', 'MODERATE', 'SEVERE', 'TOTAL']
APPLICATION_STATUSES = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'PAYMENT_APPROVED', 'DISPATCHED', 'COMPLETED', 'REJECTED']
PAYMENT_TYPES = ['CASH', 'VOUCHER', 'BANK_TRANSFER']
DISPATCH_STATUSES = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'PARTIAL']

ROLES = ['ROLE_ADMIN', 'ROLE_DISASTER_MANAGER', 'ROLE_FIELD_OFFICER', 'ROLE_VERIFIER', 'ROLE_PROGRAM_MANAGER', 'ROLE_FINANCE_OFFICER', 'ROLE_WAREHOUSE_OFFICER', 'ROLE_GIS_OFFICER', 'ROLE_NGO_PARTNER', 'ROLE_AUDITOR', 'ROLE_CITIZEN']


class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    codename = Column(String(100), unique=True, nullable=False)
    name = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)

    roles = relationship("Role", secondary="role_permissions", back_populates="permissions")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="ROLE_CITIZEN")
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=True)
    district = Column(String(100), nullable=True)
    organization = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    assigned_region = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role_rel = relationship("Role")


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    disaster_type = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    affected_districts = Column(JSON, nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User")


class DisasterZone(Base):
    __tablename__ = "disaster_zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    disaster_event_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=False)
    name = Column(String(255), nullable=False)
    zone_type = Column(String(50), nullable=True)
    geometry = Column(Text, nullable=True)
    risk_level = Column(String(50), nullable=True)
    area_km2 = Column(Float, nullable=True)
    estimated_population = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    disaster_event = relationship("DisasterEvent")


class Household(Base):
    __tablename__ = "households"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    head_full_name = Column(String(255), nullable=False)
    head_nic = Column(String(50), nullable=True)
    head_phone = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    ds_division = Column(String(100), nullable=True)
    gn_division = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    family_size = Column(Integer, default=1)
    damage_level = Column(String(50), nullable=True)
    damage_description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="REGISTERED")
    registered_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    disaster_event_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    registered_by = relationship("User", foreign_keys=[registered_by_user_id])
    disaster_event = relationship("DisasterEvent")
    damage_assessments = relationship("DamageAssessment", back_populates="household")


class DamageAssessment(Base):
    __tablename__ = "damage_assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False)
    field_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    damage_level = Column(String(50), nullable=True)
    structural_damage_score = Column(Integer, nullable=True)
    content_loss_score = Column(Integer, nullable=True)
    casualties = Column(Integer, default=0)
    injuries = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    assessment_date = Column(DateTime, default=datetime.utcnow)

    household = relationship("Household", back_populates="damage_assessments")
    field_officer = relationship("User", foreign_keys=[field_officer_id])


class ReliefApplication(Base):
    __tablename__ = "relief_applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    household_id = Column(String(36), ForeignKey("households.id"), nullable=False)
    disaster_event_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=True)
    applicant_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    required_items = Column(JSON, nullable=True)
    status = Column(String(50), default="DRAFT")
    submitted_at = Column(DateTime, nullable=True)
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    approved_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    household = relationship("Household")
    disaster_event = relationship("DisasterEvent")
    applicant = relationship("User", foreign_keys=[applicant_user_id])
    verifier = relationship("User", foreign_keys=[verified_by_user_id])
    approver = relationship("User", foreign_keys=[approved_by_user_id])
    verifications = relationship("BeneficiaryVerification", back_populates="relief_application")
    payment_requests = relationship("PaymentRequest", back_populates="relief_application")
    dispatch_orders = relationship("DispatchOrder", back_populates="relief_application")


class BeneficiaryVerification(Base):
    __tablename__ = "beneficiary_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    relief_application_id = Column(String(36), ForeignKey("relief_applications.id"), nullable=False)
    verifier_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verification_status = Column(String(50), default="PENDING")
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    relief_application = relationship("ReliefApplication", back_populates="verifications")
    verifier = relationship("User", foreign_keys=[verifier_id])


class ReliefProgram(Base):
    __tablename__ = "relief_programs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    disaster_event_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=True)
    budget = Column(Float, nullable=True)
    currency = Column(String(10), default="LKR")
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="ACTIVE")
    created_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    disaster_event = relationship("DisasterEvent")
    created_by = relationship("User", foreign_keys=[created_by_user_id])


class ReliefPackage(Base):
    __tablename__ = "relief_packages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    relief_program_id = Column(String(36), ForeignKey("relief_programs.id"), nullable=False)
    name = Column(String(255), nullable=False)
    items_json = Column(JSON, nullable=True)
    total_value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    relief_program = relationship("ReliefProgram")


class PaymentRequest(Base):
    __tablename__ = "payment_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    relief_application_id = Column(String(36), ForeignKey("relief_applications.id"), nullable=False)
    household_id = Column(String(36), ForeignKey("households.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="LKR")
    payment_type = Column(String(50), default="CASH")
    status = Column(String(50), default="PENDING")
    approved_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    relief_application = relationship("ReliefApplication", back_populates="payment_requests")
    household = relationship("Household")
    approved_by = relationship("User", foreign_keys=[approved_by_user_id])


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    quantity_available = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    warehouse = relationship("Warehouse", back_populates="items")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    capacity = Column(Integer, nullable=True)
    current_occupancy = Column(Integer, default=0)
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("InventoryItem", back_populates="warehouse")


class DispatchOrder(Base):
    __tablename__ = "dispatch_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    relief_application_id = Column(String(36), ForeignKey("relief_applications.id"), nullable=False)
    warehouse_id = Column(String(36), ForeignKey("warehouses.id"), nullable=True)
    assigned_ngo_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    items_json = Column(JSON, nullable=True)
    status = Column(String(50), default="PENDING")
    dispatched_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    relief_application = relationship("ReliefApplication", back_populates="dispatch_orders")
    warehouse = relationship("Warehouse")
    assigned_ngo = relationship("User", foreign_keys=[assigned_ngo_id])
    dispatched_by = relationship("User", foreign_keys=[dispatched_by_user_id])


class NGOPartnerAssignment(Base):
    __tablename__ = "ngo_partner_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    ngo_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    relief_application_id = Column(String(36), ForeignKey("relief_applications.id"), nullable=True)
    task_description = Column(Text, nullable=True)
    status = Column(String(50), default="ASSIGNED")
    assigned_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    ngo_user = relationship("User", foreign_keys=[ngo_user_id])
    relief_application = relationship("ReliefApplication")
    assigned_by = relationship("User", foreign_keys=[assigned_by_user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255), nullable=True)
    user_role = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    type = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class GISLocation(Base):
    __tablename__ = "gis_locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(255), nullable=False)
    location_type = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    district = Column(String(100), nullable=True)
    disaster_event_id = Column(String(36), ForeignKey("disaster_events.id"), nullable=True)
    properties_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    disaster_event = relationship("DisasterEvent")
