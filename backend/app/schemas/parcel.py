"""
PLOT360 Backend — Parcel Pydantic Schemas
Unified parcel response (Section 20), summary, geometry, and timeline.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OwnerSummary(BaseModel):
    name: str
    relation: Optional[str] = None
    share: Optional[str] = "100%"
    verified: bool = True


class BuildingPermissionSummary(BaseModel):
    id: Optional[str] = None
    status: Optional[str] = "Approved"
    floors: Optional[str] = None
    approval_date: Optional[str] = None


class EncumbranceSummary(BaseModel):
    status: str = "Clear"
    institution: Optional[str] = None
    loan_amount: Optional[str] = None
    noc_required: bool = False
    reference: Optional[str] = None


class PropertyTaxSummary(BaseModel):
    assessment_id: Optional[str] = None
    status: str = "Paid"
    last_payment: Optional[str] = None
    amount_paid: Optional[str] = None


class UtilitiesSummary(BaseModel):
    electricity: Optional[str] = "Connected"
    water: Optional[str] = "Connected"
    sewer: Optional[str] = "Connected"
    gas: Optional[str] = "Available Nearby"


class AIAlertSummary(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    flagged_date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    confidence: Optional[str] = None
    recommended_step: Optional[str] = None
    review_status: Optional[str] = "UNDER_REVIEW"
    notes: Optional[str] = None
    date1_label: Optional[str] = "2020"
    date2_label: Optional[str] = "2025"


class ParcelSummary(BaseModel):
    """Compact parcel representation for lists, search, and map layers."""
    parcel_id: str
    ulpin: str
    survey_no: Optional[str] = None
    khata_no: Optional[str] = None
    location: Optional[str] = None
    location_id: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    rural_urban: Optional[str] = "Urban"
    original_area: Optional[str] = None
    standardized_area: Optional[str] = None
    land_use: Optional[str] = None
    zoning: Optional[str] = None
    jurisdiction: Optional[str] = None
    status: Optional[str] = "Verified"
    cadastral_status: Optional[str] = "ILLUSTRATIVE_DEMO_GEOMETRY"
    sync_status: Optional[str] = "Synced"
    centroid_lat: Optional[float] = None
    centroid_lng: Optional[float] = None
    polygon: Optional[List[Dict[str, float]]] = None

    class Config:
        from_attributes = True


class ParcelDetailOut(BaseModel):
    """Unified Parcel Response Context (Section 20)."""
    parcel_id: str
    ulpin: str
    survey_no: Optional[str] = None
    khata_no: Optional[str] = None
    khasra_no: Optional[str] = None
    plot_no: Optional[str] = None
    location: Optional[str] = None
    location_id: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    tehsil: Optional[str] = None
    village: Optional[str] = None
    ward: Optional[str] = None
    rural_urban: Optional[str] = "Urban"

    original_area: Optional[str] = None
    original_unit: Optional[str] = None
    standardized_area: Optional[str] = None
    standardized_unit: Optional[str] = "m²"
    conversion_method: Optional[str] = None

    land_use: Optional[str] = None
    zoning: Optional[str] = None
    jurisdiction: Optional[str] = None
    last_updated: Optional[str] = None
    status: Optional[str] = "Verified"
    sync_status: Optional[str] = "Synced"
    data_freshness: Optional[str] = "Current"
    source: Optional[str] = "DEMO_SAMPLE_DATA"

    owner: Optional[OwnerSummary] = None
    building_permission: Optional[BuildingPermissionSummary] = None
    encumbrance: Optional[EncumbranceSummary] = None
    property_tax: Optional[PropertyTaxSummary] = None
    utilities: Optional[UtilitiesSummary] = None
    ai_alert: Optional[AIAlertSummary] = None
    polygon: Optional[List[Dict[str, float]]] = None

    class Config:
        from_attributes = True


class TimelineEventOut(BaseModel):
    event_id: str
    timestamp: str
    event_type: str
    title: str
    description: str
    source: str
    status: Optional[str] = None
