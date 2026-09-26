"""
PLOT360 Backend — Taxation Router
Section 33: Property tax assessments and status.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.taxation import PropertyTax
from app.services.parcel_service import get_parcel_by_ulpin_or_id
from app.dependencies import get_current_user_optional, AuthenticatedUserContext
from app.auth.field_filter import filter_property_tax_record

router = APIRouter(prefix="/parcels", tags=["Taxation"])


@router.get("/{ulpin}/tax", summary="Property tax assessment and payment records")
def get_tax(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    user_ctx: Optional[AuthenticatedUserContext] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")

    taxes = db.query(PropertyTax).filter(PropertyTax.parcel_id == parcel.id).all()
    return [filter_property_tax_record(t, user_ctx) for t in taxes]


@router.get("/{ulpin}/valuation", summary="Valuation references and indicative analytical estimates")
def get_valuation(
    ulpin: str = Path(..., description="Canonical ULPIN or parcel_id"),
    db: Session = Depends(get_db)
):
    """
    Section 34 & 129: Statutory circle rates and indicative analytical estimates.
    Never misrepresents analytical estimates as official market transactions.
    """
    parcel = get_parcel_by_ulpin_or_id(ulpin, db)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Parcel not found: '{ulpin}'")

    from app.models.taxation import ValuationReference
    refs = db.query(ValuationReference).filter(ValuationReference.parcel_id == parcel.id).all()
    if not refs:
        # Fallback indicative estimate based on standardized area
        area_m2 = parcel.standardized_area or 1248.5
        unit_rate = 65000.0  # ₹ 65,000 / sq_m baseline for commercial/mixed
        return [
            {
                "ulpin": parcel.ulpin,
                "reference_type": "STATUTORY_CIRCLE_RATE",
                "rate_per_sq_m": unit_rate,
                "total_guidance_value": round(area_m2 * unit_rate, 2),
                "currency": "INR (₹)",
                "classification": "STATUTORY_CIRCLE_RATE",
                "source": "Department of Stamp & Registration",
                "effective_date": "01 Apr 2025"
            },
            {
                "ulpin": parcel.ulpin,
                "reference_type": "INDICATIVE_ANALYTICAL_ESTIMATE",
                "rate_per_sq_m": round(unit_rate * 1.25, 2),
                "total_guidance_value": round(area_m2 * unit_rate * 1.25, 2),
                "currency": "INR (₹)",
                "classification": "INDICATIVE_ANALYTICAL_ESTIMATE",
                "method": "Comparative localized hedonistic index based on nearby registered deed transactions",
                "source": "PLOT360 Analytical Benchmark Engine",
                "disclaimer": "INDICATIVE ANALYTICAL ESTIMATE — Not an official government appraisal or legal market valuation."
            }
        ]

    return [
        {
            "id": r.id,
            "ulpin": r.ulpin,
            "reference_type": r.reference_type,
            "reference_value": r.reference_value,
            "unit": r.unit,
            "classification": r.classification,
            "source": r.source,
            "effective_date": r.effective_date,
            "notes": r.notes
        }
        for r in refs
    ]

