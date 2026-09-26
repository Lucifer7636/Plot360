"""
PLOT360 Backend — Phase P0 Strict Server-Side RBAC & Field-Level Data Exposure Tests
Tests verifying that sensitive/protected fields are omitted from wire JSON responses
for unauthorized callers, preventing data leakage across all parcel and governance endpoints.
"""
import pytest
from starlette.testclient import TestClient


def get_token(client: TestClient, username: str, password: str = "Plot360Pass123!") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, f"Login failed for {username}: {res.text}"
    return res.json()["access_token"]


def test_encumbrance_direct_api_citizen_leakage_prevented(client: TestClient):
    """Citizen and unauthenticated direct API access must not receive loan amounts or bank names."""
    ulpin = "IN-PB-CHD-0001027"

    # 1. Unauthenticated request
    res_unauth = client.get(f"/api/v1/parcels/{ulpin}/encumbrance")
    assert res_unauth.status_code == 200
    for item in res_unauth.json():
        assert "status" in item
        assert "loan_amount" not in item, "Leaked loan_amount to unauthenticated request"
        assert "institution" not in item, "Leaked institution to unauthenticated request"
        assert "reference" not in item, "Leaked reference to unauthenticated request"

    # 2. Citizen token
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res_cit = client.get(f"/api/v1/parcels/{ulpin}/encumbrance", headers={"Authorization": f"Bearer {cit_token}"})
    assert res_cit.status_code == 200
    for item in res_cit.json():
        assert "status" in item
        assert "loan_amount" not in item, "Leaked loan_amount to citizen role"
        assert "institution" not in item, "Leaked institution to citizen role"
        assert "reference" not in item, "Leaked reference to citizen role"

    # 3. Revenue officer token (authorized)
    rev_token = get_token(client, "revenue@plot360.gov.in")
    res_rev = client.get(f"/api/v1/parcels/{ulpin}/encumbrance", headers={"Authorization": f"Bearer {rev_token}"})
    assert res_rev.status_code == 200
    encs = res_rev.json()
    assert len(encs) > 0
    active_encs = [e for e in encs if e.get("status") in ["Active", "ENCUMBERED", "ACTIVE"]]
    if active_encs:
        assert "loan_amount" in active_encs[0]
        assert "institution" in active_encs[0]


def test_tax_direct_api_citizen_and_revenue_leakage_prevented(client: TestClient):
    """Property tax payment amounts must not leak to Citizen or Revenue Officer."""
    ulpin = "IN-PB-CHD-0001027"

    # 1. Citizen request
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res_cit = client.get(f"/api/v1/parcels/{ulpin}/tax", headers={"Authorization": f"Bearer {cit_token}"})
    assert res_cit.status_code == 200
    for item in res_cit.json():
        assert "status" in item
        assert "amount_paid" not in item, "Leaked amount_paid to citizen"
        assert "annual_demand" not in item, "Leaked annual_demand to citizen"
        assert "receipt_no" not in item, "Leaked receipt_no to citizen"

    # 2. Revenue Officer request (must NOT see tax payment amounts)
    rev_token = get_token(client, "revenue@plot360.gov.in")
    res_rev = client.get(f"/api/v1/parcels/{ulpin}/tax", headers={"Authorization": f"Bearer {rev_token}"})
    assert res_rev.status_code == 200
    for item in res_rev.json():
        assert "amount_paid" not in item, "Leaked amount_paid to revenue officer"
        assert "annual_demand" not in item, "Leaked annual_demand to revenue officer"

    # 3. Tax Officer request (authorized)
    tax_token = get_token(client, "tax@plot360.gov.in")
    res_tax = client.get(f"/api/v1/parcels/{ulpin}/tax", headers={"Authorization": f"Bearer {tax_token}"})
    assert res_tax.status_code == 200
    taxes = res_tax.json()
    assert len(taxes) > 0
    assert "amount_paid" in taxes[0]
    assert "annual_demand" in taxes[0]


