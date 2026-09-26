"""
PLOT360 Backend — Demo / Presentation Router
Sections 66 & 94: Autonomous demonstration backend endpoints supporting session management,
10 suggested demo targets, and progression across the 15-stage narrative sequence.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.rbac import (
    get_current_user_optional,
    require_role,
    require_permission,
    AuthenticatedUserContext
)
from app.auth.field_filter import (
    can_access_building_details,
    can_access_encumbrance_details,
    can_access_tax_details,
    can_access_ai_internal_notes
)
from app.schemas.demo import (
    DemoSessionCreate,
    DemoSessionOut,
    DemoTargetOut,
    DemoStepOut,
    DemoLocationOut,
    DemoParcelDetailOut,
    DemoSearchResultOut
)
from app.services.demo_service import (
    create_or_get_demo_session,
    get_demo_session_by_id,
    advance_demo_session,
    reset_demo_session,
    SUGGESTED_TARGETS,
    DEMO_STEPS,
    get_demo_locations,
    get_demo_parcels,
    get_demo_parcel_by_ulpin,
    search_demo_catalog
)

router = APIRouter(prefix="/demo", tags=["Presentation & Demo Catalogue"])



def _format_session_response(session, db: Session) -> DemoSessionOut:
    step_idx = min(max(session.current_step - 1, 0), len(DEMO_STEPS) - 1)
    current_step_details = DEMO_STEPS[step_idx]

    return DemoSessionOut(
        session_id=session.session_id,
        target_ulpin=session.target_ulpin,
        target_parcel_id=session.target_parcel_id,
        location_id=session.location_id,
        location_name=session.location_name,
        current_step=session.current_step,
        total_steps=session.total_steps,
        status=session.status,
        is_completed=session.is_completed,
        current_step_details=current_step_details,
        all_steps=DEMO_STEPS,
        suggested_targets=SUGGESTED_TARGETS,
        context_data={
            "step_history": session.step_history,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "updated_at": session.updated_at.isoformat() if session.updated_at else None
        }
    )


@router.get("/targets", response_model=List[DemoTargetOut], summary="List 10 suggested demo targets across India")
def get_demo_targets():
    """Returns the 10 pre-configured demo targets spanning multiple states and land types."""
    return SUGGESTED_TARGETS


@router.get("/steps", response_model=List[DemoStepOut], summary="List all 15 presentation sequence stages")
def get_demo_steps():
    """Returns the ordered 15 presentation sequence steps."""
    return DEMO_STEPS


@router.post("/session", response_model=DemoSessionOut, summary="Initialize or create a presentation demo session")
def create_session(
    payload: DemoSessionCreate,
    db: Session = Depends(get_db)
):
    """
    Section 94: POST /api/v1/demo/session
    Request: selected ULPIN or location
    Response: demo session ID and complete sequence context.
    """
    target = payload.target_ulpin or "IN-PB-CHD-0001027"
    loc = payload.location_id or "chandigarh"
    session = create_or_get_demo_session(target, loc, db)
    return _format_session_response(session, db)


@router.get("/session/{session_id}", response_model=DemoSessionOut, summary="Get demo session state and current step context")
def get_session(
    session_id: str = Path(..., description="Demo session ID e.g. DEMO-XXXXXXXX"),
    db: Session = Depends(get_db)
):
    """Section 94: GET /api/v1/demo/session/{id}"""
    session = get_demo_session_by_id(session_id, db)
    if not session:
        raise HTTPException(status_code=404, detail=f"Demo session not found: '{session_id}'")
    return _format_session_response(session, db)


@router.post("/session/{session_id}/next", response_model=DemoSessionOut, summary="Advance demo session to next step")
def advance_session(
    session_id: str = Path(..., description="Demo session ID"),
    db: Session = Depends(get_db)
):
    """Section 94: POST /api/v1/demo/session/{id}/next"""
    try:
        session = advance_demo_session(session_id, db)
        return _format_session_response(session, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/session/{session_id}/reset", response_model=DemoSessionOut, summary="Reset demo session to step 1")
def reset_session_endpoint(
    session_id: str = Path(..., description="Demo session ID"),
    db: Session = Depends(get_db)
):
    """Section 94: POST /api/v1/demo/session/{id}/reset"""
    try:
        session = reset_demo_session(session_id, db)
        return _format_session_response(session, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Curated Demo Discovery & Catalogue APIs (Phases 6–9) ─────────────────────

@router.get("/locations", response_model=List[DemoLocationOut], summary="List all curated demo locations with filtering")
def list_demo_locations(
    state: Optional[str] = Query(None, description="Filter by state or UT"),
    urban_rural: Optional[str] = Query(None, description="Filter by Urban, Rural, Mountain, or Coastal"),
    location: Optional[str] = Query(None, description="Filter by location name or id")
):
    """
    Phase 7: GET /api/v1/demo/locations
    Returns the curated demonstration locations across India with sample parcel counts and ULPIN references.
    """
    return get_demo_locations(state=state, urban_rural=urban_rural, location=location)


def _filter_demo_parcel_components(p: dict, user_ctx: Optional[AuthenticatedUserContext], sentinel_avail: bool):
    """Applies strict P0 field-level RBAC filtering to demo parcel components."""
    raw_bp = p.get("bp")
    if raw_bp:
        if can_access_building_details(user_ctx):
            bp_filtered = raw_bp
        else:
            bp_filtered = {"id": raw_bp.get("id"), "status": raw_bp.get("status")}
    else:
        bp_filtered = None

    raw_enc = p.get("enc")
    if raw_enc:
        if can_access_encumbrance_details(user_ctx):
            enc_filtered = raw_enc
        else:
            enc_filtered = {"status": raw_enc.get("status")}
    else:
        enc_filtered = None

    raw_tax = p.get("tax")
    if raw_tax:
        if can_access_tax_details(user_ctx):
            tax_filtered = raw_tax
        else:
            tax_filtered = {"id": raw_tax.get("id"), "status": raw_tax.get("status")}
    else:
        tax_filtered = None

    raw_ai = p.get("ai_alert") if sentinel_avail else None
    if raw_ai:
        if can_access_ai_internal_notes(user_ctx):
            ai_filtered = raw_ai
        else:
            ai_filtered = {k: v for k, v in raw_ai.items() if k not in ["notes", "confidence"]}
    else:
        ai_filtered = None

    return bp_filtered, enc_filtered, tax_filtered, ai_filtered


@router.get("/parcels", response_model=List[DemoParcelDetailOut], summary="List curated demo parcels across India")
def list_demo_parcels(
    location: Optional[str] = Query(None, description="Location ID e.g. chandigarh, delhi, bengaluru"),
    state: Optional[str] = Query(None, description="State / UT filter"),
    urban_rural: Optional[str] = Query(None, description="Urban, Rural, Mountain, Coastal"),
    scenario: Optional[str] = Query(None, description="Demo scenario code e.g. CLEAN_PARCEL, MORTGAGE_LIEN"),
    ulpin: Optional[str] = Query(None, description="Filter by ULPIN string"),
    parcel_id: Optional[str] = Query(None, description="Filter by parcel ID e.g. P-1027"),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional)
):
    """
    Phase 7: GET /api/v1/demo/parcels
    Returns curated demo parcels. Sanitizes internal audit metadata and sensitive fields for unauthenticated or citizen callers.
    """
    raw_parcels = get_demo_parcels(
        location=location,
        state=state,
        urban_rural=urban_rural,
        scenario=scenario,
        ulpin=ulpin,
        parcel_id=parcel_id
    )

    is_officer_or_admin = user_ctx and (
        user_ctx.has_role("administrator") or
        user_ctx.has_role("revenue_officer") or
        user_ctx.has_role("planning_officer") or
        user_ctx.has_role("auditor")
    )

    results = []
    for p in raw_parcels:
        audit_note = "Logged to PLOT360 audit ledger." if is_officer_or_admin else None
        sentinel_avail = p.get("sentinel_available", False)
        sentinel_stat = "ACTIVE_MONITORING" if sentinel_avail else "NOT_AVAILABLE"

        bp_filtered, enc_filtered, tax_filtered, ai_filtered = _filter_demo_parcel_components(
            p, user_ctx, sentinel_avail
        )

        results.append(DemoParcelDetailOut(
            parcel_id=p["parcel_id"],
            ulpin=p["ulpin"],
            location=p["location"],
            location_id=p["location_id"],
            state=p["state"],
            district=p.get("district"),
            tehsil=p.get("tehsil"),
            urban_rural=p["rural_urban"],
            original_area=p.get("original_area_display"),
            standardized_area=p.get("area_display"),
            land_use=p.get("land_use"),
            zoning=p.get("zoning"),
            scenario=p["scenario"],
            scenario_display=p["scenario_display"],
            source_status="Source Verified",
            verification_status="Verified",
            last_updated="12 Aug 2025, 10:24 AM",
            sentinel_status=sentinel_stat,
            sentinel_available=sentinel_avail,
            centroid_lat=p["centroid_lat"],
            centroid_lng=p["centroid_lng"],
            polygon=p["coords"],
            owner=p.get("owner"),
            building_permission=bp_filtered,
            encumbrance=enc_filtered,
            property_tax=tax_filtered,
            utilities=p.get("ut"),
            restrictions=None,
            ai_alert=ai_filtered,
            is_demo_data=True,
            audit_notes=audit_note
        ))
    return results


@router.get("/parcels/{ulpin}", response_model=DemoParcelDetailOut, summary="Get curated demo parcel by ULPIN or parcel ID")
def get_demo_parcel(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional)
):
    """
    Phase 7: GET /api/v1/demo/parcels/{ulpin}
    Returns detailed demo parcel record with truthful user-facing status.
    """
    p = get_demo_parcel_by_ulpin(ulpin)
    if not p:
        raise HTTPException(
            status_code=404,
            detail=f"Curated demo parcel not found for identifier '{ulpin}'"
        )

    is_officer_or_admin = user_ctx and (
        user_ctx.has_role("administrator") or
        user_ctx.has_role("revenue_officer") or
        user_ctx.has_role("planning_officer") or
        user_ctx.has_role("auditor")
    )

    sentinel_avail = p.get("sentinel_available", False)
    sentinel_stat = "ACTIVE_MONITORING" if sentinel_avail else "NOT_AVAILABLE"
    audit_note = "Logged to PLOT360 audit ledger." if is_officer_or_admin else None

    bp_filtered, enc_filtered, tax_filtered, ai_filtered = _filter_demo_parcel_components(
        p, user_ctx, sentinel_avail
    )

    return DemoParcelDetailOut(
        parcel_id=p["parcel_id"],
        ulpin=p["ulpin"],
        location=p["location"],
        location_id=p["location_id"],
        state=p["state"],
        district=p.get("district"),
        tehsil=p.get("tehsil"),
        urban_rural=p["rural_urban"],
        original_area=p.get("original_area_display"),
        standardized_area=p.get("area_display"),
        land_use=p.get("land_use"),
        zoning=p.get("zoning"),
        scenario=p["scenario"],
        scenario_display=p["scenario_display"],
        source_status="Source Verified",
        verification_status="Verified",
        last_updated="12 Aug 2025, 10:24 AM",
        sentinel_status=sentinel_stat,
        sentinel_available=sentinel_avail,
        centroid_lat=p["centroid_lat"],
        centroid_lng=p["centroid_lng"],
        polygon=p["coords"],
        owner=p.get("owner"),
        building_permission=bp_filtered,
        encumbrance=enc_filtered,
        property_tax=tax_filtered,
        utilities=p.get("ut"),
        restrictions=None,
        ai_alert=ai_filtered,
        is_demo_data=True,
        audit_notes=audit_note
    )


@router.get("/parcels/{ulpin}/audit", summary="Get sensitive audit history for demo parcel (RBAC protected)")
def get_demo_parcel_audit(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    user_ctx: AuthenticatedUserContext = Depends(require_role("auditor"))
):
    """
    Phase 9 & 13: STRICT RBAC enforcement.
    Requires 'auditor' or 'administrator' role.
    Non-auditor roles (citizen, planning_officer, etc.) receive 403 Forbidden.
    """
    p = get_demo_parcel_by_ulpin(ulpin)
    if not p:
        raise HTTPException(
            status_code=404,
            detail=f"Curated demo parcel not found for identifier '{ulpin}'"
        )

    return {
        "ulpin": p["ulpin"],
        "parcel_id": p["parcel_id"],
        "audit_classification": "OFFICIAL_AUDIT_LOG",
        "audited_by": user_ctx.full_name,
        "auditor_role": user_ctx.roles,
        "ledger_entries": [
            {
                "event": "CADASTRAL_CREATION",
                "timestamp": "2022-01-15T10:00:00Z",
                "authority": "State Land Records Directorate",
                "status": "RECORDED"
            },
            {
                "event": "TITLE_VERIFICATION",
                "timestamp": "2023-09-14T14:30:00Z",
                "authority": "Sub-Registrar Office",
                "status": "VERIFIED"
            },
            {
                "event": "INTEGRATION_RECONCILIATION",
                "timestamp": "2025-08-12T10:24:00Z",
                "authority": "PLOT360 Multi-Agency Engine",
                "status": "RECONCILED"
            }
        ]
    }


@router.get("/search", response_model=List[DemoSearchResultOut], summary="Search curated demo catalogue by query")
def search_demo_parcels(
    q: str = Query(..., min_length=1, description="Search term across ULPIN, location, state, scenario")
):
    """
    Phase 7: GET /api/v1/demo/search?q=<query>
    Searches across demo parcels, locations, and scenario labels.
    """
    return search_demo_catalog(q)

