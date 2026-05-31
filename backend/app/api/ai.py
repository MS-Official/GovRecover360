from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_current_user, require_permission
from app.models.models import User
from app.schemas.schemas import AIRequest, AIResponse

router = APIRouter()


@router.post("/api/ai/summarize-damage", response_model=AIResponse)
def summarize_damage(
    req: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AIResponse(
        result=f"Damage assessment summary based on '{req.prompt}': "
               f"Severe damage reported in multiple sectors. "
               f"Estimated 45% structural damage, 30% content loss. "
               f"Priority intervention required for affected communities.",
        type="summarize-damage",
        structured_data={
            "total_affected": 1250,
            "severe_damage": 340,
            "moderate_damage": 560,
            "minor_damage": 350,
            "estimated_loss_usd": 2500000,
            "priority_districts": ["Colombo", "Galle", "Matara", "Trincomalee"],
            "recommended_action": "Immediate deployment of relief teams to high-risk zones",
        },
    )


@router.post("/api/ai/generate-citizen-message", response_model=AIResponse)
def generate_citizen_message(
    req: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AIResponse(
        result=f"Dear Citizen,\n\nIn response to your inquiry regarding '{req.prompt}', "
               f"we would like to inform you that your relief application is being processed. "
               f"Our team is working diligently to ensure all verified households receive "
               f"the necessary support. You will be notified once your application status changes.\n\n"
               f"Thank you for your patience.\n- GovRecover360 Team",
        type="generate-citizen-message",
        structured_data={
            "subject": "Update on Your Relief Application",
            "recipient": "Affected Citizen",
            "message_type": "status_update",
            "language": "en",
        },
    )


@router.post("/api/ai/generate-disaster-report", response_model=AIResponse)
def generate_disaster_report(
    req: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AIResponse(
        result=f"DISASTER IMPACT REPORT\n"
               f"Generated for: '{req.prompt}'\n"
               f"Period: Current Assessment Cycle\n\n"
               f"Executive Summary:\n"
               f"The recent disaster event has significantly impacted multiple districts. "
               f"Preliminary assessments indicate widespread damage to residential structures, "
               f"with an estimated 2,500 families affected. Emergency relief operations are underway "
               f"with coordination from local authorities and NGO partners.\n\n"
               f"Key Findings:\n"
               f"- Total affected households: 2,500\n"
               f"- Severe damage: 600 households\n"
               f"- Moderate damage: 1,100 households\n"
               f"- Minor damage: 800 households\n"
               f"- Relief applications received: 1,800\n"
               f"- Applications verified: 1,200\n"
               f"- Relief distributed: 800 households\n\n"
               f"Recommendations:\n"
               f"1. Continue verification of pending applications\n"
               f"2. Coordinate with NGO partners for last-mile delivery\n"
               f"3. Monitor inventory levels and initiate procurement\n"
               f"4. Deploy additional field officers for rapid assessment",
        type="generate-disaster-report",
        structured_data={
            "report_title": "Disaster Impact Assessment Report",
            "generated_by": "AI Assistant",
            "total_affected_households": 2500,
            "severe_damage": 600,
            "moderate_damage": 1100,
            "minor_damage": 800,
            "applications_received": 1800,
            "applications_verified": 1200,
            "relief_distributed": 800,
            "districts_affected": ["Colombo", "Galle", "Matara", "Hambantota", "Trincomalee", "Batticaloa"],
            "recommendations": [
                "Continue verification of pending applications",
                "Coordinate with NGO partners for last-mile delivery",
                "Monitor inventory levels and initiate procurement",
                "Deploy additional field officers for rapid assessment",
            ],
        },
    )


@router.post("/api/ai/summarize-audit-logs", response_model=AIResponse)
def summarize_audit_logs(
    req: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AIResponse(
        result=f"Audit log analysis based on '{req.prompt}':\n\n"
               f"1. Action Frequency: The most frequent action is CREATE (35%), followed by UPDATE (28%) and APPROVE (15%).\n"
               f"2. User Activity: Admin User accounted for 40% of all administrative actions.\n"
               f"3. Potential Anomaly: 2 failed login attempts detected from IP 192.168.1.100 outside working hours.\n"
               f"4. Status Summary: All relief disbursements have been verified by multiple roles complying with system constraints.",
        type="summarize-audit-logs",
        structured_data={
            "total_logs_analyzed": 150,
            "anomalies_detected": 1,
            "actions_breakdown": {
                "CREATE": 52,
                "UPDATE": 42,
                "APPROVE": 22,
                "PAYMENT": 18,
                "DISPATCH": 16
            }
        }
    )

