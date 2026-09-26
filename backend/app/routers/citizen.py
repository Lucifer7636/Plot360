"""
PLOT360 Backend — Citizen Services Router
Sections 41 & 42: Service request creation with persistent SR-YYYY-XXXXXX identifiers,
status tracking, and application queries.
"""
from typing import List, Optional
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.parcel import Parcel
from app.models.workflow import ServiceRequest, Application
from app.models.notification import Notification
from app.models.user import AuditLog
from app.schemas.citizen import ServiceRequestIn, ServiceRequestOut
from app.services.workflow_service import init_workflow_for_request
from app.dependencies import get_current_user_optional, AuthenticatedUserContext
from app.auth.field_filter import filter_service_request_record

router = APIRouter(prefix="/citizen", tags=["Citizen Services"])

DEPARTMENT_MAPPINGS = {
    "demarcation": "Department of Revenue & Land Records",
    "mutation": "Sub-Registrar Office & Revenue Cell",
    "noc": "Municipal Corporation Planning Cell",
    "ror_copy": "Department of Land Records (Bhoomi/Jamabandi)",
    "building_permission": "Town & Country Planning Authority",
    "encumbrance_certificate": "Inspector General of Registration",
}


@router.get("/service-requests", summary="List citizen service requests")
def list_service_requests(
    ulpin: Optional[str] = Query(None, description="Filter by ULPIN"),
    limit: int = Query(50, ge=1, le=100),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(ServiceRequest)
    if ulpin:
        clean = ulpin.strip()
        q = q.filter((ServiceRequest.ulpin == clean) | (ServiceRequest.request_id == clean))
    records = q.order_by(ServiceRequest.created_at.desc()).limit(limit).all()
    return [filter_service_request_record(r, user_ctx) for r in records]


@router.post("/service-requests", summary="Submit a new citizen service request")
def submit_service_request(
    payload: ServiceRequestIn,
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Section 42: Persistent SR-YYYY-XXXXXX format.
    Creates service request, initializes workflow instance, and creates notifications.
    """
    year = datetime.now().year
    code = f"{uuid.uuid4().int % 1000000:06d}"
    request_id = f"SR-{year}-{code}"

    # Resolve parcel if provided
    parcel_id = None
    target_ulpin = payload.ulpin or payload.parcel_id
    if target_ulpin:
        p = db.query(Parcel).filter(
            (Parcel.ulpin == target_ulpin) | (Parcel.parcel_id == target_ulpin)
        ).first()
        if p:
            parcel_id = p.id
            target_ulpin = p.ulpin

    dept = DEPARTMENT_MAPPINGS.get(payload.service_type, "Competent Land Authority")
    citizen_user_id = user_ctx.id if user_ctx else None

    sr = ServiceRequest(
        request_id=request_id,
        parcel_id=parcel_id,
        ulpin=target_ulpin,
        citizen_id=citizen_user_id,
        service_type=payload.service_type,
        department=dept,
        applicant_name=payload.applicant_name,
        applicant_phone=payload.applicant_phone,
        applicant_email=payload.applicant_email,
        notes=payload.notes,
        status="SUBMITTED",
        current_step=1,
        total_steps=5
    )
    db.add(sr)
    db.flush()

    # Initialize workflow engine instance
    init_workflow_for_request(sr, db)

    # Create submission notification
    notif = Notification(
        user_id=citizen_user_id,
        title="Service Request Submitted",
        message=f"Request {request_id} for {payload.service_type.replace('_', ' ').title()} has been registered.",
        notification_type="SERVICE_REQUEST",
        priority="NORMAL",
        related_ulpin=target_ulpin,
        related_entity_type="service_request",
        related_entity_id=request_id
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        parcel_id=parcel_id,
        ulpin=target_ulpin,
        user_id=citizen_user_id,
        user_name=payload.applicant_name,
        role="citizen",
        action="CREATE_SERVICE_REQUEST",
        entity="service_request",
        entity_id=request_id,
        new_value=payload.service_type,
        notes=f"Submitted request {request_id}"
    )
    db.add(audit)

    db.commit()
    db.refresh(sr)

    return {
        "success": True,
        "request_id": sr.request_id,
        "ulpin": sr.ulpin,
        "applicant_name": sr.applicant_name,
        "status": sr.status,
        "department": sr.department,
        "service_type": sr.service_type,
        "current_step": sr.current_step,
        "total_steps": sr.total_steps,
        "message": f"Service request {sr.request_id} created successfully."
    }


@router.get("/applications/{application_id}", summary="Get application details by ID")
def get_application(application_id: str, db: Session = Depends(get_db)):
    app_rec = db.query(Application).filter(Application.application_id == application_id).first()
    if not app_rec:
        # Fallback to service request if matching
        sr = db.query(ServiceRequest).filter(ServiceRequest.request_id == application_id).first()
        if sr:
            return {
                "application_id": sr.request_id,
                "ulpin": sr.ulpin,
                "type": sr.service_type,
                "applicant_name": sr.applicant_name,
                "department": sr.department,
                "status": sr.status,
                "current_step": sr.current_step
            }
        raise HTTPException(status_code=404, detail="Application not found")

    return {
        "application_id": app_rec.application_id,
        "ulpin": app_rec.ulpin,
        "type": app_rec.application_type,
        "applicant_name": app_rec.applicant_name,
        "department": app_rec.department,
        "status": app_rec.status
    }


# Top-level applications router to satisfy GET /api/v1/applications/{id} per Section 129
applications_router = APIRouter(prefix="/applications", tags=["Applications"])


@applications_router.get("/{application_id}", summary="Get application details by ID (Top-level endpoint)")
def get_application_direct(application_id: str, db: Session = Depends(get_db)):
    return get_application(application_id=application_id, db=db)



@router.get("/transactions/{transaction_id}", summary="Track transaction, application, or service request lifecycle")
def track_transaction(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """
    Section 41 & 129: Unified transaction tracking by deed number, application number, or service request ID.
    Stages: SUBMITTED -> DOCUMENTS_RECEIVED -> VERIFICATION -> DEPARTMENT_REVIEW -> FINAL_PROCESSING -> DECISION.
    """
    clean_id = transaction_id.strip()

    # 1. Check ServiceRequest
    sr = db.query(ServiceRequest).filter(
        (ServiceRequest.request_id == clean_id) | (ServiceRequest.id == int(clean_id) if clean_id.isdigit() else False)
    ).first()
    if sr:
        stages = [
            {"stage": "SUBMITTED", "name": "Application Lodged", "completed": sr.current_step >= 1},
            {"stage": "DOCUMENTS_RECEIVED", "name": "Documents Received & Verified", "completed": sr.current_step >= 2},
            {"stage": "VERIFICATION", "name": "Field & Cadastral Verification", "completed": sr.current_step >= 3},
            {"stage": "DEPARTMENT_REVIEW", "name": "Departmental Scrutiny", "completed": sr.current_step >= 4},
            {"stage": "FINAL_PROCESSING", "name": "Order Drafting & Endorsement", "completed": sr.current_step >= 5},
            {"stage": "DECISION", "name": "Sanction / Final Certificate Issued", "completed": sr.status == "DECISION"}
        ]
        return {
            "transaction_id": sr.request_id,
            "type": "SERVICE_REQUEST",
            "ulpin": sr.ulpin,
            "service_name": sr.service_type.replace('_', ' ').title(),
            "department": sr.department,
            "applicant_name": sr.applicant_name,
            "status": sr.status,
            "current_step": sr.current_step,
            "total_steps": sr.total_steps,
            "submitted_at": sr.created_at.isoformat() if sr.created_at else None,
            "stages": stages
        }

    # 2. Check Application
    app_rec = db.query(Application).filter(Application.application_id == clean_id).first()
    if app_rec:
        return {
            "transaction_id": app_rec.application_id,
            "type": "APPLICATION",
            "ulpin": app_rec.ulpin,
            "service_name": app_rec.application_type,
            "department": app_rec.department,
            "applicant_name": app_rec.applicant_name,
            "status": app_rec.status,
            "current_step": 4,
            "total_steps": 5,
            "submitted_at": app_rec.submission_date
        }

    # 3. Check Registration deed
    from app.models.governance import Registration
    reg = db.query(Registration).filter(
        (Registration.registration_id == clean_id) | (Registration.deed_number == clean_id)
    ).first()
    if reg:
        return {
            "transaction_id": reg.registration_id,
            "type": "REGISTRATION_DEED",
            "ulpin": reg.ulpin,
            "service_name": reg.transaction_type,
            "department": "Sub-Registrar Office",
            "status": reg.status,
            "submitted_at": reg.registration_date
        }

    raise HTTPException(status_code=404, detail=f"Transaction not found: '{clean_id}'")

