from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission
from app.models.models import User, PaymentRequest
from app.schemas.schemas import PaymentRequestCreate, PaymentRequestResponse

router = APIRouter()


@router.get("/api/payments", response_model=list[PaymentRequestResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PaymentRequest)
    if current_user.role == "ROLE_CITIZEN":
        return []
    payments = query.order_by(PaymentRequest.created_at.desc()).all()
    return [
        PaymentRequestResponse(
            id=p.id, relief_application_id=p.relief_application_id,
            household_id=p.household_id, amount=p.amount, currency=p.currency,
            payment_type=p.payment_type, status=p.status,
            approved_by_user_id=p.approved_by_user_id, approved_at=p.approved_at,
            processed_at=p.processed_at, notes=p.notes, created_at=p.created_at,
        )
        for p in payments
    ]


@router.get("/api/payments/{payment_id}", response_model=PaymentRequestResponse)
def get_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.query(PaymentRequest).filter(PaymentRequest.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return PaymentRequestResponse(
        id=payment.id, relief_application_id=payment.relief_application_id,
        household_id=payment.household_id, amount=payment.amount,
        currency=payment.currency, payment_type=payment.payment_type,
        status=payment.status, approved_by_user_id=payment.approved_by_user_id,
        approved_at=payment.approved_at, processed_at=payment.processed_at,
        notes=payment.notes, created_at=payment.created_at,
    )


@router.post("/api/payments", response_model=PaymentRequestResponse, status_code=201)
def create_payment(
    req: PaymentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payment:read")),
):
    payment = PaymentRequest(
        id=str(uuid4()),
        relief_application_id=req.relief_application_id,
        household_id=req.household_id,
        amount=req.amount,
        currency=req.currency,
        payment_type=req.payment_type,
        notes=req.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return PaymentRequestResponse(
        id=payment.id, relief_application_id=payment.relief_application_id,
        household_id=payment.household_id, amount=payment.amount,
        currency=payment.currency, payment_type=payment.payment_type,
        status=payment.status, approved_by_user_id=payment.approved_by_user_id,
        approved_at=payment.approved_at, processed_at=payment.processed_at,
        notes=payment.notes, created_at=payment.created_at,
    )


@router.post("/api/payments/{payment_id}/approve", response_model=PaymentRequestResponse)
def approve_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("payment:approve")),
):
    payment = db.query(PaymentRequest).filter(PaymentRequest.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.status = "PAYMENT_APPROVED"
    payment.approved_by_user_id = current_user.id
    payment.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)
    return PaymentRequestResponse(
        id=payment.id, relief_application_id=payment.relief_application_id,
        household_id=payment.household_id, amount=payment.amount,
        currency=payment.currency, payment_type=payment.payment_type,
        status=payment.status, approved_by_user_id=payment.approved_by_user_id,
        approved_at=payment.approved_at, processed_at=payment.processed_at,
        notes=payment.notes, created_at=payment.created_at,
    )
