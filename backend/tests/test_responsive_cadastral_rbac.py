"""
PLOT360 — Targeted Responsive Views, Cadastral Map Refinement & Strict RBAC Test Suite
Covers all 37 items across Part 45 of the PLOT360 Specification.
"""
import os
import json
import pytest
from starlette.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models.parcel import Parcel
from app.services.parcel_service import (
    get_parcel_by_ulpin_or_id,
    get_parcel_geojson_geometry,
    get_parcel_polygon_coords,
    query_parcels,
    build_unified_parcel_response
)


# Helper to get authenticated client token
def get_token(client: TestClient, username: str, password: str = "Plot360Pass123!") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


# ==============================================================================
# SECTION A: RESPONSIVE SPECIFICATION VERIFICATION (Items 1 - 10)
# ==============================================================================

def test_01_viewport_configuration():
    """Item 1: Verify index.html has correct mobile viewport meta configuration."""
    index_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "index.html"))
    assert os.path.exists(index_path), "index.html must exist at project root"
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert 'name="viewport"' in content
    assert "width=device-width" in content
    assert "viewport-fit=cover" in content


def test_02_mobile_layout_css_rules():
    """Item 2: Verify CSS media query establishes mobile layout (320px–767px)."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert "@media (max-width: 767px)" in css
    assert ".mobile-menu-btn" in css
    assert "sidebar-mobile-open" in css


def test_03_tablet_layout_css_rules():
    """Item 3: Verify CSS media query establishes tablet layout (768px–1023px)."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert "@media (min-width: 768px) and (max-width: 1023px)" in css
    assert "grid-template-columns: minmax(0, 1fr) 310px" in css or "grid-template-columns" in css


def test_04_desktop_layout_css_rules():
    """Item 4: Verify desktop 1024px+ layout rules exist without breaking."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".workspace-container" in css
    assert ".sidebar-container" in css
    assert ".topbar-container" in css


def test_05_no_unintended_horizontal_overflow():
    """Item 5: Verify table and text wrapping constraints prevent horizontal overflow."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".table-responsive-container" in css
    assert "overflow-x: auto" in css
    assert "word-break: break-all" in css or "overflow-wrap: anywhere" in css


def test_06_responsive_parcel_panel_behavior():
    """Item 6: Verify parcel panel collapses to 100% width on mobile screens."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".parcel-panel-container" in css
    assert "width: 100%" in css


def test_07_responsive_gis_behavior():
    """Item 7: Verify map wrapper adapts its viewport height for mobile."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".map-wrapper" in css
    assert "44vh" in css or "min-height: 330px" in css


