# PLOT360 — PHASE 0 READ-ONLY FINDINGS & DEFECT REGISTRY

**Date:** September 26, 2026  
**Status:** COMPLETE (READ-ONLY AUDIT)  
**Evaluator:** Antigravity Autonomous Systems Engineering Team  

---

## 1. COMPREHENSIVE FINDINGS INVENTORY

### [FINDING-01] P0: Client-Side State / Mock Catalog RBAC Bypass
* **Feature:** Role-Based Access Control & Personal Identifiable Information (PII) Governance
* **Severity:** **P0** (Security & Authorization Vulnerability)
* **Evidence:** `src/context/AppContext.jsx:32` stores `currentRole` in local state. In `src/services/mockData.js`, `mockParcels` contains unmasked owner phone numbers, tax details, and legal disputes. If the backend API fails or if unauthenticated requests fall back to frontend mocks, all PII is exposed to any user role.
* **Exact Location:** `src/context/AppContext.jsx`, `src/services/mockData.js`, `backend/app/routers/parcels.py:45`
* **Current Behavior:** A citizen user can modify `localStorage.getItem('plot360_role')` or inspect the in-memory React state to view surveyor/revenue officer tabs and unredacted PII.
* **Expected Behavior:** Sensitive fields (Aadhaar, phone, dispute notes, banking liens) must be stripped server-side before sending the JSON response based on the authenticated JWT claims.
* **Root Cause:** Incomplete backend response masking across non-admin routers; frontend fallback mock data contains full unredacted records.
* **User Impact:** Unauthorized viewing of citizen personal details, court litigation notes, and municipal financial assessments.
* **Security Impact:** Violation of Aadhaar Act data-privacy mandates and DPDP (Digital Personal Data Protection) Act compliance.
* **Recommended Fix Direction:**
  1. Enforce strict Pydantic response models in `backend/app/schemas/` with role-aware serializers.
  2. Redact sensitive fields from frontend `mockData.js` default fallback objects.
  3. Protect frontend routes and tabs with cryptographic token claims rather than simple string comparisons.
* **Dependencies:** `backend/app/auth.py`, `backend/app/services/parcel_service.py`
* **Regression Risk:** Low (if serializers preserve standard schema keys with null/masked values).
* **Fix Timing:** Fix locally without additional tools before any external tool/MCP integration.

---

### [FINDING-02] P1: Report Export Does Not Download Structured Cadastral Dossier
* **Feature:** Dossier & Land Title Certificate Generation
* **Severity:** **P1** (Core Functional Defect)
* **Evidence:**
  - `src/components/land-explorer/QuickActionsBar.jsx:29`: Clicking *"Generate Report"* calls `setUnifiedReportOpen(true)`, which only opens a modal.
  - `src/components/parcel/UnifiedParcelModal.jsx:126`: Clicking *"Export Record"* initiates a client-side `new Blob([text], { type: 'text/plain' })` download of a `.txt` file, which is often blocked or fails silently, and is not an acceptable government dossier format.
* **Exact Location:** `src/components/land-explorer/QuickActionsBar.jsx:29`, `src/components/parcel/UnifiedParcelModal.jsx:126`
* **Current Behavior:** Users cannot download an official PDF or structured report of the parcel record.
* **Expected Behavior:** Clicking "Generate Report" or "Export Record" downloads a formatted, multi-page cadastral dossier PDF containing map imagery, QR code, ownership breakdown, and stamp duty details.
* **Root Cause:** Absence of a backend PDF rendering endpoint (e.g. ReportLab or headless browser renderer) or client-side PDF generator (e.g. `jspdf`/`html2canvas`).
* **User Impact:** Inability for citizens, banks, or revenue officers to obtain verifiable offline land records.
* **Security Impact:** None.
* **Recommended Fix Direction:**
  1. Implement a clean client-side or backend PDF generation service.
  2. Connect the "Export Record" action to trigger a verified blob stream with proper MIME headers (`application/pdf`) and filename sanitization.
