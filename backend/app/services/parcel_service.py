"""
PLOT360 Backend — Parcel Service
Business logic for parcel spatial queries, GeoJSON serialization,
bbox filtering, point-in-polygon lookup, and unified detail compilation.
"""
import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.parcel import Parcel
from app.models.ownership import Ownership
from app.models.governance import RoRRecord, Registration, Encumbrance, Mortgage, Dispute
from app.models.planning import PlanningRecord, BuildingPermission, Restriction
from app.models.taxation import PropertyTax
from app.models.utilities import UtilityRecord
from app.models.ai_models import AIAlert, ChangeEvent
from app.utils.geo import (
    calculate_accurate_area_sqm,
    point_in_polygon,
    coords_to_geojson_polygon
)
from app.database import is_postgis_active


def get_parcel_by_ulpin_or_id(identifier: str, db: Session) -> Optional[Parcel]:
    """Canonical ULPIN / parcel_id lookup."""
    clean_id = identifier.strip()
    parcel = db.query(Parcel).filter(Parcel.ulpin == clean_id).first()
    if not parcel:
        parcel = db.query(Parcel).filter(Parcel.parcel_id == clean_id).first()
    return parcel


def get_parcel_geojson_geometry(parcel: Parcel, db: Session) -> Optional[Dict[str, Any]]:
    """Extract GeoJSON polygon geometry from parcel."""
    if parcel.geometry is None:
        return None

    if is_postgis_active():
        try:
            row = db.execute(
                text("SELECT ST_AsGeoJSON(geometry) FROM parcels WHERE id = :id"),
                {"id": parcel.id}
            ).fetchone()
            if row and row[0]:
                return json.loads(row[0])
        except Exception:
            pass

    # SQLite fallback: stored as GeoJSON string or WKT
    if isinstance(parcel.geometry, str):
        try:
            return json.loads(parcel.geometry)
        except Exception:
            pass

    return None


def get_parcel_polygon_coords(parcel: Parcel, db: Session) -> List[Dict[str, float]]:
    """Extract [{lat: ..., lng: ...}] coordinate list for Google Maps basemap rendering."""
    geom = get_parcel_geojson_geometry(parcel, db)
    if geom and geom.get("type") == "Polygon" and geom.get("coordinates"):
        ring = geom["coordinates"][0]
        return [{"lat": round(pt[1], 6), "lng": round(pt[0], 6)} for pt in ring]
    return []


def query_parcels(
    db: Session,
    location: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    ward: Optional[str] = None,
    rural_urban: Optional[str] = None,
    bbox: Optional[str] = None,
    limit: int = 50,
) -> List[Parcel]:
    """Multi-attribute and spatial bbox parcel query."""
    q = db.query(Parcel)

    if location:
        loc = location.strip().lower()
        q = q.filter((Parcel.location_id.ilike(f"%{loc}%")) | (Parcel.location.ilike(f"%{loc}%")))
    if state:
        q = q.filter(Parcel.state.ilike(f"%{state.strip()}%"))
    if district:
        q = q.filter(Parcel.district.ilike(f"%{district.strip()}%"))
    if village:
        q = q.filter(Parcel.village.ilike(f"%{village.strip()}%"))
    if ward:
        q = q.filter(Parcel.ward.ilike(f"%{ward.strip()}%"))
    if rural_urban:
        q = q.filter(Parcel.rural_urban.ilike(f"%{rural_urban.strip()}%"))

    # Bounding box filter minx,miny,maxx,maxy (west, south, east, north)
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                minx, miny, maxx, maxy = parts
                if is_postgis_active():
                    q = q.filter(
                        text("geometry && ST_MakeEnvelope(:minx, :miny, :maxx, :maxy, 4326)")
                    ).params(minx=minx, miny=miny, maxx=maxx, maxy=maxy)
                else:
                    # SQLite fallback: filter via centroid
                    q = q.filter(
                        Parcel.centroid_lng >= minx,
                        Parcel.centroid_lng <= maxx,
                        Parcel.centroid_lat >= miny,
                        Parcel.centroid_lat <= maxy,
                    )
        except Exception:
            pass

    return q.limit(limit).all()