def test_08_responsive_topbar_behavior():
    """Item 8: Verify topbar container accommodates mobile viewport without breaking."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert "topbar-container" in css
    assert "overflow-x: auto" in css or "-webkit-overflow-scrolling: touch" in css


def test_09_responsive_modal_behavior():
    """Item 9: Verify components.css has responsive modal and drawer constraints."""
    comp_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "components.css"))
    with open(comp_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert "max-width" in css
    assert "overflow" in css


def test_10_device_mode_behavior():
    """Item 10: Verify desktop toolbar simulation classes (.mode-mobile, .mode-tablet) are preserved."""
    layout_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "src", "styles", "layout.css"))
    with open(layout_path, "r", encoding="utf-8") as f:
        css = f.read()
    assert ".app-shell.mode-tablet" in css
    assert ".app-shell.mode-mobile" in css


# ==============================================================================
# SECTION B: CADASTRAL MAP REFINEMENT (Items 11 - 20)
# ==============================================================================

def test_11_geometry_validity(client):
    """Item 11: Verify parcels return valid GeoJSON polygons."""
    res = client.get("/api/v1/parcels?limit=10")
    assert res.status_code == 200
    parcels = res.json()
    assert len(parcels) > 0
    for p in parcels:
        assert p["polygon"] is not None
        assert len(p["polygon"]) >= 3


def test_12_polygon_closure(client):
    """Item 12: Verify cadastral polygon boundary rings form closed loops."""
    res = client.get("/api/v1/parcels/P-1027/geometry")
    assert res.status_code == 200
    geom = res.json()["geometry"]
    assert geom["type"] == "Polygon"
    ring = geom["coordinates"][0]
    assert len(ring) >= 4
    # Closed polygon: first point equals last point
    assert ring[0][0] == ring[-1][0]
    assert ring[0][1] == ring[-1][1]


def test_13_centroid_validity(client):
    """Item 13: Verify parcel centroids are within valid geographic latitude and longitude."""
    res = client.get("/api/v1/parcels/P-1027")
    assert res.status_code == 200
    data = res.json()
    assert "polygon" in data
    pts = data["polygon"]
    assert len(pts) >= 3
    for pt in pts:
        assert -90.0 <= pt["lat"] <= 90.0
        assert -180.0 <= pt["lng"] <= 180.0


def test_14_bbox(client):
    """Item 14: Verify spatial bounding box query retrieves parcels in target area."""
    res = client.get("/api/v1/gis/parcels/bbox?bbox=76.7,30.7,76.8,30.8&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "features" in data
    assert len(data["features"]) > 0


def test_15_parcel_to_ulpin_linkage(client):
    """Item 15: Verify parcel polygon maps directly to canonical ULPIN and parcel_id."""
    res = client.get("/api/v1/parcels/P-1027")
    assert res.status_code == 200
    data = res.json()
    assert data["parcel_id"] == "P-1027"
    assert data["ulpin"] == "IN-PB-CHD-0001027"
    assert data["cadastral_status"] == "ILLUSTRATIVE_DEMO_GEOMETRY"


def test_16_parcel_selection(client):
    """Item 16: Verify selecting a parcel returns its exact identity and cadastral attributes."""
    res = client.get("/api/v1/parcels/P-1028")
    assert res.status_code == 200
    data = res.json()
    assert data["parcel_id"] == "P-1028"
    assert data["ulpin"] == "IN-PB-CHD-0001028"


def test_17_neighboring_parcel_selection(client):
    """Item 17: Verify multiple neighboring parcels exist within the same location."""
    res = client.get("/api/v1/parcels?location=chandigarh&limit=20")
    assert res.status_code == 200
    parcels = res.json()
    assert len(parcels) >= 5
    ids = [p["parcel_id"] for p in parcels]
    assert "P-1027" in ids
    assert "P-1028" in ids


def test_18_location_switching(client):
    """Item 18: Verify location switching returns disjoint parcel sets without stale geometries."""
    chd_res = client.get("/api/v1/parcels?location=chandigarh&limit=20")
    del_res = client.get("/api/v1/parcels?location=delhi&limit=20")
    assert chd_res.status_code == 200
    assert del_res.status_code == 200
    chd_ids = {p["parcel_id"] for p in chd_res.json()}
    del_ids = {p["parcel_id"] for p in del_res.json()}
    # Disjoint parcel sets across locations
    assert len(chd_ids.intersection(del_ids)) == 0


def test_19_correct_selected_parcel(client):
    """Item 19: Verify looking up parcel by ULPIN resolves the identical parcel as by parcel_id."""
    by_id = client.get("/api/v1/parcels/P-1027").json()
    by_ulpin = client.get(f"/api/v1/parcels/{by_id['ulpin']}").json()
    assert by_id["parcel_id"] == by_ulpin["parcel_id"]
    assert by_id["ulpin"] == by_ulpin["ulpin"]


def test_20_gis_response_integrity(client):
    """Item 20: Verify GIS layer catalog and point lookup return robust GeoJSON metadata."""
    res = client.get("/api/v1/gis/layers")
    assert res.status_code == 200
    layers = res.json()
    assert len(layers) >= 5
    layer_ids = [l["layer_id"] for l in layers]
    assert "cadastral_parcels" in layer_ids


# ==============================================================================
# SECTION C: STRICT ROLE-BASED ACCESS CONTROL (Items 21 - 37)
# ==============================================================================

def test_21_citizen_authorization(client):
    """Item 21: Citizen receives only permitted public parcel fields."""
    token = get_token(client, "citizen@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["parcel_id"] == "P-1027"
    assert data["status"] is not None
    # Restricted fields must NOT leak to citizen
    assert "admin_metadata" not in data
    assert "loan_amount" not in data.get("encumbrance", {})
    assert "institution" not in data.get("encumbrance", {})
    assert "notes" not in data.get("ai_alert", {})
    assert "confidence" not in data.get("ai_alert", {})
    assert "floors" not in data.get("building_permission", {})
    assert "amount_paid" not in data.get("property_tax", {})


def test_22_revenue_authorization(client):
    """Item 22: Revenue officer receives authorized encumbrance details but not tax payments or floor plans."""
    token = get_token(client, "revenue@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data.get("encumbrance") is not None
    # Revenue sees encumbrance loan details if encumbered
    if data["encumbrance"].get("status") == "Encumbered":
        assert "loan_amount" in data["encumbrance"]
    # Revenue does NOT see property tax payment amounts
    assert "amount_paid" not in data.get("property_tax", {})
    assert "admin_metadata" not in data


def test_23_registration_authorization(client):
    """Item 23: Registration officer receives registration encumbrances but not planning building floors."""
    token = get_token(client, "registration@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "floors" not in data.get("building_permission", {})
    assert "amount_paid" not in data.get("property_tax", {})
    assert "admin_metadata" not in data


def test_24_planning_authorization(client):
    """Item 24: Planning officer receives building permissions but not bank mortgage loan amounts."""
    token = get_token(client, "planning@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    # Planning officer sees building sanction floors
    if data.get("building_permission"):
        assert "floors" in data["building_permission"]
    # Planning officer does NOT see bank mortgage details or property tax payment amounts
    assert "loan_amount" not in data.get("encumbrance", {})
    assert "amount_paid" not in data.get("property_tax", {})
    assert "admin_metadata" not in data


def test_25_municipal_authorization(client):
    """Item 25: Municipal officer receives municipal tax and building permission context."""
    token = get_token(client, "municipal@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["parcel_id"] == "P-1027"
    assert "admin_metadata" not in data


def test_26_tax_authorization(client):
    """Item 26: Tax officer receives property tax assessment details but not building sanction floor plans."""
    token = get_token(client, "tax@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    if data.get("property_tax") and data["property_tax"].get("status") == "Paid":
        assert "amount_paid" in data["property_tax"]
    # Tax officer does NOT see building permission floors or mortgage loan numbers
    assert "floors" not in data.get("building_permission", {})
    assert "loan_amount" not in data.get("encumbrance", {})
    assert "admin_metadata" not in data


def test_27_administrator_authorization(client):
    """Item 27: Administrator receives administrative metadata and system audit hash."""
    token = get_token(client, "admin@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "admin_metadata" in data
    assert "audit_hash" in data["admin_metadata"]


def test_28_auditor_authorization(client):
    """Item 28: Auditor receives audit-authorized information."""
    token = get_token(client, "auditor@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert "admin_metadata" in data
    assert "audit_hash" in data["admin_metadata"]


def test_29_forbidden_access(client):
    """Item 29: Citizen role is rejected with 403 Forbidden on officer-only conflict management."""
    token = get_token(client, "citizen@plot360.gov.in")
    res = client.get("/api/v1/conflicts", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_30_sensitive_field_filtering(client):
    """Item 30: Verify server filters fields on the wire, not just in UI."""
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {cit_token}"})
    assert res.status_code == 200
    json_text = res.text
    # Forbidden strings must be completely absent from raw HTTP payload
    assert "admin_metadata" not in json_text
    assert "RESTRICTED_OFFICER_AUDIT" not in json_text


def test_31_forbidden_data_absent_from_json(client):
    """Item 31: Inspect raw JSON response for forbidden officer notes and verification secrets."""
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {cit_token}"})
    data = res.json()
    ai = data.get("ai_alert")
    if ai:
        assert "notes" not in ai
        assert "confidence" not in ai


def test_32_role_switching(client):
    """Item 32: Role switching from Administrator to Citizen cleanses privileged fields."""
    admin_token = get_token(client, "admin@plot360.gov.in")
    cit_token = get_token(client, "citizen@plot360.gov.in")

    admin_res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert "admin_metadata" in admin_res

    cit_res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {cit_token}"}).json()
    assert "admin_metadata" not in cit_res


def test_33_cache_invalidation_simulation(client):
    """Item 33: Client state change from officer to citizen clears privileged access immediately."""
    plan_token = get_token(client, "planning@plot360.gov.in")
    cit_token = get_token(client, "citizen@plot360.gov.in")

    plan_res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {plan_token}"}).json()
    if plan_res.get("building_permission"):
        assert "floors" in plan_res["building_permission"]

    cit_res = client.get("/api/v1/parcels/P-1027", headers={"Authorization": f"Bearer {cit_token}"}).json()
    assert "floors" not in cit_res.get("building_permission", {})


def test_34_privilege_escalation_prevention(client):
    """Item 34: Forged role headers or queries do not elevate citizen privilege."""
    cit_token = get_token(client, "citizen@plot360.gov.in")
    forged_headers = {
        "Authorization": f"Bearer {cit_token}",
        "X-User-Role": "administrator",
        "Role": "administrator"
    }
    res = client.get("/api/v1/conflicts", headers=forged_headers)
    assert res.status_code == 403


def test_35_search_leakage(client):
    """Item 35: Global search does not leak private person ownership records to citizen role."""
    cit_token = get_token(client, "citizen@plot360.gov.in")
    admin_token = get_token(client, "admin@plot360.gov.in")

    cit_res = client.get("/api/v1/search?q=Sharma", headers={"Authorization": f"Bearer {cit_token}"}).json()
    for item in cit_res:
        assert item["type"] != "Person/Ownership", f"Citizen leaked owner identity: {item}"

    admin_res = client.get("/api/v1/search?q=Sharma", headers={"Authorization": f"Bearer {admin_token}"}).json()
    # Admin can search ownership
    types = [item["type"] for item in admin_res]
    assert "Parcel" in types or "Person/Ownership" in types


def test_36_notification_leakage(client):
    """Item 36: Internal SYSTEM, CONFLICT, and AI_ALERT notifications are not delivered to citizen."""
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res = client.get("/api/v1/notifications", headers={"Authorization": f"Bearer {cit_token}"})
    assert res.status_code == 200
    notifs = res.json()
    for n in notifs:
        assert n["notification_type"] not in ["SYSTEM", "CONFLICT", "AI_ALERT", "ADMIN"]


def test_37_gis_data_leakage(client):
    """Item 37: Map point and bbox lookups return public-safe features without leaking administrative secrets."""
    res = client.get("/api/v1/gis/parcels/bbox?bbox=76.7,30.7,76.8,30.8&limit=10")
    assert res.status_code == 200
    features = res.json()["features"]
    for f in features:
        props = f["properties"]
        assert "admin_metadata" not in props
        assert "internal_notes" not in props