def test_building_direct_api_citizen_and_tax_leakage_prevented(client: TestClient):
    """Building permission floor plans must not leak to Citizen or Tax Officer."""
    ulpin = "IN-PB-CHD-0001027"

    # 1. Citizen request
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res_cit = client.get(f"/api/v1/parcels/{ulpin}/building", headers={"Authorization": f"Bearer {cit_token}"})
    assert res_cit.status_code == 200
    for item in res_cit.json():
        assert "status" in item
        assert "floors" not in item, "Leaked floors to citizen"
        assert "number_of_floors" not in item, "Leaked number_of_floors to citizen"
        assert "approved_area" not in item, "Leaked approved_area to citizen"

    # 2. Tax Officer request (must NOT see structural floor plans)
    tax_token = get_token(client, "tax@plot360.gov.in")
    res_tax = client.get(f"/api/v1/parcels/{ulpin}/building", headers={"Authorization": f"Bearer {tax_token}"})
    assert res_tax.status_code == 200
    for item in res_tax.json():
        assert "floors" not in item, "Leaked floors to tax officer"

    # 3. Planning Officer request (authorized)
    plan_token = get_token(client, "planning@plot360.gov.in")
    res_plan = client.get(f"/api/v1/parcels/{ulpin}/building", headers={"Authorization": f"Bearer {plan_token}"})
    assert res_plan.status_code == 200
    bps = res_plan.json()
    assert len(bps) > 0
    assert "floors" in bps[0]


