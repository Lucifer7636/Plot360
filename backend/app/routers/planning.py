"""
PLOT360 Backend — Planning & Development Router
Sections 27–32: Master plan, zoning, building sanctions, restrictions, and planning cross-check.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.planning import PlanningRecord, BuildingPermission, Restriction
from app.schemas.planning import (
    PlanningOut, BuildingPermissionOut, RestrictionOut, PlanningCrossCheckOut
)
from app.services.parcel_service import get_parcel_by_ulpin_or_id
from app.dependencies import get_current_user_optional, AuthenticatedUserContext
from app.auth.field_filter import filter_building_permission_record

router = APIRouter(prefix="/parcels", tags=["Planning"])


@router.get("/{ulpin}/planning", response_model=List[PlanningOut], summary="Master plan, land use, and zoning")
def get_planning(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")
    return db.query(PlanningRecord).filter(PlanningRecord.parcel_id == parcel.id).all()


@router.get("/{ulpin}/land-use", summary="Direct land-use classification and permissible use")
def get_land_use(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    """Section 29 & 129: Canonical and localized land-use classification."""
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")
    rec = db.query(PlanningRecord).filter(PlanningRecord.parcel_id == parcel.id).first()
    return {
        "ulpin": parcel.ulpin,
        "parcel_id": parcel.parcel_id,
        "canonical_land_use": parcel.land_use or (rec.land_use if rec else "Commercial / Mixed Use"),
        "local_land_use": rec.land_use if rec else parcel.land_use,
        "permitted_activities": ["Retail", "Office", "Institutional", "Hospitality"] if "Commercial" in (parcel.land_use or "") else ["Residential", "Home Occupation"],
        "master_plan_code": rec.zoning_code if (rec and rec.zoning_code) else (rec.master_plan_year if rec else "MP-2031-C1"),
        "authority": rec.department if (rec and rec.department) else "Town & Country Planning Authority"
    }


@router.get("/{ulpin}/zoning", summary="Statutory zoning regulations and development controls")
def get_zoning(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    """Section 30 & 129: Statutory zoning controls and FAR limits."""
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")
    rec = db.query(PlanningRecord).filter(PlanningRecord.parcel_id == parcel.id).first()
    return {
        "ulpin": parcel.ulpin,
        "parcel_id": parcel.parcel_id,
        "zone_code": rec.zoning_code if (rec and rec.zoning_code) else (parcel.zoning or "C-1 Commercial Central"),
        "zone_name": rec.zoning if (rec and rec.zoning) else (parcel.zoning or "C-1 Commercial"),
        "max_far": 2.0 if "Commercial" in (parcel.land_use or "") else 1.5,
        "max_height_meters": 15.0,
        "setback_front_m": 4.5,
        "setback_rear_m": 3.0,
        "authority": rec.department if (rec and rec.department) else "Urban Development Authority"
    }



@router.get("/{ulpin}/building", summary="Sanctioned building permissions")
def get_building(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")
    bps = db.query(BuildingPermission).filter(BuildingPermission.parcel_id == parcel.id).all()
    return [filter_building_permission_record(b, user_ctx) for b in bps]


@router.get("/{ulpin}/restrictions", response_model=List[RestrictionOut], summary="Spatial restrictions and protected overlays")
def get_restrictions(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")
    return db.query(Restriction).filter(Restriction.parcel_id == parcel.id).all()


@router.get("/{ulpin}/planning-crosscheck", response_model=PlanningCrossCheckOut, summary="Planning cross-check engine")
def get_planning_crosscheck(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    """
    Section 32: Structured comparison of parcel land use vs zoning vs building permission vs restrictions.
    Never declares 'illegal'; returns advisory status and explanation.
    """
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")

    plan = db.query(PlanningRecord).filter(PlanningRecord.parcel_id == parcel.id).first()
    bp = db.query(BuildingPermission).filter(BuildingPermission.parcel_id == parcel.id).first()
    rests = db.query(Restriction).filter(Restriction.parcel_id == parcel.id, Restriction.is_active == True).all()

    active_rests = [r.title or r.restriction_type for r in rests]
    land_use = plan.land_use if plan else parcel.land_use
    zoning = plan.zoning if plan else parcel.zoning
    bp_status = bp.status if bp else "NOT_APPLIED"
    bp_id = bp.permission_id if bp else None

    # Advisory evaluation logic
    crosscheck_status = "COMPLIANT"
    reasons = []

    if active_rests:
        crosscheck_status = "UNDER_REVIEW"
        reasons.append(f"Parcel intersects active restriction overlays: {', '.join(active_rests)}.")

    if bp_status == "REJECTED":
        crosscheck_status = "POTENTIAL_MISMATCH"
        reasons.append("Building permission was previously rejected by the municipal planning authority.")
    elif bp_status in ["UNDER_REVIEW", "SUBMITTED"]:
        crosscheck_status = "UNDER_REVIEW"
        reasons.append(f"Building permission is pending review ({bp_status}).")
    elif not bp and land_use in ["Commercial", "Industrial"]:
        crosscheck_status = "UNDER_REVIEW"
        reasons.append(f"Commercial/Industrial zoning without registered sanction on record.")

    explanation = (
        " ".join(reasons)
        if reasons
        else f"Sanctioned building permission aligns with designated {land_use or 'approved'} land use and {zoning or 'conforming'} zoning regulations."
    )

    return PlanningCrossCheckOut(
        parcel_id=parcel.parcel_id,
        ulpin=parcel.ulpin,
        land_use=land_use,
        zoning=zoning,
        building_permission_status=bp_status,
        building_permission_id=bp_id,
        active_restrictions=active_rests,
        crosscheck_status=crosscheck_status,
        status=crosscheck_status,
        explanation=explanation
    )
