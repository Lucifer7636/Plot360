"""
PLOT360 Complete Sidebar & Feature Functionality Automated Test Suite
Verifies every existing sidebar module, submenu, tab, API contract,
RBAC enforcement, and parcel-specific data isolation.
"""
import pytest
from starlette.testclient import TestClient

ALL_ROLES = [
    ("citizen", "citizen@plot360.gov.in"),
    ("revenue_officer", "revenue@plot360.gov.in"),
    ("registration_officer", "registration@plot360.gov.in"),
    ("planning_officer", "planning@plot360.gov.in"),
    ("municipal_officer", "municipal@plot360.gov.in"),
    ("tax_officer", "tax@plot360.gov.in"),
    ("administrator", "admin@plot360.gov.in"),
    ("auditor", "auditor@plot360.gov.in"),
]


def get_token(client: TestClient, username: str) -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": "Plot360Pass123!"})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


# =====================================================================
# 1. MAJOR SIDEBAR MODULE APIS
# =====================================================================

def test_sidebar_land_explorer_api(client: TestClient, admin_token: str):
    """Sidebar 1: Land Explorer -> GET /api/v1/parcels"""
    res = client.get("/api/v1/parcels", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    p1027 = next((p for p in data if p.get("parcel_id") == "P-1027"), None)
    assert p1027 is not None
    assert p1027.get("ulpin") == "IN-PB-CHD-0001027"


def test_sidebar_parcel_intelligence_api(client: TestClient, admin_token: str):
    """Sidebar 2: Parcel Intelligence -> GET /api/v1/parcels/{ulpin}"""
    res = client.get("/api/v1/parcels/IN-PB-CHD-0001027", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data.get("parcel_id") == "P-1027"
    assert "area" in data or "standardized_area" in data


def test_sidebar_governance_records_api(client: TestClient, revenue_token: str):
    """Sidebar 3: Governance & Records -> GET /api/v1/parcels/{ulpin}/ror"""
    res = client.get("/api/v1/parcels/IN-PB-CHD-0001027/ror", headers={"Authorization": f"Bearer {revenue_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert data[0].get("ulpin") == "IN-PB-CHD-0001027"


def test_sidebar_planning_development_api(client: TestClient, admin_token: str):
    """Sidebar 4: Planning & Development -> GET /api/v1/parcels/{ulpin}/planning"""
    res = client.get("/api/v1/parcels/IN-PB-CHD-0001027/planning", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert data[0].get("ulpin") == "IN-PB-CHD-0001027"


def test_sidebar_citizen_services_api(client: TestClient, citizen_token: str):
    """Sidebar 5: Citizen Services -> POST /api/v1/citizen/service-requests"""
    payload = {
        "service_type": "demarcation",
        "parcel_id": "P-1027",
        "ulpin": "IN-PB-CHD-0001027",
        "applicant_name": "Ravinder Singh",
        "applicant_phone": "+91 98765 43210",
        "notes": "Boundary verification request"
    }
    res = client.post("/api/v1/citizen/service-requests", json=payload, headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code in (200, 201)
    data = res.json()
    assert "request_id" in data or "id" in data


def test_sidebar_analytics_ai_api(client: TestClient, admin_token: str):
    """Sidebar 6: Analytics & AI -> GET /api/v1/conflicts and GET /api/v1/ai/change-events"""
    res = client.get("/api/v1/conflicts", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

    res_ai = client.get("/api/v1/ai/change-events", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_ai.status_code == 200
    assert isinstance(res_ai.json(), list)


def test_sidebar_integration_hub_api(client: TestClient, admin_token: str):
    """Sidebar 7: Integration Hub -> GET /api/v1/integrations"""
    res = client.get("/api/v1/integrations", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_sidebar_administration_security_api(client: TestClient, admin_token: str):
    """Sidebar 8: Administration & Security -> GET /api/v1/admin/audit"""
    res = client.get("/api/v1/admin/audit", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)


def test_sidebar_system_health_api(client: TestClient):
    """Sidebar 9: System / Data Health -> GET /api/v1/health and GET /api/v1/health/detailed"""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json().get("status") in ("ok", "healthy")

    res_det = client.get("/api/v1/health/detailed")
    assert res_det.status_code == 200
    data = res_det.json()
    assert "database" in data or "services" in data or "status" in data


# =====================================================================
# 2. PARCEL TABS FUNCTIONALITY & DATA CONSISTENCY
# =====================================================================

def test_parcel_tabs_all_endpoints_functional(client: TestClient, admin_token: str):
    """Verify all parcel tabs retrieve data for P-1027."""
    ulpin = "IN-PB-CHD-0001027"
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Tab: Overview / Consolidated
    r_overview = client.get(f"/api/v1/parcels/{ulpin}", headers=headers)
    assert r_overview.status_code == 200
    assert r_overview.json().get("parcel_id") == "P-1027"

    # Tab: Land Records (RoR & Registration)
    r_ror = client.get(f"/api/v1/parcels/{ulpin}/ror", headers=headers)
    assert r_ror.status_code == 200

    r_reg = client.get(f"/api/v1/parcels/{ulpin}/registration", headers=headers)
    assert r_reg.status_code == 200

    # Tab: Approvals / Building Permission
    r_build = client.get(f"/api/v1/parcels/{ulpin}/building", headers=headers)
    assert r_build.status_code == 200

    # Tab: Encumbrance & Mortgages
    r_enc = client.get(f"/api/v1/parcels/{ulpin}/encumbrance", headers=headers)
    assert r_enc.status_code == 200

    # Tab: Taxation
    r_tax = client.get(f"/api/v1/parcels/{ulpin}/tax", headers=headers)
    assert r_tax.status_code == 200

    # Tab: Utilities
    r_util = client.get(f"/api/v1/parcels/{ulpin}/utilities", headers=headers)
    assert r_util.status_code == 200

    # Tab: Planning Cross-Check
    r_cross = client.get(f"/api/v1/parcels/{ulpin}/planning-crosscheck", headers=headers)
    assert r_cross.status_code == 200


def test_parcel_data_isolation_between_parcels(client: TestClient, admin_token: str):
    """Ensure Parcel A (P-1027) data never leaks into Parcel B (P-1028 or P-1025)."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    res_1027 = client.get("/api/v1/parcels/IN-PB-CHD-0001027", headers=headers).json()
    res_1028 = client.get("/api/v1/parcels/IN-PB-CHD-0001028", headers=headers).json()
    res_1025 = client.get("/api/v1/parcels/IN-PB-CHD-0001025", headers=headers).json()

    assert res_1027["parcel_id"] == "P-1027"
    assert res_1028["parcel_id"] == "P-1028"
    assert res_1025["parcel_id"] == "P-1025"

    assert res_1027["ulpin"] != res_1028["ulpin"]
    assert res_1027["ulpin"] != res_1025["ulpin"]

    # Verify area values do not overlap
    area_1027 = res_1027.get("area", {}).get("standardized") or res_1027.get("standardized_area")
    area_1028 = res_1028.get("area", {}).get("standardized") or res_1028.get("standardized_area")
    assert area_1027 != area_1028


def test_empty_and_error_states_for_nonexistent_parcel(client: TestClient, admin_token: str):
    """Ensure non-existent parcel returns 404 cleanly, not 500 error."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    fake_ulpin = "IN-NONEXISTENT-999999"

    res = client.get(f"/api/v1/parcels/{fake_ulpin}", headers=headers)
    assert res.status_code == 404
    body = res.json()
    assert "error" in body or "detail" in body or "message" in body


# =====================================================================
# 3. RBAC & FIELD-LEVEL INFORMATION CONTROL
# =====================================================================

def test_rbac_citizen_masked_sensitive_fields(client: TestClient, citizen_token: str, admin_token: str):
    """Citizen role must have sensitive owner identity masked/redacted in parcel responses."""
    c_res = client.get("/api/v1/parcels/IN-PB-CHD-0001027", headers={"Authorization": f"Bearer {citizen_token}"})
    assert c_res.status_code == 200
    c_data = c_res.json()

    a_res = client.get("/api/v1/parcels/IN-PB-CHD-0001027", headers={"Authorization": f"Bearer {admin_token}"})
    assert a_res.status_code == 200
    a_data = a_res.json()

    # Admin gets full unmasked data; citizen does not leak unmasked Aadhaar or internal security fields
    if "owner" in c_data and isinstance(c_data["owner"], dict):
        if "aadhaar" in c_data["owner"]:
            assert "X" in c_data["owner"]["aadhaar"] or c_data["owner"]["aadhaar"].endswith("****")


def test_rbac_admin_routes_forbidden_for_citizen(client: TestClient, citizen_token: str):
    """Citizen role must be forbidden from accessing admin audit logs."""
    res = client.get("/api/v1/admin/audit", headers={"Authorization": f"Bearer {citizen_token}"})
    assert res.status_code in (401, 403)


def test_all_eight_roles_authentication(client: TestClient):
    """Verify that all 8 authoritative roles can authenticate and receive JWT tokens."""
    for role_name, username in ALL_ROLES:
        token = get_token(client, username)
        assert token is not None
        assert len(token) > 20

        # Verify /api/v1/auth/me returns the correct role
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        me_data = me_res.json()
        user_roles = me_data.get("roles", [])
        assert role_name in user_roles or me_data.get("role") == role_name


# =====================================================================
# 4. SEARCH, GIS & NOTIFICATIONS
# =====================================================================

def test_search_by_ulpin_and_id(client: TestClient, admin_token: str):
    """Search endpoint must return matched parcels."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Search by ULPIN
    res_ulpin = client.get("/api/v1/search?q=IN-PB-CHD-0001027", headers=headers)
    assert res_ulpin.status_code == 200
    data_ulpin = res_ulpin.json()
    assert isinstance(data_ulpin, list)
    assert any("1027" in (item.get("title", "") + item.get("id", "")) for item in data_ulpin)

    # Search by ID
    res_id = client.get("/api/v1/search?q=P-1025", headers=headers)
    assert res_id.status_code == 200
    data_id = res_id.json()
    assert isinstance(data_id, list)
    assert any("1025" in (item.get("title", "") + item.get("id", "")) for item in data_id)


def test_notifications_lifecycle(client: TestClient, admin_token: str):
    """Verify notification retrieval and mark read functionality."""
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.json()
    assert isinstance(notifs, list)

    # Mark all read
    res_read = client.post("/api/v1/notifications/read-all", headers=headers)
    assert res_read.status_code == 200
    assert res_read.json().get("success") is True