def build_unified_parcel_response(parcel: Parcel, db: Session, user_ctx: Optional[Any] = None) -> Dict[str, Any]:
    """Compiles the unified parcel record context with strict server-side RBAC field-level filtering."""
    user_roles = user_ctx.roles if user_ctx else []
    is_admin = "administrator" in user_roles
    is_auditor = "auditor" in user_roles
    is_revenue = is_admin or is_auditor or "revenue_officer" in user_roles
    is_registration = is_admin or is_auditor or "registration_officer" in user_roles
    is_planning = is_admin or is_auditor or "planning_officer" in user_roles
    is_municipal = is_admin or is_auditor or "municipal_officer" in user_roles
    is_tax = is_admin or is_auditor or "tax_officer" in user_roles

    # Active Owner
    owner_rec = db.query(Ownership).filter(
        Ownership.parcel_id == parcel.id, Ownership.is_current == True
    ).first()
    owner_dict = None
    if owner_rec:
        owner_dict = {
            "name": owner_rec.owner_name,
            "relation": owner_rec.owner_relation,
            "share": owner_rec.share_percent or "100%",
            "verified": owner_rec.verified
        }

    # Building Permission (Planning / Municipal / Admin / Auditor)
    bp = db.query(BuildingPermission).filter(BuildingPermission.parcel_id == parcel.id).first()
    bp_dict = None
    if bp:
        if is_planning or is_municipal:
            bp_dict = {
                "id": bp.permission_id,
                "status": bp.status,
                "floors": bp.floors,
                "approval_date": bp.approval_date
            }
        else:
            # Public / Citizen / Non-planning view: only status is public
            bp_dict = {
                "id": bp.permission_id,
                "status": bp.status
            }

    # Encumbrance (Registration / Revenue / Admin / Auditor)
    enc = db.query(Encumbrance).filter(Encumbrance.parcel_id == parcel.id).first()
    enc_dict = None
    if enc:
        if is_registration or is_revenue:
            enc_dict = {
                "status": enc.status,
                "institution": enc.institution,
                "loan_amount": enc.loan_amount,
                "noc_required": enc.noc_required,
                "reference": enc.reference
            }
        else:
            # Citizen / unauthorized view: only public encumbrance status
            enc_dict = {
                "status": enc.status
            }

    # Property Tax (Tax Officer / Municipal / Admin / Auditor)
    tax = db.query(PropertyTax).filter(PropertyTax.parcel_id == parcel.id).first()
    tax_dict = None
    if tax:
        if is_tax or is_municipal:
            tax_dict = {
                "assessment_id": tax.assessment_id,
                "status": tax.status,
                "last_payment": tax.last_payment,
                "amount_paid": tax.amount_paid
            }
        else:
            # Citizen / unauthorized view: only public status
            tax_dict = {
                "status": tax.status
            }

    # Utilities
    ut = db.query(UtilityRecord).filter(UtilityRecord.parcel_id == parcel.id).first()
    ut_dict = None
    if ut:
        ut_dict = {
            "electricity": ut.electricity,
            "water": ut.water,
            "sewer": ut.sewer,
            "gas": ut.gas
        }

    # AI Alert
    alert = db.query(AIAlert).filter(AIAlert.parcel_id == parcel.id).first()
    alert_dict = None
    if alert:
        if is_revenue or is_planning or is_admin or is_auditor:
            alert_dict = {
                "id": alert.alert_id or f"AI-{alert.id}",
                "title": alert.title,
                "flagged_date": alert.flagged_date,
                "description": alert.description,
                "category": alert.category,
                "confidence": alert.confidence,
                "recommended_step": alert.recommended_step,
                "review_status": alert.review_status,
                "notes": alert.notes,
                "date1_label": alert.date1_label,
                "date2_label": alert.date2_label
            }
        else:
            # Citizen view: omit internal officer inspection notes and internal confidence details
            alert_dict = {
                "id": alert.alert_id or f"AI-{alert.id}",
                "title": alert.title,
                "flagged_date": alert.flagged_date,
                "description": alert.description,
                "category": alert.category,
                "review_status": alert.review_status,
                "date1_label": alert.date1_label,
                "date2_label": alert.date2_label
            }

    # Restricted Administrator / Auditor Metadata (Parts 27, 34, 35)
    admin_metadata = None
    if is_admin or is_auditor:
        admin_metadata = {
            "audit_hash": f"SHA256-AUDIT-{parcel.id}-0982",
            "system_node": "PLOT360-CORE-PRIMARY",
            "security_clearance": "RESTRICTED_OFFICER_AUDIT"
        }

    coords = get_parcel_polygon_coords(parcel, db)

    resp = {
        "parcel_id": parcel.parcel_id,
        "ulpin": parcel.ulpin,
        "cadastral_status": "ILLUSTRATIVE_DEMO_GEOMETRY",
        "survey_no": parcel.survey_no,
        "khata_no": parcel.khata_no,
        "khasra_no": parcel.khasra_no,
        "plot_no": parcel.plot_no,
        "location": parcel.location,
        "location_id": parcel.location_id,
        "state": parcel.state,
        "district": parcel.district,
        "tehsil": parcel.tehsil,
        "village": parcel.village,
        "ward": parcel.ward,
        "rural_urban": parcel.rural_urban,
        "original_area": parcel.original_area_display or (f"{parcel.original_area} {parcel.original_unit}" if parcel.original_area else None),
        "original_unit": parcel.original_unit,
        "standardized_area": parcel.area_display or (f"{parcel.standardized_area} {parcel.standardized_unit}" if parcel.standardized_area else None),
        "standardized_unit": parcel.standardized_unit,
        "conversion_method": parcel.conversion_method,
        "land_use": parcel.land_use,
        "zoning": parcel.zoning,
        "jurisdiction": parcel.jurisdiction,
        "last_updated": parcel.last_updated,
        "status": parcel.status,
        "sync_status": parcel.sync_status,
        "data_freshness": parcel.data_freshness,
        "source": parcel.source,
        "owner": owner_dict,
        "building_permission": bp_dict,
        "encumbrance": enc_dict,
        "property_tax": tax_dict,
        "utilities": ut_dict,
        "ai_alert": alert_dict,
        "bp": bp_dict,
        "enc": enc_dict,
        "tax": tax_dict,
        "ut": ut_dict,
        "polygon": coords
    }

    if admin_metadata:
        resp["admin_metadata"] = admin_metadata

    return resp