* **Dependencies:** `UnifiedParcelModal.jsx`, `backend/app/routers/documents.py` (if server-side)
* **Regression Risk:** Minimal.
* **Fix Timing:** Fix locally in Phase 1.

---

### [FINDING-03] P1: Presentation Mode Modal Prematurely Unmounts on Step 2
* **Feature:** Automated Presentation Walkthrough & Demonstration Mode
* **Severity:** **P1** (Demo & Workflow Failure)
* **Evidence:** In `src/components/modules/PresentationModeModal.jsx:223`, step 2 executes `setActiveModule('explorer')`. In `src/App.jsx:178`, the component is rendered as `{activeModule === 'presentation' && <PresentationModeModal />}`, causing immediate unmount upon switching modules.
* **Exact Location:** `src/components/modules/PresentationModeModal.jsx:223`, `src/App.jsx:178`
* **Current Behavior:** The automated presentation stops abruptly after Step 1. The modal vanishes and does not guide the evaluator through the remaining 19 steps.
* **Expected Behavior:** Presentation Mode should remain mounted as a persistent, floating companion or HUD controller over the explorer, registry, and analytics modules.
* **Root Cause:** State collision between top-level page navigation (`activeModule`) and presentation modal visibility.
* **User Impact:** Demonstrations to judges and stakeholders fail automatically without manual intervention.
* **Security Impact:** None.
* **Recommended Fix Direction:**
  1. Decouple presentation mode from `activeModule` into an independent overlay state (e.g. `isPresentationActive`).
  2. Render `PresentationModeModal` persistently at the root level of `App.jsx` above all modules.
* **Dependencies:** `src/App.jsx`, `src/context/AppContext.jsx`
* **Regression Risk:** Low.
* **Fix Timing:** Fix locally in Phase 1.

---

### [FINDING-04] P1: Light Mode Contrast & Styling Degradation
* **Feature:** Theming, UI Presentation Quality & Accessibility (WCAG AA)
* **Severity:** **P1** (UX & Accessibility Issue)
* **Evidence:** In `src/styles/variables.css:48`, `--brand-accent-cyan: #38bdf8` is applied across text labels, active tabs, and badges on top of white (`#ffffff`) or light slate (`#f8fafc`) surfaces, producing a 1.92:1 contrast ratio.
* **Exact Location:** `src/styles/variables.css` (`[data-theme='light']`), `src/components/parcel/UnifiedParcelModal.jsx`, `src/components/ai/ViewEvidenceModal.jsx`
* **Current Behavior:** Text is washed out, muted badges are difficult to read, and dark-themed modal wrappers (`bg-[#040915]`) clash jarringly with light mode backgrounds.
* **Expected Behavior:** High-contrast color tokens adhering to WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for large graphical elements) and consistent theme propagation across all modals.
* **Root Cause:** Incomplete CSS token mappings for Light Mode and hardcoded dark Tailwind hex values in modal components.
* **User Impact:** Eye strain, poor readability in daylight or bright conference projector environments, accessibility compliance failure.
* **Security Impact:** None.
* **Recommended Fix Direction:**
  1. Refine `[data-theme='light']` CSS tokens (use `--brand-accent-cyan: #0284c7` or `#0369a1` in light mode).
  2. Replace hardcoded `bg-[#040915]` classes with theme-aware CSS custom properties (`var(--card-bg)`).
* **Dependencies:** `src/styles/variables.css`
* **Regression Risk:** Low (visual only).
* **Fix Timing:** Fix locally in Phase 1.

---

