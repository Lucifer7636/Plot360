"""
PLOT360 Backend — Server-Side RBAC Field-Level Authorization & Data Exposure Filtering
Enforces strict server-side protection of sensitive parcel, fiscal, planning, and citizen PII.
Unauthorized fields are completely absent from API responses on the wire.
"""
from typing import Optional, Dict, Any, List
from app.auth.rbac import AuthenticatedUserContext
from app.models.governance import Encumbrance, Mortgage
from app.models.taxation import PropertyTax
from app.models.planning import BuildingPermission
from app.models.workflow import ServiceRequest


def is_admin_or_auditor(user_ctx: Optional[AuthenticatedUserContext]) -> bool:
    """Returns True if authenticated user is administrator or auditor."""
    if not user_ctx:
        return False
    return user_ctx.has_role("administrator") or user_ctx.has_role("auditor")


def can_access_encumbrance_details(user_ctx: Optional[AuthenticatedUserContext]) -> bool:
    """
    Registration and Revenue officers, plus Administrator and Auditor,
    are permitted to view confidential bank loan amounts, lending institutions, and mortgage refs.
    Citizens, Planning Officers, and Tax Officers are denied access to private financial lien details.
    """
    if not user_ctx:
        return False
    if is_admin_or_auditor(user_ctx):
        return True
    return user_ctx.has_role("revenue_officer") or user_ctx.has_role("registration_officer")


def can_access_tax_details(user_ctx: Optional[AuthenticatedUserContext]) -> bool:
    """
    Tax Officers and Municipal Officers, plus Administrator and Auditor,
    are permitted to view property tax assessment payment amounts and annual demand.
    Citizens, Revenue Officers, Planning Officers, and Registration Officers are denied access.
    """
    if not user_ctx:
        return False
    if is_admin_or_auditor(user_ctx):
        return True
    return user_ctx.has_role("tax_officer") or user_ctx.has_role("municipal_officer")


def can_access_building_details(user_ctx: Optional[AuthenticatedUserContext]) -> bool:
    """
    Planning Officers and Municipal Officers, plus Administrator and Auditor,
    are permitted to view sanctioned floor counts, approved areas, and structural building info.
    Citizens, Revenue Officers, Registration Officers, and Tax Officers are denied access.
    """
    if not user_ctx:
        return False
    if is_admin_or_auditor(user_ctx):
        return True
    return user_ctx.has_role("planning_officer") or user_ctx.has_role("municipal_officer")


def can_access_service_request_pii(user_ctx: Optional[AuthenticatedUserContext], applicant_user_id: Optional[int] = None) -> bool:
    """
    Officers with service_request:read (Revenue, Admin, Auditor),
    or the citizen applicant themselves, may view applicant phone and email.
    Unauthenticated callers or other citizens are denied contact PII.
    """
    if not user_ctx:
        return False
    if is_admin_or_auditor(user_ctx) or user_ctx.has_role("revenue_officer") or user_ctx.has_permission("service_request:read"):
        return True
    if applicant_user_id is not None and user_ctx.id == applicant_user_id:
        return True
    return False


def can_access_ai_internal_notes(user_ctx: Optional[AuthenticatedUserContext]) -> bool:
    """
    Revenue Officers, Planning Officers, Administrators, and Auditors
    are permitted to view internal officer inspection notes and confidence metrics.
    Citizens receive only public category, description, and status.
    """
    if not user_ctx:
        return False
    if is_admin_or_auditor(user_ctx):
        return True
    return user_ctx.has_role("revenue_officer") or user_ctx.has_role("planning_officer")


# ── Serializers with field-level omission ─────────────────────────────────────

def filter_encumbrance_record(enc: Encumbrance, user_ctx: Optional[AuthenticatedUserContext]) -> Dict[str, Any]:
    """Serializes encumbrance record; omits institution, loan_amount, reference if unauthorized."""
    if can_access_encumbrance_details(user_ctx):
        return {
            "id": enc.id,
            "ulpin": enc.ulpin,
            "status": enc.status,
            "institution": enc.institution,
            "loan_amount": enc.loan_amount,
            "noc_required": enc.noc_required,
            "reference": enc.reference,
            "source": enc.source,
        }
    # Unauthorized / Public / Citizen: only public status
    return {
        "id": enc.id,
        "ulpin": enc.ulpin,
        "status": enc.status,
    }


def filter_mortgage_record(mort: Mortgage, user_ctx: Optional[AuthenticatedUserContext]) -> Dict[str, Any]:
    """Serializes mortgage record; omits mortgagee, amount, deed_reference if unauthorized."""
    if can_access_encumbrance_details(user_ctx):
        return {
            "id": mort.id,
            "ulpin": mort.ulpin,
            "mortgagee": mort.mortgagee,
            "amount": mort.amount,
            "status": mort.status,
            "deed_reference": mort.deed_reference,
            "registered_on": mort.registered_on,
        }
    return {
        "id": mort.id,
        "ulpin": mort.ulpin,
        "status": mort.status,
    }


def filter_property_tax_record(tax: PropertyTax, user_ctx: Optional[AuthenticatedUserContext]) -> Dict[str, Any]:
    """Serializes property tax record; omits amount_paid, annual_demand, receipt_no if unauthorized."""
    if can_access_tax_details(user_ctx):
        return {
            "id": tax.id,
            "ulpin": tax.ulpin,
            "assessment_id": tax.assessment_id,
            "status": tax.status,
            "amount_paid": tax.amount_paid,
            "annual_demand": tax.annual_demand,
            "last_payment": tax.last_payment,
            "due_date": tax.due_date,
            "receipt_no": tax.receipt_no,
            "source": tax.source,
        }
    return {
        "id": tax.id,
        "ulpin": tax.ulpin,
        "assessment_id": tax.assessment_id,
        "status": tax.status,
    }


def filter_building_permission_record(bp: BuildingPermission, user_ctx: Optional[AuthenticatedUserContext]) -> Dict[str, Any]:
    """Serializes building permission record; omits floors, number_of_floors, approved_area if unauthorized."""
    if can_access_building_details(user_ctx):
        return {
            "id": bp.id,
            "ulpin": bp.ulpin,
            "permission_id": bp.permission_id,
            "status": bp.status,
            "approval_date": bp.approval_date,
            "floors": bp.floors,
            "number_of_floors": bp.number_of_floors,
            "approved_area": bp.approved_area,
            "building_information": bp.building_information,
            "source": bp.source,
        }
    return {
        "id": bp.id,
        "ulpin": bp.ulpin,
        "permission_id": bp.permission_id,
        "status": bp.status,
    }


def filter_service_request_record(sr: ServiceRequest, user_ctx: Optional[AuthenticatedUserContext]) -> Dict[str, Any]:
    """Serializes service request record; omits applicant_phone, applicant_email if unauthorized."""
    can_see_pii = can_access_service_request_pii(user_ctx, sr.citizen_id)
    base = {
        "id": sr.id,
        "request_id": sr.request_id,
        "ulpin": sr.ulpin,
        "service_type": sr.service_type,
        "department": sr.department,
        "applicant_name": sr.applicant_name,
        "status": sr.status,
        "current_step": sr.current_step,
        "total_steps": sr.total_steps,
        "notes": sr.notes if can_see_pii else None,
        "created_at": sr.created_at.isoformat() if sr.created_at else None,
    }
    if can_see_pii:
        base["applicant_phone"] = sr.applicant_phone
        base["applicant_email"] = sr.applicant_email
    return base
