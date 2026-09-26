"""
PLOT360 Backend — Parcels Router
Canonical parcel retrieval, spatial filtering, GeoJSON geometry, unified summary, and timeline.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.parcel import Parcel
from app.models.governance import RoRRecord, Registration
from app.models.planning import BuildingPermission
from app.models.taxation import PropertyTax
from app.models.ai_models import ChangeEvent, AIAlert
from app.schemas.parcel import ParcelDetailOut, ParcelSummary, TimelineEventOut
from app.schemas.common import GeoJSONFeature
from app.services.parcel_service import (
    get_parcel_by_ulpin_or_id,
    query_parcels,
    build_unified_parcel_response,
    get_parcel_geojson_geometry,
    get_parcel_polygon_coords,
)

from app.dependencies import get_current_user_optional, AuthenticatedUserContext
from app.auth.field_filter import can_access_building_details, can_access_tax_details

router = APIRouter(prefix="/parcels", tags=["Parcels"])


@router.get("", response_model=List[ParcelSummary], summary="List parcels with spatial/attribute filters")
def list_parcels(
    location: Optional[str] = Query(None, description="Location ID or name e.g. 'chandigarh'"),
    state: Optional[str] = Query(None, description="State filter"),
    district: Optional[str] = Query(None, description="District filter"),
    village: Optional[str] = Query(None, description="Village filter"),
    ward: Optional[str] = Query(None, description="Ward filter"),
    rural_urban: Optional[str] = Query(None, description="Rural or Urban"),
    bbox: Optional[str] = Query(None, description="Bounding box: minx,miny,maxx,maxy"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    parcels = query_parcels(
        db,
        location=location,
        state=state,
        district=district,
        village=village,
        ward=ward,
        rural_urban=rural_urban,
        bbox=bbox,
        limit=limit,
    )
    result = []
    for p in parcels:
        coords = get_parcel_polygon_coords(p, db)
        result.append(
            ParcelSummary(
                parcel_id=p.parcel_id,
                ulpin=p.ulpin,
                survey_no=p.survey_no,
                khata_no=p.khata_no,
                location=p.location,
                location_id=p.location_id,
                state=p.state,
                district=p.district,
                rural_urban=p.rural_urban or "Urban",
                original_area=p.original_area_display,
                standardized_area=p.area_display,
                land_use=p.land_use,
                zoning=p.zoning,
                jurisdiction=p.jurisdiction,
                status=p.status or "Verified",
                cadastral_status="ILLUSTRATIVE_DEMO_GEOMETRY",
                sync_status=p.sync_status or "Synced",
                centroid_lat=p.centroid_lat,
                centroid_lng=p.centroid_lng,
                polygon=coords
            )
        )
    return result


@router.get("/{ulpin}", summary="Get full unified parcel context by ULPIN (supports compact mode)")
def get_parcel_detail(
    ulpin: str = Path(..., description="Canonical ULPIN or internal parcel_id"),
    compact: bool = Query(False, description="Compact response mode for mobile / low-bandwidth devices"),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(
            status_code=404,
            detail=f"Parcel not found for identifier '{ulpin}'"
        )
    if compact:
        coords = get_parcel_polygon_coords(parcel, db)
        return {
            "parcel_id": parcel.parcel_id,
            "ulpin": parcel.ulpin,
            "cadastral_status": "ILLUSTRATIVE_DEMO_GEOMETRY",
            "survey_no": parcel.survey_no,
            "location": parcel.location,
            "state": parcel.state,
            "district": parcel.district,
            "rural_urban": parcel.rural_urban or "Urban",
            "original_area": parcel.original_area_display,
            "standardized_area": parcel.area_display,
            "land_use": parcel.land_use,
            "zoning": parcel.zoning,
            "jurisdiction": parcel.jurisdiction,
            "status": parcel.status or "Verified",
            "centroid_lat": parcel.centroid_lat,
            "centroid_lng": parcel.centroid_lng,
            "polygon": coords
        }
    return build_unified_parcel_response(parcel, db, user_ctx)


@router.get("/{ulpin}/geometry", response_model=GeoJSONFeature, summary="Get parcel GeoJSON geometry")
def get_parcel_geometry(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    simplify: Optional[float] = Query(None, description="Simplification tolerance in degrees for low-bandwidth"),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")

    geom = get_parcel_geojson_geometry(parcel, db)
    if simplify and geom and geom.get("type") == "Polygon":
        coords = geom.get("coordinates", [[]])[0]
        if len(coords) > 5:
            step = max(1, int(len(coords) / 8))
            decimated = coords[::step]
            if decimated[0] != decimated[-1]:
                decimated.append(decimated[0])
            geom = {"type": "Polygon", "coordinates": [decimated]}

    return GeoJSONFeature(
        type="Feature",
        geometry=geom,
        properties={
            "parcel_id": parcel.parcel_id,
            "ulpin": parcel.ulpin,
            "survey_no": parcel.survey_no,
            "status": parcel.status,
            "area": parcel.area_display or parcel.original_area_display
        }
    )



@router.get("/{ulpin}/timeline", response_model=List[TimelineEventOut], summary="Get chronological multi-source timeline")
def get_parcel_timeline(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Section 134: Chronological history across Cadastre, RoR, Registration, Building, Tax, AI."""
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")

    events: List[TimelineEventOut] = []

    # 1. Parcel creation
    events.append(
        TimelineEventOut(
            event_id=f"EVT-PARCEL-{parcel.id}",
            timestamp="15 Jan 2018",
            event_type="PARCEL_CREATED",
            title="Cadastral Parcel Demarcated",
            description=f"Cadastral survey recorded survey no. {parcel.survey_no or parcel.parcel_id}.",
            source="Survey & Land Records Department",
            status="RECORDED"
        )
    )

    # 2. RoR records
    rors = db.query(RoRRecord).filter(RoRRecord.parcel_id == parcel.id).all()
    for r in rors:
        events.append(
            TimelineEventOut(
                event_id=f"EVT-ROR-{r.id}",
                timestamp=r.last_updated or "12 Mar 2021",
                event_type="ROR_UPDATED",
                title=f"Record of Rights Entry ({r.record_number})",
                description=f"Ownership recorded for {r.owner_name} with rights: {r.rights_type or 'Owner'}.",
                source=r.source_department or "Revenue Department",
                status=r.verification_status
            )
        )

    # 3. Registration deeds
    regs = db.query(Registration).filter(Registration.parcel_id == parcel.id).all()
    for rg in regs:
        events.append(
            TimelineEventOut(
                event_id=f"EVT-REG-{rg.id}",
                timestamp=rg.registration_date or "14 Sep 2022",
                event_type="REGISTRATION",
                title=f"{rg.transaction_type} Registered ({rg.registration_id})",
                description=f"Transaction executed for parcel with status: {rg.status}.",
                source=rg.source or "Sub-Registrar Office",
                status=rg.status
            )
        )

    # 4. Building permission
    bps = db.query(BuildingPermission).filter(BuildingPermission.parcel_id == parcel.id).all()
    for b in bps:
        if can_access_building_details(user_ctx):
            bp_desc = f"Sanction for {b.floors or 'construction'} issued."
        else:
            bp_desc = f"Building sanction recorded ({b.status})."
        events.append(
            TimelineEventOut(
                event_id=f"EVT-BP-{b.id}",
                timestamp=b.approval_date or "14 Nov 2023",
                event_type="BUILDING_PERMISSION",
                title=f"Building Permission {b.status} ({b.permission_id or 'Sanction'})",
                description=bp_desc,
                source=b.source or "Town Planning Authority",
                status=b.status
            )
        )

    # 5. Property tax
    taxes = db.query(PropertyTax).filter(PropertyTax.parcel_id == parcel.id).all()
    for t in taxes:
        if can_access_tax_details(user_ctx):
            tax_desc = f"Payment recorded: {t.amount_paid or 'Receipt issued'} with status {t.status}."
        else:
            tax_desc = f"Property tax assessment status: {t.status}."
        events.append(
            TimelineEventOut(
                event_id=f"EVT-TAX-{t.id}",
                timestamp=t.last_payment or "28 Jun 2024",
                event_type="TAX_ASSESSMENT",
                title=f"Property Tax Assessment ({t.assessment_id})",
                description=tax_desc,
                source=t.source or "Municipal Corporation",
                status=t.status
            )
        )

    # 6. AI Detection
    alerts = db.query(AIAlert).filter(AIAlert.parcel_id == parcel.id).all()
    for a in alerts:
        events.append(
            TimelineEventOut(
                event_id=f"EVT-AI-{a.id}",
                timestamp=a.flagged_date or "Mar 2024",
                event_type="AI_ALERT",
                title=a.title,
                description=a.description or "Potential spectral change identified between temporal observations.",
                source=f"PLOT360 AI Engine ({a.model_version or 'Siamese U-Net'})",
                status=a.review_status
            )
        )

    return events


@router.get("/{ulpin}/summary", response_model=ParcelSummary, summary="Get compact parcel summary")
def get_parcel_summary(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")
    coords = get_parcel_polygon_coords(parcel, db)
    return ParcelSummary(
        parcel_id=parcel.parcel_id,
        ulpin=parcel.ulpin,
        survey_no=parcel.survey_no,
        khata_no=parcel.khata_no,
        location=parcel.location,
        location_id=parcel.location_id,
        state=parcel.state,
        district=parcel.district,
        rural_urban=parcel.rural_urban or "Urban",
        original_area=parcel.original_area_display,
        standardized_area=parcel.area_display,
        land_use=parcel.land_use,
        zoning=parcel.zoning,
        jurisdiction=parcel.jurisdiction,
        status=parcel.status or "Verified",
        sync_status=parcel.sync_status or "Synced",
        centroid_lat=parcel.centroid_lat,
        centroid_lng=parcel.centroid_lng,
        polygon=coords
    )