### [FINDING-05] P2: Satellite Multi-Temporal Imagery Limited to Chandigarh (P-1027)
* **Feature:** AI Temporal Analysis & Sentinel-2 Change Detection
* **Severity:** **P2** (Secondary Coverage Constraint)
* **Evidence:** `src/components/ai/ViewEvidenceModal.jsx:28` checks `activeParcel?.parcel_id === 'P-1027' || Boolean(activeParcel?.sentinel_available)`. GeoTIFF directory `PLOT360_Sentinel2_2020_2025/` contains raster tiles exclusively for Chandigarh Sector 17.
* **Exact Location:** `src/components/ai/ViewEvidenceModal.jsx:28`, `PLOT360_Sentinel2_2020_2025/`
* **Current Behavior:** Selecting any parcel outside Chandigarh displays a graceful fallback notice and synthetic NDVI metrics.
* **Expected Behavior:** Multi-temporal rasters for all 15 demo jurisdictions.
* **Root Cause:** Storage and asset constraints; Sentinel-2 paired rasters (2020 vs 2025) were pre-cached only for the flagship demonstration parcel.
* **User Impact:** Evaluators testing other cities see simulated change-detection numbers rather than raw satellite comparison sliders.
* **Security Impact:** None.
* **Recommended Fix Direction:** Keep as P2. Ensure the UI transparently communicates data availability without breaking or showing unhandled exceptions.
* **Dependencies:** Satellite raster storage, Earth Engine / Sentinel API.
* **Regression Risk:** None.
* **Fix Timing:** Can wait for external satellite tool/MCP integration or retain curated demonstration parcels.

---

### [FINDING-06] P2: Utility & SCADA Telemetry Is Static Mock Data
* **Feature:** Infrastructure & Smart City Utilities Overlay
* **Severity:** **P2** (Functional Enhancement)
* **Evidence:** `backend/app/routers/utilities.py:34` returns pre-seeded utility attributes (water pressure, power substation load, sewage pipe diameter) from the SQLite database.
* **Exact Location:** `backend/app/routers/utilities.py`, `src/components/parcel/tabs/ParcelUtilitiesTab.jsx`
* **Current Behavior:** Attributes are static and do not simulate real-time fluctuations or sensor anomalies.
* **Expected Behavior:** Dynamic sensor telemetry simulation with simulated live telemetry feeds.
* **Root Cause:** Designed as an architectural demonstration of multi-departmental data fusion rather than live IoT ingestion.
* **User Impact:** Low; static values suffice for hackathon evaluation.
* **Security Impact:** None.
* **Recommended Fix Direction:** Add lightweight telemetry fluctuation generator or leave as static baseline.
* **Dependencies:** None.
* **Regression Risk:** None.
* **Fix Timing:** Polish / P2.

---

### [FINDING-07] P3: Missing Micro-Interactions on Cadastral Layer Toggles
* **Feature:** GIS Layer Control Panel
* **Severity:** **P3** (Cosmetic & Polish)
* **Evidence:** Toggling vector layers (e.g. Master Plan Zoning vs High Tension Buffer) updates Leaflet polygons immediately without a smooth opacity transition.
* **Exact Location:** `src/components/gis/MapEngine.jsx:145`
* **Current Behavior:** Layer changes are instantaneous.
* **Expected Behavior:** Smooth 200ms opacity crossfade.
* **User Impact:** Minor visual abruptness.
* **Fix Timing:** P3 (Post-Phase 1 polish).

---

## 2. TOP P0 ISSUES (IMMEDIATE ACTION REQUIRED)

1. **[FINDING-01] Strict Server-Side RBAC & Field Masking:**
   - Eliminate client-side trust. Ensure endpoints (`/api/v1/parcels`, `/api/v1/governance`) redact Aadhaar numbers, private phone numbers, internal litigation notes, and commercial valuation data based on verified JWT role claims.
   - Sanitize frontend fallback mocks to prevent accidental PII leakage during network offline states.

---

## 3. TOP P1 ISSUES (CORE WORKFLOW & USABILITY)

1. **[FINDING-02] Cadastral Report & Dossier PDF Export:**
   - Implement true PDF report generation for parcel dossiers with map snapshots, QR verification, and official land record formatting.
2. **[FINDING-03] Persistent Presentation Mode Orchestration:**
   - Decouple `PresentationModeModal` from page-level module routing so it floats as an interactive companion guide across all 20 presentation steps without unmounting.
3. **[FINDING-04] Light Mode Contrast & Modal Palette Hardening:**
   - Update CSS tokens in `[data-theme='light']` to satisfy WCAG AA 4.5:1 minimums and eliminate hardcoded dark background classes in modals.

---