def test_liabilities_aggregation_filtering(client: TestClient):
    """The unified liabilities endpoint must filter nested encumbrances and mortgages."""
    ulpin = "IN-PB-CHD-0001027"

    # Citizen access
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res_cit = client.get(f"/api/v1/parcels/{ulpin}/liabilities", headers={"Authorization": f"Bearer {cit_token}"})
    assert res_cit.status_code == 200
    data_cit = res_cit.json()

    for enc in data_cit.get("encumbrances", []):
        assert "loan_amount" not in enc, "Liabilities leaked loan_amount to citizen"
        assert "institution" not in enc, "Liabilities leaked institution to citizen"

    for mort in data_cit.get("mortgages", []):
        assert "amount" not in mort, "Liabilities leaked mortgage amount to citizen"
        assert "mortgagee" not in mort, "Liabilities leaked mortgagee to citizen"

    # Admin access
    admin_token = get_token(client, "admin@plot360.gov.in")
    res_admin = client.get(f"/api/v1/parcels/{ulpin}/liabilities", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    active_encs = [e for e in data_admin.get("encumbrances", []) if e.get("status") in ["Active", "ENCUMBERED", "ACTIVE"]]
    if active_encs:
        assert "loan_amount" in active_encs[0]


def test_citizen_service_request_contact_pii_protected(client: TestClient):
    """Service requests list must not disclose applicant phone and email to unauthorized callers."""
    # 1. Unauthenticated or generic citizen query
    res = client.get("/api/v1/citizen/service-requests")
    assert res.status_code == 200
    requests = res.json()
    for r in requests:
        assert "applicant_phone" not in r, f"Leaked applicant_phone: {r}"
        assert "applicant_email" not in r, f"Leaked applicant_email: {r}"

    # 2. Officer query (revenue officer with service_request:read)
    rev_token = get_token(client, "revenue@plot360.gov.in")
    res_rev = client.get("/api/v1/citizen/service-requests", headers={"Authorization": f"Bearer {rev_token}"})
    assert res_rev.status_code == 200
    for r in res_rev.json():
        assert "applicant_phone" in r or r.get("applicant_phone") is None
        assert "applicant_email" in r or r.get("applicant_email") is None


def test_forged_role_headers_cannot_bypass_field_filtering(client: TestClient):
    """Forging X-User-Role or Role header cannot bypass server-side field-level protection."""
    ulpin = "IN-PB-CHD-0001027"
    cit_token = get_token(client, "citizen@plot360.gov.in")

    forged_headers = {
        "Authorization": f"Bearer {cit_token}",
        "X-User-Role": "administrator",
        "Role": "administrator",
        "X-Admin": "true"
    }

    # Encumbrance check
    res_enc = client.get(f"/api/v1/parcels/{ulpin}/encumbrance", headers=forged_headers)
    assert res_enc.status_code == 200
    for item in res_enc.json():
        assert "loan_amount" not in item
        assert "institution" not in item

    # Tax check
    res_tax = client.get(f"/api/v1/parcels/{ulpin}/tax", headers=forged_headers)
    assert res_tax.status_code == 200
    for item in res_tax.json():
        assert "amount_paid" not in item


def test_timeline_redaction_for_unauthorized_user(client: TestClient):
    """Timeline event descriptions must not leak floor plans or payment numbers to citizen."""
    ulpin = "IN-PB-CHD-0001027"
    cit_token = get_token(client, "citizen@plot360.gov.in")

    res = client.get(f"/api/v1/parcels/{ulpin}/timeline", headers={"Authorization": f"Bearer {cit_token}"})
    assert res.status_code == 200
    events = res.json()

    for e in events:
        if e["event_type"] == "BUILDING_PERMISSION":
            assert "G + 2" not in e["description"], f"Timeline leaked floor count: {e['description']}"
        elif e["event_type"] == "TAX_ASSESSMENT":
            assert "14,250" not in e["description"] and "18,400" not in e["description"], f"Timeline leaked tax amount: {e['description']}"


def test_demo_parcel_endpoint_filtering(client: TestClient):
    """GET /api/v1/demo/parcels/{ulpin} must filter fields for citizen role."""
    ulpin = "IN-PB-CHD-0001027"
    cit_token = get_token(client, "citizen@plot360.gov.in")

    res = client.get(f"/api/v1/demo/parcels/{ulpin}", headers={"Authorization": f"Bearer {cit_token}"})
    assert res.status_code == 200
    data = res.json()

    # Building permission floors must not leak
    if data.get("building_permission"):
        assert "floors" not in data["building_permission"]

    # Encumbrance amt must not leak
    if data.get("encumbrance"):
        assert "amt" not in data["encumbrance"]
        assert "inst" not in data["encumbrance"]

    # Tax paid amount must not leak
    if data.get("property_tax"):
        assert "paid" not in data["property_tax"]
        assert "demand" not in data["property_tax"]


def test_demo_parcels_collection_anonymous_and_citizen_filtering(client: TestClient):
    """P0.1: GET /api/v1/demo/parcels collection endpoint must filter sensitive fields for unauthenticated and citizen callers."""
    # 1. Unauthenticated collection query
    res_unauth = client.get("/api/v1/demo/parcels?location=chandigarh")
    assert res_unauth.status_code == 200
    parcels_unauth = res_unauth.json()
    assert len(parcels_unauth) > 0

    for p in parcels_unauth:
        bp = p.get("building_permission")
        if bp:
            assert "floors" not in bp, f"Collection leaked floors anonymously: {bp}"
            assert "number_of_floors" not in bp
            assert "approved_area" not in bp

        enc = p.get("encumbrance")
        if enc:
            assert "amt" not in enc, f"Collection leaked amt anonymously: {enc}"
            assert "inst" not in enc, f"Collection leaked inst anonymously: {enc}"
            assert "loan_amount" not in enc
            assert "institution" not in enc
            assert "reference" not in enc
            assert "ref" not in enc

        tax = p.get("property_tax")
        if tax:
            assert "paid" not in tax, f"Collection leaked tax paid anonymously: {tax}"
            assert "amount_paid" not in tax
            assert "annual_demand" not in tax
            assert "demand" not in tax

    # 2. Citizen collection query
    cit_token = get_token(client, "citizen@plot360.gov.in")
    res_cit = client.get("/api/v1/demo/parcels?location=chandigarh", headers={"Authorization": f"Bearer {cit_token}"})
    assert res_cit.status_code == 200
    parcels_cit = res_cit.json()

    for p in parcels_cit:
        bp = p.get("building_permission")
        if bp:
            assert "floors" not in bp, f"Collection leaked floors to citizen: {bp}"
        enc = p.get("encumbrance")
        if enc:
            assert "amt" not in enc, f"Collection leaked amt to citizen: {enc}"
            assert "inst" not in enc, f"Collection leaked inst to citizen: {enc}"
        tax = p.get("property_tax")
        if tax:
            assert "paid" not in tax, f"Collection leaked tax paid to citizen: {tax}"


def test_demo_parcels_collection_privileged_roles(client: TestClient):
    """P0.1: Privileged roles must legitimately access permitted fields on collection endpoint."""
    # Planning officer must see building permission floors
    plan_token = get_token(client, "planning@plot360.gov.in")
    res_plan = client.get("/api/v1/demo/parcels?location=chandigarh", headers={"Authorization": f"Bearer {plan_token}"})
    assert res_plan.status_code == 200
    bps = [p.get("building_permission") for p in res_plan.json() if p.get("building_permission")]
    assert any("floors" in b for b in bps), "Planning officer should receive building floors in collection"

    # Revenue officer must see encumbrance loan details
    rev_token = get_token(client, "revenue@plot360.gov.in")
    res_rev = client.get("/api/v1/demo/parcels?location=chandigarh", headers={"Authorization": f"Bearer {rev_token}"})
    assert res_rev.status_code == 200
    active_encs = [p.get("encumbrance") for p in res_rev.json() if p.get("encumbrance") and p.get("encumbrance", {}).get("status") in ["Active", "ENCUMBERED"]]
    if active_encs:
        assert any("amt" in e or "loan_amount" in e for e in active_encs), "Revenue officer should receive encumbrance amount"


def test_frontend_codebase_no_confidential_fallbacks():
    """P0.1: Static verification that frontend UI components do not contain confidential mock fallbacks."""
    import pathlib

    repo_root = pathlib.Path(__file__).resolve().parent.parent.parent

    # 1. GovernanceModule
    gov_file = repo_root / "src" / "components" / "modules" / "GovernanceModule.jsx"
    gov_text = gov_file.read_text(encoding="utf-8")
    assert "|| 'HDFC Bank Ltd.'" not in gov_text, "Found forbidden mock fallback 'HDFC Bank Ltd.' in GovernanceModule"
    assert "|| '₹ 45,00,000'" not in gov_text, "Found forbidden mock fallback '₹ 45,00,000' in GovernanceModule"
    assert "|| 'MORT-2023-098'" not in gov_text, "Found forbidden mock fallback 'MORT-2023-098' in GovernanceModule"

    # 2. ParcelDetailsPanel
    pdp_file = repo_root / "src" / "components" / "land-explorer" / "ParcelDetailsPanel.jsx"
    pdp_text = pdp_file.read_text(encoding="utf-8")
    assert "|| 'G + 2 Floors'" not in pdp_text, "Found forbidden mock fallback 'G + 2 Floors' in ParcelDetailsPanel"
    assert "? 'HDFC Bank Ltd.'" not in pdp_text, "Found forbidden mock fallback 'HDFC Bank Ltd.' in ParcelDetailsPanel"
    assert "? '₹ 45,00,000'" not in pdp_text, "Found forbidden mock fallback '₹ 45,00,000' in ParcelDetailsPanel"

    # 3. PlanningModule
    plan_file = repo_root / "src" / "components" / "modules" / "PlanningModule.jsx"
    plan_text = plan_file.read_text(encoding="utf-8")
    assert "|| 'G + 2 Floors'" not in plan_text, "Found forbidden mock fallback 'G + 2 Floors' in PlanningModule"