## 4. P2 ISSUES (SECONDARY & FUNCTIONAL ENHANCEMENTS)

1. **[FINDING-05] Satellite Temporal Imagery Coverage:**
   - Clearly document that multi-temporal Sentinel-2 GeoTIFF imagery is currently provisioned for Chandigarh (`P-1027`), with graceful synthetic fallbacks for other cities.
2. **[FINDING-06] Real-time SCADA / Utility Simulation:**
   - Enhance utility feed demonstration data with synthetic status variations.

---

## 5. P3 ISSUES (POLISH & FUTURE REFINEMENTS)

1. **[FINDING-07] GIS Map Layer Transition Animations:**
   - Add smooth opacity fade transitions when switching between cadastral, zoning, and satellite basemaps.
2. **Additional Multi-Language Locales:**
   - Extend existing English/Hindi localization to Tamil, Telugu, and Marathi.

---

## 6. SAFE FIX ORDER (PHASED EXECUTION PLAN)

When authorized to begin Phase 1 fixes, the following execution order guarantees maximum stability with zero regression:

```
Step 1: P0 Server-Side Field Redaction & Token Enforcement (backend/app/services/parcel_service.py)
   ↓
Step 2: P1 Presentation Mode Unmount Fix (src/App.jsx & src/components/modules/PresentationModeModal.jsx)
   ↓
Step 3: P1 Light Mode CSS Contrast & Token Refinement (src/styles/variables.css)
   ↓
Step 4: P1 Cadastral Dossier PDF Export Generation (src/components/parcel/UnifiedParcelModal.jsx)
   ↓
Step 5: P2 Satellite Multi-City Fallback Messaging & Handling (src/components/ai/ViewEvidenceModal.jsx)
```

---

## 7. SPECIALIST TOOL / MCP INTEGRATION CANDIDATES

The following items should **wait** for external MCP or specialized tool integration:
* **Live Sentinel-2 / Earth Engine Ingestion:** Ingesting multi-gigabyte satellite rasters for all 15 cities requires Earth Engine or Sentinel Hub API keys and cloud storage buckets.
* **CERSAI / Banking Portal Verification:** Live mortgage verification requires bank API gateways.
* **Bhu-Naksha WMS / WFS Live Streams:** Direct integration with state government cadastral GIS servers.

---

## 8. ITEMS TO BE FIXED LOCALLY WITHOUT ADDITIONAL TOOLS

The following items can and should be resolved purely within the existing local codebase:
1. **Server-Side RBAC Field Masking:** Modifying Pydantic schemas and FastAPI response filters.
2. **Presentation Mode Decoupling:** Re-architecting modal state in `App.jsx`.
3. **Light Mode CSS Contrast Fixes:** Updating `variables.css` token values and replacing hardcoded Tailwind dark classes.
4. **Client-Side PDF Dossier Generation:** Utilizing standard browser print/canvas or lightweight PDF libraries.

---

## 9. ITEMS THAT MUST NOT BE TOUCHED WITHOUT HUMAN APPROVAL

* **Database Schema Migrations:** Any alteration to `backend/app/models/` that drops or renames columns in `plot360_dev.db`.
* **Authentication Cryptographic Secrets:** Altering JWT signing algorithms or default user credential structures.
* **Cadastral Coordinate System (CRS):** Changing spatial projections from standard EPSG:4326 / WGS84.

---

## 10. REGRESSION-CRITICAL FEATURES THAT MUST BE PROTECTED

During all future bug-fixing phases, the following core capabilities must remain completely intact:
1. **Cadastral Leaflet Map Rendering:** Bounding box calculations, parcel selection clicks, polygon highlighting, and tile loading.
2. **175 Passing Automated Backend Tests:** `pytest backend/tests` must maintain 100% pass rate.
3. **ULPIN 14-Digit Search Engine:** Fast multi-attribute lookups across 240 parcels.
4. **Unified Parcel Modal Data Aggregation:** Seamless switching between RoR, Planning, Tax, and AI tabs.
5. **AI Assistant Grounding:** Context injection of active parcel metadata into LandIQ responses.
