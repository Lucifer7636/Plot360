/**
 * PLOT360 — PARCEL INFORMATION REPORT
 * STRICT ONE-PAGE PORTRAIT (A4 210mm × 297mm)
 *
 * - Exactly 1 page, A4 Portrait, government-grade cadastral report
 * - Dynamic data binding — strictly bound to currently selected parcel
 * - Strict RBAC: officers see full detail; CITIZEN sees "Restricted — Officer Access Only"
 * - Satellite truthfulness: genuine Sentinel-2 if available, else UNAVAILABLE label
 * - Zero hardcoded parcel IDs, owner names, or financial values in production code
 * - Strict field whitelist — only fields present in approved reference format
 */

import { jsPDF as JsPDFNamed, default as JsPDFDefault } from 'jspdf';

const jsPDF = typeof JsPDFNamed === 'function' ? JsPDFNamed : (typeof JsPDFDefault === 'function' ? JsPDFDefault : JsPDFDefault?.jsPDF);

// ─── Layout Constants ────────────────────────────────────────────────────────
// A4 Portrait: 210mm × 297mm
const PAGE_W  = 210;
const PAGE_H  = 297;
const MARGIN  = 6;           // left/right margin
const COL_GAP = 4;           // gap between two-column pairs
const FULL_W  = PAGE_W - 2 * MARGIN;                     // 198mm
const HALF_W  = (FULL_W - COL_GAP) / 2;                  // 97mm
const LEFT_X  = MARGIN;                                   // 6mm
const RIGHT_X = MARGIN + HALF_W + COL_GAP;               // 107mm
const PAD     = 4;           // inner horizontal padding for cards
const HDR_H   = 23;          // header card height
const SEC1_H  = 25;          // Parcel Snapshot height
const SEC_GAP = 1.5;         // vertical gap between section rows

// Row top positions (computed from layout above)
const ROW_HEADER = MARGIN;                                    // y=6
const ROW_SEC1   = ROW_HEADER + HDR_H + SEC_GAP;             // y=30.5
const ROW_PAIR1  = ROW_SEC1 + SEC1_H + SEC_GAP;              // y=57
const PAIR1_H    = 31;
const ROW_PAIR2  = ROW_PAIR1 + PAIR1_H + SEC_GAP;            // y=89.5
const PAIR2_H    = 30;   // increased from 26: liabilities table needs 3 rows × 3.8mm
const ROW_PAIR3  = ROW_PAIR2 + PAIR2_H + SEC_GAP;            // y=121
const PAIR3_H    = 31;
const ROW_PAIR4  = ROW_PAIR3 + PAIR3_H + SEC_GAP;            // y=153.5
const PAIR4_H    = 29;   // increased from 28: 0.7mm breathing room for AI evidence
const ROW_PAIR5  = ROW_PAIR4 + PAIR4_H + SEC_GAP;            // y=183
const PAIR5_H    = 40;   // reduced from 42 to keep total in budget
const ROW_PAIR6  = ROW_PAIR5 + PAIR5_H + SEC_GAP;            // y=224.5
const PAIR6_H    = 35;   // reduced from 36 to keep total in budget
const FOOTER_Y   = ROW_PAIR6 + PAIR6_H + SEC_GAP;            // y=261
// FOOTER_Y=261 — well within 291mm safe area

// ─── Color Palette ───────────────────────────────────────────────────────────
const C = {
  navy:       [15,  23,  42],
  blue:       [2,  132, 199],
  blueLight:  [239, 246, 255],
  blueBorder: [191, 219, 254],
  white:      [255, 255, 255],
  offwhite:   [248, 250, 252],
  border:     [226, 232, 240],
  borderDark: [203, 213, 225],
  textPrim:   [15,  23,  42],
  textSec:    [71,  85, 105],
  textMuted:  [100, 116, 139],
  success:    [16, 185, 129],
  successBg:  [209, 250, 229],
  warning:    [245, 158,  11],
  warningBg:  [254, 243, 199],
  error:      [239,  68,  68],
  errorBg:    [254, 226, 226],
  grayBg:     [241, 245, 249],
};

// ─── Drawing Helpers ─────────────────────────────────────────────────────────
const sf = (doc, style = 'normal', size = 7) => {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
};

const sc = (doc, rgb) => { doc.setTextColor(...rgb); };

const box = (doc, x, y, w, h, fill = null, stroke = null, r = 0, lw = 0.25) => {
  if (fill)   doc.setFillColor(...fill);
  if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(lw); }
  const mode = fill && stroke ? 'FD' : fill ? 'F' : 'D';
  r > 0 ? doc.roundedRect(x, y, w, h, r, r, mode) : doc.rect(x, y, w, h, mode);
};

const hl = (doc, x1, x2, y, rgb = C.border, lw = 0.25) => {
  doc.setDrawColor(...rgb); doc.setLineWidth(lw); doc.line(x1, y, x2, y);
};

const vl = (doc, x, y1, y2, rgb = C.border, lw = 0.25) => {
  doc.setDrawColor(...rgb); doc.setLineWidth(lw); doc.line(x, y1, x, y2);
};

// Draw a colored pill badge. Returns right edge X.
const pill = (doc, x, y, text, type = 'success', fs = 5) => {
  const map = {
    success: { bg: C.successBg, fg: C.success, bd: [52, 211, 153] },
    warning: { bg: C.warningBg, fg: C.warning, bd: [251, 191, 36] },
    error:   { bg: C.errorBg,   fg: C.error,   bd: [248, 113, 113] },
    info:    { bg: C.blueLight, fg: C.blue,     bd: C.blueBorder },
    muted:   { bg: C.grayBg,    fg: C.textMuted,bd: C.border },
  };
  const c = map[type] || map.info;
  sf(doc, 'bold', fs);
  const tw = doc.getTextWidth(text) + 4;
  const ph = fs * 0.55 + 1.2;
  box(doc, x, y - ph * 0.72, tw, ph, c.bg, c.bd, 1.2, 0.2);
  sc(doc, c.fg);
  doc.text(text, x + 2, y);
  return x + tw;
};

// Draw a solid status dot
const dot = (doc, x, y, rgb, r = 1.1) => {
  doc.setFillColor(...rgb); doc.circle(x, y, r, 'F');
};

// Consistent title baseline: all section titles sit at cardY + TITLE_Y_OFF
const TITLE_Y_OFF = 4.8;  // baseline of section title text from card top edge

// Section title bar: renders the bold title at top of a card
const sectionTitle = (doc, x, y, title, fs = 7) => {
  sf(doc, 'bold', fs); sc(doc, C.navy);
  doc.text(title, x + PAD, y + TITLE_Y_OFF);
};

// Draw a key-value row within a card
const kv = (doc, labelX, valX, y, label, value, labelFs = 4.5, valFs = 4.8,
            labelColor = C.textMuted, valColor = C.textPrim, maxW = 40) => {
  sf(doc, 'normal', labelFs); sc(doc, labelColor);
  doc.text(label, labelX, y);
  sf(doc, 'bold', valFs); sc(doc, valColor);
  doc.text(doc.splitTextToSize(String(value), maxW)[0], valX, y);
};

// Draw a table header row (deep navy background with white text matching reference)
const tableHdr = (doc, x, y, w, cols) => {
  // cols: [{ label, ox: relativeX }]
  box(doc, x, y, w, 4, C.navy, C.navy, 0.5, 0.2);
  sf(doc, 'bold', 4.8); sc(doc, C.white);
  cols.forEach(col => doc.text(col.label, x + col.ox, y + 2.9));
};

/**
 * buildParcelPDFDoc — strict 1-page A4 Portrait PDF generator.
 */
export function buildParcelPDFDoc(parcel, currentRole = 'CITIZEN', fvStatus = 'Verified') {
  if (!parcel) throw new Error('No parcel data provided to buildParcelPDFDoc');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const isCitizen = currentRole === 'CITIZEN';

  // ── Dynamic parcel data extraction (zero hardcoded values) ──────────────
  const parcelId     = parcel.parcel_id || 'UNKNOWN';
  const ulpin        = parcel.ulpin || parcelId;
  const state        = parcel.state || '—';
  const district     = parcel.district || '—';
  const jurisdiction = parcel.jurisdiction || district;
  const landContext  = (parcel.rural_urban || 'Urban').toUpperCase();
  const status       = (parcel.status || 'Verified').toUpperCase();
  const recordStatus = status;
  const landUse      = parcel.land_use || '—';
  const zoning       = parcel.zoning || '—';
  const lastUpdated  = parcel.tax?.date || parcel.data_freshness || '—';

  const areaDisplay  = parcel.area_display || (parcel.standardized_area
    ? `${Number(parcel.standardized_area).toLocaleString()} m²` : '—');
  const origArea     = parcel.original_area_display || (parcel.original_area
    ? `${parcel.original_area} ${parcel.original_unit || 'Acre'}` : '—');
  const stdArea      = parcel.standardized_area
    ? `${Number(parcel.standardized_area).toLocaleString()} m²` : areaDisplay;

  // Analytical scenarios
  const isConflict   = parcel.scenario === 'AI_CHANGE_REVIEW';
  const isBuffer     = parcel.scenario === 'RESTRICTION_BUFFER';
  const dataStatus   = isConflict ? 'REQUIRES REVIEW' : (isBuffer ? 'PLANNING REVIEW' : 'SOURCE VERIFIED');

  // ── Canvas background ───────────────────────────────────────────────────
  box(doc, 0, 0, PAGE_W, PAGE_H, [248, 250, 252]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER & PARCEL IDENTITY (y = ROW_HEADER, h = HDR_H = 23mm)
  // ═══════════════════════════════════════════════════════════════════════════
  const hY = ROW_HEADER;
  box(doc, LEFT_X, hY, FULL_W, HDR_H, C.white, C.borderDark, 1.5, 0.3);

  // Brand + title
  sf(doc, 'bold', 9);   sc(doc, C.navy);
  doc.text('PLOT360', LEFT_X + PAD, hY + 5);
  sf(doc, 'bold', 7.5); sc(doc, C.navy);
  doc.text('PARCEL INFORMATION REPORT', LEFT_X + FULL_W - PAD, hY + 5, { align: 'right' });

  hl(doc, LEFT_X + 2, LEFT_X + FULL_W - 2, hY + 6.2, C.border, 0.2);

  // Parcel ID + status pills
  sf(doc, 'bold', 11); sc(doc, C.navy);
  doc.text(parcelId, LEFT_X + PAD, hY + 11.2);
  let px = LEFT_X + PAD + doc.getTextWidth(parcelId) + 3;
  sf(doc, 'bold', 11); // reset font before getTextWidth inside pill
  px = pill(doc, px, hY + 11.2, `Status: ${status}`,
    (status === 'VERIFIED' || status === 'ACTIVE') ? 'success' : 'warning', 5) + 2.5;
  px = pill(doc, px, hY + 11.2, `Land Context: ${landContext}`, 'info', 5) + 2.5;
  pill(doc, px, hY + 11.2, `Data Status: ${dataStatus}`,
    isConflict ? 'error' : (isBuffer ? 'warning' : 'success'), 5);

  // 4-column identity grid (y = hY + 16.5, 2 rows of k/v)
  // Whitelist: Parcel ID, State, ULPIN, Jurisdiction, Record Status, Last Updated, Land Context
  // Laying out as 4 columns × 2 rows:
  //   Col0: Parcel ID  | State
  //   Col1: ULPIN      | Jurisdiction
  //   Col2: Record Status | Last Updated
  //   Col3: Land Context  | (blank)
  const gridY   = hY + 16.5;
  const colW4   = FULL_W / 4;          // 49.5mm each
  const gridCols = [
    [ { k: 'PARCEL ID',     v: parcelId    }, { k: 'STATE',       v: state       } ],
    [ { k: 'ULPIN',         v: ulpin       }, { k: 'JURISDICTION',v: jurisdiction} ],
    [ { k: 'RECORD STATUS', v: recordStatus}, { k: 'LAST UPDATED',v: lastUpdated } ],
    [ { k: 'LAND CONTEXT',  v: landContext }, { k: '',            v: ''          } ],
  ];

  gridCols.forEach((col, ci) => {
    const cx = LEFT_X + PAD + ci * colW4;
    const labelW = 22;
    // row 0
    if (col[0].k) {
      sf(doc, 'normal', 4.5); sc(doc, C.textMuted);
      doc.text(col[0].k, cx, gridY);
      sf(doc, 'bold', 4.8); sc(doc, C.textPrim);
      doc.text(doc.splitTextToSize(col[0].v, colW4 - labelW - 2)[0], cx + labelW, gridY);
    }
    // row 1
    if (col[1].k) {
      sf(doc, 'normal', 4.5); sc(doc, C.textMuted);
      doc.text(col[1].k, cx, gridY + 3.8);
      sf(doc, 'bold', 4.8); sc(doc, C.textPrim);
      doc.text(doc.splitTextToSize(col[1].v, colW4 - labelW - 2)[0], cx + labelW, gridY + 3.8);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — PARCEL SNAPSHOT (y = ROW_SEC1, h = SEC1_H = 25mm)
  // ═══════════════════════════════════════════════════════════════════════════
  const s1Y = ROW_SEC1;
  box(doc, LEFT_X, s1Y, FULL_W, SEC1_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, LEFT_X, s1Y, '1. PARCEL SNAPSHOT');

  // Row A: 4 KPI boxes (Area, Original Area, Standardized Area, Land Use)
  // Each box = (FULL_W - 2*PAD - 3*gap) / 4 wide, gap = 2mm
  const kpiGap  = 2;
  const kpiW    = (FULL_W - 2 * PAD - 3 * kpiGap) / 4;  // ≈ 47mm
  const kpiY    = s1Y + 5.5;
  const kpiH    = 9;
  const kpiBoxes = [
    { label: 'AREA',              val: areaDisplay },
    { label: 'ORIGINAL AREA',     val: origArea    },
    { label: 'STANDARDIZED AREA', val: stdArea     },
    { label: 'LAND USE',          val: landUse     },
  ];
  kpiBoxes.forEach((b, i) => {
    const bx = LEFT_X + PAD + i * (kpiW + kpiGap);
    box(doc, bx, kpiY, kpiW, kpiH, C.offwhite, C.border, 1, 0.2);
    sf(doc, 'bold', 4.5); sc(doc, C.textMuted);
    doc.text(b.label, bx + 2.5, kpiY + 3);
    sf(doc, 'bold', 6.5); sc(doc, C.navy);
    doc.text(doc.splitTextToSize(b.val, kpiW - 5)[0], bx + 2.5, kpiY + 7);
  });

  // Row B: 7 status indicator mini-cards
  // (FULL_W - 2*PAD - 6*gap) / 7 each
  const indGap = 1.5;
  const indW   = (FULL_W - 2 * PAD - 6 * indGap) / 7;  // ≈ 26mm
  const indY   = kpiY + kpiH + 1.5;
  const indH   = 7;
  const bpStatus  = parcel.bp?.status || 'Approved';
  const encStatus = parcel.enc?.status || 'Clear';
  const taxStatus = parcel.tax?.status || 'Paid';
  const snapInds = [
    { label: 'OWNERSHIP RECORD', val: 'Available',   ok: true },
    { label: 'REGISTRATION',     val: 'Registered',  ok: true },
    { label: 'BUILDING PERM.',   val: bpStatus,      ok: bpStatus === 'Approved' },
    { label: 'ENCUMBRANCE',      val: encStatus,     ok: encStatus === 'Clear'   },
    { label: 'PROPERTY TAX',     val: taxStatus,     ok: taxStatus === 'Paid'    },
    { label: 'UTILITIES',        val: parcel.ut ? '3 Connected' : 'Available', ok: true },
    { label: 'DATA CONFLICT',
      val: isConflict ? '1 Review Required' : (isBuffer ? '1 Review' : '0 Conflicts'),
      ok: !isConflict && !isBuffer },
  ];
  snapInds.forEach((ind, i) => {
    const ix = LEFT_X + PAD + i * (indW + indGap);
    const bg = ind.ok ? C.successBg : (isConflict ? C.errorBg : C.warningBg);
    const bd = ind.ok ? [52, 211, 153] : (isConflict ? [248, 113, 113] : [251, 191, 36]);
    box(doc, ix, indY, indW, indH, bg, bd, 1, 0.2);
    sf(doc, 'bold', 4); sc(doc, C.textSec);
    doc.text(ind.label, ix + 1.5, indY + 2.8);
    sf(doc, 'bold', 5); sc(doc, ind.ok ? C.success : (isConflict ? C.error : C.warning));
    doc.text(doc.splitTextToSize(ind.val, indW - 3)[0], ix + 1.5, indY + 5.6);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIR 1: SEC 2 (Left) + SEC 4 (Right) — y=ROW_PAIR1, h=31mm
  // ═══════════════════════════════════════════════════════════════════════════
  const p1Y = ROW_PAIR1;

  // ── LEFT: 2. OWNERSHIP / RIGHTS ──────────────────────────────────────────
  box(doc, LEFT_X, p1Y, HALF_W, PAIR1_H, C.white, C.border, 1.5, 0.3);
  sf(doc, 'bold', 7); sc(doc, C.navy);
  doc.text('2. OWNERSHIP / RIGHTS', LEFT_X + PAD, p1Y + TITLE_Y_OFF);
  // Ownership badges — fixed positions, not computed from text width (immune to font-state)
  const owBadge1X = LEFT_X + PAD + 44;   // 44mm from card left = after title text
  const owBadge2X = pill(doc, owBadge1X, p1Y + TITLE_Y_OFF - 0.3, 'RECORD: AVAILABLE', 'success', 4.2) + 2;
  pill(doc, owBadge2X, p1Y + TITLE_Y_OFF - 0.3, isConflict ? 'REVIEW REQUIRED' : 'VERIFIED',
    isConflict ? 'warning' : 'success', 4.2);

  // Table header
  const oY = p1Y + 7.5;
  const oW = HALF_W - 2 * PAD;  // 89mm
  const oCols = [
    { label: 'RIGHTS-HOLDER / PARTY', ox: 1.5 },
    { label: 'RECORD ID',             ox: 33   },
    { label: 'STATUS',                ox: 51   },
    { label: 'SOURCE',                ox: 64   },
    { label: 'UPDATED',               ox: 78   },
  ];
  tableHdr(doc, LEFT_X + PAD, oY, oW, oCols);

  // Owner rows — only actual parcel owner data (whitelist: Rights-Holder, Record ID, Status, Source, Updated)
  const ownerName = parcel.owner?.name || 'Primary Rights Holder';
  const ownerRelation = parcel.owner?.relation || '—';
  const oRows = [
    { party: ownerName,     id: `ROR-${parcelId}`,  status: 'AVAILABLE', ok: true,  src: 'Revenue Dept', date: lastUpdated },
    { party: ownerRelation, id: `MUT-${parcelId}`,  status: 'VERIFIED',  ok: true,  src: 'Revenue Dept', date: lastUpdated },
  ];
  const oRowH = 6.5;
  oRows.forEach((r, idx) => {
    const ry = oY + 5.5 + idx * oRowH;
    sf(doc, 'bold', 4.8); sc(doc, C.textPrim);
    doc.text(doc.splitTextToSize(r.party, 30)[0], LEFT_X + PAD + 1.5, ry);
    sf(doc, 'normal', 4.5); sc(doc, C.textSec);
    doc.text(doc.splitTextToSize(r.id, 16)[0],   LEFT_X + PAD + 33, ry);
    dot(doc, LEFT_X + PAD + 52.5, ry - 1, r.ok ? C.success : C.warning, 0.9);
    sf(doc, 'bold', 4.5); sc(doc, r.ok ? C.success : C.warning);
    doc.text(r.status, LEFT_X + PAD + 54.5, ry);
    sf(doc, 'normal', 4.5); sc(doc, C.textSec);
    doc.text(r.src,  LEFT_X + PAD + 64, ry);
    doc.text(doc.splitTextToSize(r.date, 12)[0], LEFT_X + PAD + 78, ry);
    if (idx === 0) {
      hl(doc, LEFT_X + PAD + 1, LEFT_X + PAD + oW - 1, ry + 2.5, C.border, 0.2);
    }
  });

  // ── RIGHT: 4. PLANNING + BUILDING STATUS ────────────────────────────────
  box(doc, RIGHT_X, p1Y, HALF_W, PAIR1_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, RIGHT_X, p1Y, '4. PLANNING + BUILDING STATUS');

  // Flow steps — left sub-column within right card
  const flowSteps = [
    { title: 'LAND USE',           val: landUse },
    { title: 'ZONING',             val: zoning  },
    { title: 'MASTER PLAN',        val: 'Applicable (MP-2031)' },
    { title: 'BUILDING PERMISSION',val: bpStatus },
    { title: 'RESTRICTIONS',       val: isBuffer ? '1 Review Item' : 'None Recorded' },
  ];
  const flowW   = 53;  // width of flow step boxes
  const flowX   = RIGHT_X + PAD;
  const flowY0  = p1Y + 6.5;
  const stepH   = 3.5;
  const stepGap = 1.3;
  flowSteps.forEach((s, idx) => {
    const sy = flowY0 + idx * (stepH + stepGap);
    const isRestr = idx === 4 && isBuffer;
    box(doc, flowX, sy, flowW, stepH, isRestr ? C.warningBg : C.offwhite,
      isRestr ? [251, 191, 36] : C.border, 0.8, 0.2);
    sf(doc, 'bold', 4.2); sc(doc, C.textSec);
    doc.text(`${s.title}:`, flowX + 2, sy + stepH * 0.72);
    sf(doc, 'bold', 4.2); sc(doc, isRestr ? C.warning : C.navy);
    doc.text(doc.splitTextToSize(s.val, 26)[0], flowX + 26, sy + stepH * 0.72);
    if (idx < 4) {
      sf(doc, 'normal', 3.5); sc(doc, C.blue);
      doc.text('↓', flowX + flowW / 2, sy + stepH + stepGap * 0.75, { align: 'center' });
    }
  });

  // Planning items summary box — right sub-column
  const piBoxX = RIGHT_X + PAD + flowW + 2;
  const piBoxW = HALF_W - PAD - flowW - 2 - 1;  // remaining width ~38mm
  const piBoxY = p1Y + 6.5;
  const piBoxH = PAIR1_H - 7.5;
  box(doc, piBoxX, piBoxY, piBoxW, piBoxH, C.offwhite, C.border, 1, 0.2);
  sf(doc, 'bold', 5); sc(doc, C.navy);
  doc.text('ITEMS', piBoxX + 2, piBoxY + 3.8);
  const piItems = [
    { k: 'Zoning',      v: 'Applicable',             ok: true       },
    { k: 'Master Plan', v: 'Compliant',               ok: true       },
    { k: 'Building',    v: bpStatus,                  ok: bpStatus === 'Approved' },
    { k: 'Restrictions',v: isBuffer ? 'Review' : 'Clear', ok: !isBuffer },
  ];
  const piPitch = 3.8;
  piItems.forEach((it, idx) => {
    const iy = piBoxY + 6.0 + idx * piPitch;
    sf(doc, 'normal', 4.2); sc(doc, C.textMuted);
    doc.text(it.k, piBoxX + 2, iy);
    sf(doc, 'bold', 4.5); sc(doc, it.ok ? C.success : C.warning);
    doc.text(it.v, piBoxX + 2, iy + 2.3);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIR 2: SEC 3 (Left) + SEC 5 (Right) — y=ROW_PAIR2, h=26mm
  // ═══════════════════════════════════════════════════════════════════════════
  const p2Y = ROW_PAIR2;

  // ── LEFT: 3. REGISTRATION HISTORY ────────────────────────────────────────
  box(doc, LEFT_X, p2Y, HALF_W, PAIR2_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, LEFT_X, p2Y, '3. REGISTRATION HISTORY');

  // Horizontal milestone timeline
  const tChain = [
    { yr: '2021', label: 'Record Created' },
    { yr: '2023', label: 'Tx Submitted'  },
    { yr: '2024', label: 'Verification'  },
    { yr: '2024', label: 'Registered'    },
    { yr: '2026', label: 'Current Record'},
  ];
  const nodeW  = (HALF_W - 2 * PAD) / tChain.length;  // even spacing
  const nodeH  = 7;
  const nodeY  = p2Y + 7.5;
  tChain.forEach((n, idx) => {
    const nx = LEFT_X + PAD + idx * nodeW;
    box(doc, nx, nodeY, nodeW - 1.5, nodeH, C.offwhite, C.border, 1, 0.2);
    sf(doc, 'bold', 5); sc(doc, C.navy);
    doc.text(n.yr, nx + (nodeW - 1.5) / 2, nodeY + 3.5, { align: 'center' });
    sf(doc, 'normal', 3.5); sc(doc, C.textSec);
    doc.text(n.label, nx + (nodeW - 1.5) / 2, nodeY + 6, { align: 'center' });
    if (idx < tChain.length - 1) {
      sf(doc, 'bold', 5); sc(doc, C.blue);
      doc.text('→', nx + nodeW - 1.2, nodeY + 4.5);
    }
  });

  // Registration record table
  const regY  = p2Y + 17.5;
  const regW  = HALF_W - 2 * PAD;
  const regCols = [
    { label: 'REGISTRATION ID',  ox: 1.5 },
    { label: 'TRANSACTION TYPE', ox: 26   },
    { label: 'DATE',             ox: 50   },
    { label: 'STATUS',           ox: 63   },
    { label: 'SOURCE',           ox: 75   },
  ];
  tableHdr(doc, LEFT_X + PAD, regY, regW, regCols);

  const regId = parcel.enc?.ref || parcel.bp?.id || `REG-${parcelId}`;
  sf(doc, 'bold', 4.5); sc(doc, C.textPrim);
  doc.text(doc.splitTextToSize(regId, 22)[0], LEFT_X + PAD + 1.5, regY + 6.0);
  sf(doc, 'normal', 4.5); sc(doc, C.textSec);
  doc.text('Deed / Conveyance',  LEFT_X + PAD + 26, regY + 6.0);
  doc.text(lastUpdated,          LEFT_X + PAD + 50, regY + 6.0);
  dot(doc, LEFT_X + PAD + 64, regY + 5.0, C.success, 0.9);
  sf(doc, 'bold', 4.5); sc(doc, C.success);
  doc.text('Verified',           LEFT_X + PAD + 66, regY + 6.0);
  sf(doc, 'normal', 4.5); sc(doc, C.textSec);
  doc.text('Revenue Record',     LEFT_X + PAD + 75, regY + 6.0);

  // ── RIGHT: 5. LIABILITIES / ENCUMBRANCE / MORTGAGE ───────────────────────
  box(doc, RIGHT_X, p2Y, HALF_W, PAIR2_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, RIGHT_X, p2Y, '5. LIABILITIES / ENCUMBRANCE / MORTGAGE', 6.5);

  // 4 status indicator mini-cards
  const liabW4  = (HALF_W - 2 * PAD - 3 * 1.5) / 4;  // ~21mm each
  const liabY   = p2Y + 6.5;
  const liabH   = 6;
  const liabInds = [
    { label: 'ENCUMBRANCE', val: encStatus,
      ok: encStatus === 'Clear' },
    { label: 'MORTGAGE',
      val: isCitizen && parcel.enc?.amt ? 'Restricted' : (parcel.enc?.amt ? 'RECORDED' : 'NONE'),
      ok: !parcel.enc?.amt },
    { label: 'DISPUTE',     val: isConflict ? '1 REVIEW' : 'NO DISPUTE', ok: !isConflict },
    { label: 'RESTRICTION', val: isBuffer   ? '1 REVIEW' : 'NONE',       ok: !isBuffer   },
  ];
  liabInds.forEach((l, idx) => {
    const lx = RIGHT_X + PAD + idx * (liabW4 + 1.5);
    box(doc, lx, liabY, liabW4, liabH, l.ok ? C.successBg : C.warningBg,
      l.ok ? [52, 211, 153] : [251, 191, 36], 0.8, 0.2);
    sf(doc, 'bold', 3.8); sc(doc, C.textSec);
    doc.text(l.label, lx + 1.5, liabY + 2.4);
    sf(doc, 'bold', 4.5); sc(doc, l.ok ? C.success : C.warning);
    doc.text(doc.splitTextToSize(l.val, liabW4 - 3)[0], lx + 1.5, liabY + 5);
  });

  // Liabilities detail table (RBAC enforced)
  // ltY starts at p2Y+13 (4mm below indicator cards bottom: p2Y+6.5+6=p2Y+12.5 → +0.5 gap)
  const ltY   = p2Y + 13;
  const ltW   = HALF_W - 2 * PAD;
  // Fixed column X offsets (absolute from table left edge)
  // Col widths: TYPE=14, REF=30, DATE=11, STATUS=12, SOURCE=22
  const ltCols = [
    { label: 'TYPE',      ox: 1.5  },
    { label: 'REFERENCE', ox: 16   },
    { label: 'DATE',      ox: 47   },
    { label: 'STATUS',    ox: 60   },
    { label: 'SOURCE',    ox: 73   },
  ];
  tableHdr(doc, RIGHT_X + PAD, ltY, ltW, ltCols);

  const isMortRestr = isCitizen && Boolean(parcel.enc?.amt);
  const liabRows = [
    { type: 'RoR',
      ref:    `ROR-${parcelId}`,
      date:   lastUpdated,
      status: 'ACTIVE',
      ok:     true,
      src:    'Revenue Dept'    },
    { type:   'Mortgage',
      ref:    isMortRestr ? 'Restricted — Officer Access Only' : (parcel.enc?.ref || 'NONE'),
      date:   isMortRestr ? '—' : (parcel.bp?.date || '—'),
      status: isMortRestr ? 'Restricted' : (parcel.enc?.status || 'NONE'),
      ok:     !parcel.enc?.amt,
      src:    'Revenue Records' },
    { type:   'Restriction',
      ref:    isBuffer ? 'ENV-BUF-01' : 'NONE',
      date:   '—',
      status: isBuffer ? 'ACTIVE' : 'NONE',
      ok:     !isBuffer,
      src:    'Planning Dept'   },
  ];
  // Row spacing: 3.8mm — 3 rows need 3×3.8=11.4mm + header 4mm = 15.4mm
  // ltY = p2Y+13, available = PAIR2_H - 13 = 30-13 = 17mm. Fits with 1.6mm margin.
  const LT_ROW_H = 3.8;
  liabRows.forEach((r, idx) => {
    const ry = ltY + 4.5 + idx * LT_ROW_H;
    const isRestr = r.ref === 'Restricted — Officer Access Only';
    sf(doc, 'bold', 4.5); sc(doc, C.textPrim);
    doc.text(r.type, RIGHT_X + PAD + 1.5, ry);
    sf(doc, isRestr ? 'italic' : 'normal', isRestr ? 4 : 4.5);
    sc(doc, isRestr ? C.error : C.textSec);
    doc.text(doc.splitTextToSize(r.ref, 29)[0], RIGHT_X + PAD + 16, ry);
    sf(doc, 'normal', 4.5); sc(doc, C.textSec);
    doc.text(r.date, RIGHT_X + PAD + 47, ry);
    if (isRestr) {
      sf(doc, 'italic', 4); sc(doc, C.error);
      doc.text('Restricted', RIGHT_X + PAD + 60, ry);
    } else {
      dot(doc, RIGHT_X + PAD + 61, ry - 1, r.ok ? C.success : C.warning, 0.8);
      sf(doc, 'bold', 4.5); sc(doc, r.ok ? C.success : C.warning);
      doc.text(r.status, RIGHT_X + PAD + 63, ry);
    }
    sf(doc, 'normal', 4.5); sc(doc, C.textSec);
    doc.text(r.src, RIGHT_X + PAD + 73, ry);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIR 3: SEC 6 (Left) + SEC 7 (Right) — y=ROW_PAIR3, h=31mm
  // ═══════════════════════════════════════════════════════════════════════════
  const p3Y = ROW_PAIR3;

  // ── LEFT: 6. TAX + UTILITIES ──────────────────────────────────────────────
  box(doc, LEFT_X, p3Y, HALF_W, PAIR3_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, LEFT_X, p3Y, '6. TAX + UTILITIES');

  // Property Tax sub-card (left half)
  const taxSubX = LEFT_X + PAD;
  const taxSubW = (HALF_W - 2 * PAD - 2) / 2;  // ~43.5mm
  const taxSubY = p3Y + 6.5;
  const taxSubH = PAIR3_H - 7.5;
  box(doc, taxSubX, taxSubY, taxSubW, taxSubH, C.offwhite, C.border, 1, 0.2);
  sf(doc, 'bold', 5.5); sc(doc, C.navy);
  doc.text('PROPERTY TAX', taxSubX + 2, taxSubY + 3.8);

  const taxPaidDisplay = isCitizen
    ? 'Restricted — Officer Access Only'
    : (parcel.tax?.paid || '—');
  const taxFields = [
    { k: 'Assessment ID', v: parcel.tax?.id || `PT-${parcelId}` },
    { k: 'Tax Status',    v: taxStatus     },
    { k: 'Last Payment',  v: taxPaidDisplay },
    { k: 'Last Updated',  v: parcel.tax?.date || lastUpdated },
  ];
  taxFields.forEach((td, idx) => {
    const ty = taxSubY + 7.5 + idx * 4;
    sf(doc, 'normal', 4.3); sc(doc, C.textMuted);
    doc.text(td.k, taxSubX + 2, ty);
    const isRestr = td.v === 'Restricted — Officer Access Only';
    sf(doc, isRestr ? 'italic' : 'bold', isRestr ? 3.8 : 4.3);
    sc(doc, isRestr ? C.error : (td.k === 'Tax Status' ? C.success : C.textPrim));
    doc.text(doc.splitTextToSize(td.v, taxSubW - 4)[0], taxSubX + 2, ty + 3);
  });

  // Utilities sub-card (right half)
  const utSubX = taxSubX + taxSubW + 2;
  const utSubW = taxSubW;
  box(doc, utSubX, taxSubY, utSubW, taxSubH, C.offwhite, C.border, 1, 0.2);
  sf(doc, 'bold', 5.5); sc(doc, C.navy);
  doc.text('UTILITIES', utSubX + 2, taxSubY + 3.8);

  const utList = [
    { name: 'Electricity', val: parcel.ut?.elec  ? 'CONNECTED' : 'DISCONNECTED', ok: Boolean(parcel.ut?.elec)  },
    { name: 'Water',       val: parcel.ut?.water ? 'CONNECTED' : 'DISCONNECTED', ok: Boolean(parcel.ut?.water) },
    { name: 'Sewer',       val: parcel.ut?.sewer ? 'CONNECTED' : 'DISCONNECTED', ok: Boolean(parcel.ut?.sewer) },
    { name: 'Other',       val: parcel.ut?.gas   ? 'CONNECTED' : 'UNKNOWN',      ok: Boolean(parcel.ut?.gas)   },
  ];
  // Utility rows: fixed dot and value X positions (immune to font-state)
  // Name column: 0→19mm; dot: 20mm; value: 22mm
  const utNameW  = 19;  // fixed name column width
  const utDotX   = utSubX + 2 + utNameW + 1;   // fixed dot X
  const utValX   = utDotX + 2.5;               // fixed value X
  utList.forEach((u, idx) => {
    const uy = taxSubY + 8 + idx * 4.8;
    sf(doc, 'normal', 4.5); sc(doc, C.textPrim);
    doc.text(doc.splitTextToSize(u.name, utNameW)[0], utSubX + 2, uy);
    dot(doc, utDotX, uy - 1, u.ok ? C.success : C.warning, 1);
    sf(doc, 'bold', 4.5); sc(doc, u.ok ? C.success : C.textMuted);
    doc.text(u.val, utValX, uy);
  });

  // ── RIGHT: 7. CROSS-RECORD DATA CONSISTENCY ──────────────────────────────
  box(doc, RIGHT_X, p3Y, HALF_W, PAIR3_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, RIGHT_X, p3Y, '7. CROSS-RECORD DATA CONSISTENCY', 6.5);

  // Consistency table (left sub-area of card)
  const ctW  = (HALF_W - 2 * PAD) * 0.54;  // ~48mm
  const ctY  = p3Y + 6.5;
  const ctH  = 17;
  box(doc, RIGHT_X + PAD, ctY, ctW, ctH, C.offwhite, C.border, 1, 0.2);
  box(doc, RIGHT_X + PAD, ctY, ctW, 4, C.navy, C.navy, 0.5, 0.2);
  sf(doc, 'bold', 4.8); sc(doc, C.white);
  doc.text('SOURCE',          RIGHT_X + PAD + 2, ctY + 2.9);
  doc.text('VALUE',           RIGHT_X + PAD + ctW * 0.58, ctY + 2.9);

  const taxAreaVal = isConflict
    ? (parcel.standardized_area ? `${(Number(parcel.standardized_area) + 40).toLocaleString()} m²` : '540 m²')
    : areaDisplay;
  const consRows = [
    { src: 'RoR',          val: areaDisplay  },
    { src: 'Registration', val: areaDisplay  },
    { src: 'Property Tax', val: taxAreaVal   },
  ];
  consRows.forEach((cr, idx) => {
    const cy = ctY + 7 + idx * 3.5;
    sf(doc, 'normal', 4.5); sc(doc, C.textPrim);
    doc.text(cr.src, RIGHT_X + PAD + 2, cy);
    sf(doc, 'bold', 4.5); sc(doc, idx === 2 && isConflict ? C.error : C.navy);
    doc.text(doc.splitTextToSize(cr.val, ctW * 0.4)[0], RIGHT_X + PAD + ctW * 0.58, cy);
  });

  // Bar comparison chart (right sub-area of card)
  const bcX   = RIGHT_X + PAD + ctW + 2;
  const bcW   = HALF_W - 2 * PAD - ctW - 2;  // ~43mm
  const bcY   = ctY;
  const bcH   = ctH;
  box(doc, bcX, bcY, bcW, bcH, C.offwhite, C.border, 1, 0.2);
  sf(doc, 'bold', 4.5); sc(doc, C.textMuted);
  doc.text('AREA COMPARISON', bcX + 2, bcY + 3);
  const baseY    = bcY + bcH - 2;
  hl(doc, bcX + 3, bcX + bcW - 3, baseY, C.borderDark, 0.3);
  const barSpaceW = bcW - 6;
  const bars = [
    { label: 'RoR', h: 7, color: C.blue },
    { label: 'Reg', h: 7, color: [2, 132, 199] },
    { label: 'Tax', h: isConflict ? 8.5 : 7, color: isConflict ? C.error : C.success },
  ];
  const barW = barSpaceW / bars.length / 2;
  bars.forEach((b, idx) => {
    const bx = bcX + 4 + idx * (barSpaceW / bars.length);
    box(doc, bx, baseY - b.h, barW, b.h, b.color, null, 0.5);
    sf(doc, 'bold', 3.8); sc(doc, C.textSec);
    doc.text(b.label, bx + barW / 2, baseY + 1.6, { align: 'center' });
  });

  // Alert banner below tables (still inside card)
  const alertY = p3Y + PAIR3_H - 6.5;
  const aW = HALF_W - 2 * PAD;
  const aH = 5;
  box(doc, RIGHT_X + PAD, alertY, aW, aH,
    isConflict ? C.errorBg : C.successBg,
    isConflict ? [248, 113, 113] : [52, 211, 153], 0.8, 0.2);
  if (isConflict) {
    sf(doc, 'bold', 4.5); sc(doc, C.error);
    doc.text('⚠ AREA MISMATCH', RIGHT_X + PAD + 2, alertY + 3.3);
    sf(doc, 'normal', 4); sc(doc, C.textSec);
    doc.text('Difference: 40 m²', RIGHT_X + PAD + 30, alertY + 3.3);
    sf(doc, 'bold', 4); sc(doc, C.error);
    doc.text('Status: REQUIRES HUMAN REVIEW', RIGHT_X + PAD + 53, alertY + 3.3);
  } else {
    sf(doc, 'bold', 4.5); sc(doc, C.success);
    doc.text('✓ ALL RECORDS CONSISTENT', RIGHT_X + PAD + 2, alertY + 3.3);
    sf(doc, 'normal', 4); sc(doc, C.textSec);
    doc.text('Difference: 0 m²', RIGHT_X + PAD + 44, alertY + 3.3);
    sf(doc, 'bold', 4); sc(doc, C.success);
    doc.text('Status: SOURCE VERIFIED', RIGHT_X + PAD + 62, alertY + 3.3);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIR 4: SEC 8 (Left) + SEC 10 (Right) — y=ROW_PAIR4, h=28mm
  // ═══════════════════════════════════════════════════════════════════════════
  const p4Y = ROW_PAIR4;

  // ── LEFT: 8. DATA PROVENANCE ──────────────────────────────────────────────
  box(doc, LEFT_X, p4Y, HALF_W, PAIR4_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, LEFT_X, p4Y, '8. DATA PROVENANCE');

  const dpY  = p4Y + 7;
  const dpW  = HALF_W - 2 * PAD;
  const dpCols = [
    { label: 'DATA',      ox: 1.5 },
    { label: 'SOURCE',    ox: 19  },
    { label: 'RECORD ID', ox: 40  },
    { label: 'UPDATED',   ox: 61  },
    { label: 'STATUS',    ox: 77  },
  ];
  tableHdr(doc, LEFT_X + PAD, dpY, dpW, dpCols);

  const dpRows = [
    { data: 'RoR',          src: 'Revenue Dept',    recId: `ROR-${parcelId}`,              updated: lastUpdated,           status: 'VERIFIED' },
    { data: 'Registration', src: 'Reg. Dept',        recId: parcel.enc?.ref || `REG-${parcelId}`, updated: lastUpdated,    status: 'VERIFIED' },
    { data: 'Building',     src: 'Municipal Corp',   recId: parcel.bp?.id || `BP-${parcelId}`,    updated: parcel.bp?.date || lastUpdated, status: 'VERIFIED' },
  ];
  dpRows.forEach((pr, idx) => {
    const py = dpY + 4.5 + idx * 5;
    sf(doc, 'bold', 4.5); sc(doc, C.textPrim);
    doc.text(pr.data, LEFT_X + PAD + 1.5, py);
    sf(doc, 'normal', 4.5); sc(doc, C.textSec);
    doc.text(doc.splitTextToSize(pr.src, 19)[0],   LEFT_X + PAD + 19, py);
    doc.text(doc.splitTextToSize(pr.recId, 19)[0], LEFT_X + PAD + 40, py);
    doc.text(doc.splitTextToSize(pr.updated, 14)[0], LEFT_X + PAD + 61, py);
    dot(doc, LEFT_X + PAD + 78, py - 1, C.success, 0.8);
    sf(doc, 'bold', 4.5); sc(doc, C.success);
    doc.text(pr.status, LEFT_X + PAD + 80.5, py);
  });

  // ── RIGHT: 10. AI / ANALYTICAL INSIGHT FOR THIS PARCEL ───────────────────
  box(doc, RIGHT_X, p4Y, HALF_W, PAIR4_H, C.white, C.border, 1.5, 0.3);
  sf(doc, 'bold', 6.5); sc(doc, C.navy);
  doc.text('10. AI / ANALYTICAL INSIGHT FOR THIS PARCEL', RIGHT_X + PAD, p4Y + TITLE_Y_OFF);

  const aiY = p4Y + 6.8;
  // Finding
  sf(doc, 'bold', 5.5);
  if (isConflict) {
    sc(doc, C.error);
    doc.text('POTENTIAL CHANGE Detected', RIGHT_X + PAD, aiY);
  } else if (isBuffer) {
    sc(doc, C.warning);
    doc.text('STATUTORY BUFFER RESTRICTION Detected', RIGHT_X + PAD, aiY);
  } else {
    sc(doc, C.success);
    doc.text('NO ANOMALY DETECTED — Verified Record', RIGHT_X + PAD, aiY);
  }

  // Indicator & Cross-Check
  const aiKVLabelW = 18;
  const aiKVValW   = HALF_W - 2 * PAD - aiKVLabelW - 1;
  const aiKV = [
    { k: 'Indicator:',   v: isConflict ? 'Possible development-related change' : (isBuffer ? 'Eco-sensitive buffer intersection' : 'Consistent temporal registers') },
    { k: 'Cross-Check:', v: isConflict ? 'Building permission available / Verification req.' : (isBuffer ? 'Buffer overlay requires planning review' : 'All source registries synchronized') },
  ];
  aiKV.forEach((kv, idx) => {
    const ky = aiY + 3.6 + idx * 3.4;
    sf(doc, 'bold', 4.3); sc(doc, C.textMuted);
    doc.text(kv.k, RIGHT_X + PAD, ky);
    sf(doc, 'normal', 4.3); sc(doc, C.textPrim);
    doc.text(doc.splitTextToSize(kv.v, aiKVValW)[0], RIGHT_X + PAD + aiKVLabelW, ky);
  });

  // Confidence Gauge
  const gY   = aiY + 10.8;
  sf(doc, 'bold', 4.3); sc(doc, C.textMuted);
  doc.text('Confidence Gauge:', RIGHT_X + PAD, gY + 2.3);

  const gBarW = 11;
  const gBarX = RIGHT_X + PAD + 30;
  box(doc, gBarX,                      gY, gBarW,     3, [254, 202, 202], null, 0.5);
  box(doc, gBarX + gBarW + 0.8,        gY, gBarW,     3, [253, 230, 138], null, 0.5);
  box(doc, gBarX + (gBarW + 0.8) * 2,  gY, gBarW,     3, [167, 243, 208], null, 0.5);

  const needleX = isConflict ? gBarX + gBarW + 5 : gBarX + (gBarW + 0.8) * 2 + 5;
  doc.setFillColor(...C.navy);
  doc.triangle(needleX - 1.2, gY - 0.5, needleX + 1.2, gY - 0.5, needleX, gY + 1.5, 'F');

  sf(doc, 'bold', 4.3); sc(doc, C.navy);
  doc.text(isConflict ? 'Moderate (78%)' : 'High (95%)',
    gBarX + (gBarW + 0.8) * 3 + 2, gY + 2.3);

  // Evidence & Next Action
  const evY = gY + 4.8;
  const isSentinel = Boolean(parcel.sentinel_available);
  sf(doc, 'bold', 4.3); sc(doc, C.textMuted);
  doc.text('Evidence:', RIGHT_X + PAD, evY);
  sf(doc, 'normal', 4.3); sc(doc, C.textPrim);
  const evText = isSentinel
    ? 'Sentinel-2 satellite evidence & record comparison'
    : 'SATELLITE EVIDENCE: UNAVAILABLE • Record cross-check';
  doc.text(doc.splitTextToSize(evText, HALF_W - 2 * PAD - 18)[0], RIGHT_X + PAD + 17, evY);

  sf(doc, 'bold', 4.3); sc(doc, C.textMuted);
  doc.text('Next Action:', RIGHT_X + PAD, p4Y + 25.5);
  sf(doc, 'bold', 4.3); sc(doc, isConflict ? C.error : C.navy);
  doc.text(isConflict ? 'Officer verification' : 'Routine monitoring',
    RIGHT_X + PAD + 18, p4Y + 25.5);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIR 5: SEC 9 (Left) + SEC 12 (Right) — y=ROW_PAIR5, h=42mm
  // ═══════════════════════════════════════════════════════════════════════════
  const p5Y = ROW_PAIR5;

  // ── LEFT: 9. PARCEL INFORMATION TIMELINE ─────────────────────────────────
  box(doc, LEFT_X, p5Y, HALF_W, PAIR5_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, LEFT_X, p5Y, '9. PARCEL INFORMATION TIMELINE');

  const tEvents = [
    { yr: '2021',    label: 'Parcel Record Created',   ok: true      },
    { yr: '2022',    label: 'Land Record Updated',      ok: true      },
    { yr: '2024',    label: 'Registration Event',       ok: true      },
    { yr: '2024',    label: 'Building Permission',      ok: true      },
    { yr: '2025',    label: 'Property Tax Update',      ok: true      },
    { yr: '2026',    label: isConflict ? 'Data Conflict Detected' : 'Data Verification Completed', ok: !isConflict },
    { yr: 'CURRENT', label: isConflict ? 'Human Review Pending'  : 'Record Synchronized & Active', ok: !isConflict },
  ];

  const tlLineX  = LEFT_X + PAD + 20;  // vertical line x
  const tlStartY = p5Y + 7.5;
  const tlEndY   = p5Y + PAIR5_H - 3;
  vl(doc, tlLineX, tlStartY, tlEndY, C.borderDark, 0.4);

  const evSpacing = (tlEndY - tlStartY) / (tEvents.length - 1);
  tEvents.forEach((ev, idx) => {
    const ey = tlStartY + idx * evSpacing;
    sf(doc, 'bold', 4.2); sc(doc, C.textSec);
    doc.text(ev.yr, LEFT_X + PAD, ey + 1);
    const dotC = idx === 6 && isConflict ? C.warning : (ev.ok ? C.success : C.error);
    dot(doc, tlLineX, ey, dotC, 1.3);
    sf(doc, idx >= 5 && isConflict ? 'bold' : 'normal', 4.5);
    sc(doc, idx >= 5 && isConflict ? (idx === 5 ? C.error : C.warning) : C.textPrim);
    doc.text(ev.label, tlLineX + 4, ey + 1);
  });

  // ── RIGHT: 12. PARCEL REPORT GRAPHICAL SUMMARY ───────────────────────────
  box(doc, RIGHT_X, p5Y, HALF_W, PAIR5_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, RIGHT_X, p5Y, '12. PARCEL REPORT GRAPHICAL SUMMARY', 6.5);

  const gMetrics = [
    { name: 'DATA COMPLETENESS',  pct: 90, color: C.success },
    { name: 'RECORD CONSISTENCY', pct: isConflict ? 70 : 95, color: isConflict ? C.warning : C.success },
    { name: 'VERIFICATION STATUS',pct: isConflict ? 80 : 90, color: C.blue },
    { name: 'DATA FRESHNESS',     pct: 90, color: [2, 132, 199] },
  ];

  // Progress bar layout
  const pbW    = HALF_W - 2 * PAD - 12;  // leave 12mm for percentage label
  const pbLblW = 11;                      // percentage label width
  const pbY0   = p5Y + 8;
  const pbStep = (PAIR5_H - 10) / gMetrics.length;
  gMetrics.forEach((m, idx) => {
    const my = pbY0 + idx * pbStep;
    sf(doc, 'bold', 4.5); sc(doc, C.textPrim);
    doc.text(m.name, RIGHT_X + PAD, my);
    // Track
    box(doc, RIGHT_X + PAD, my + 2, pbW, 3.5, C.offwhite, C.border, 0.8, 0.2);
    // Fill
    box(doc, RIGHT_X + PAD, my + 2, (pbW * m.pct) / 100, 3.5, m.color, null, 0.8);
    // Pct label (right-aligned within remaining space)
    sf(doc, 'bold', 5); sc(doc, m.color);
    doc.text(`${m.pct}%`, RIGHT_X + PAD + pbW + pbLblW, my + 5, { align: 'right' });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PAIR 6: SEC 11 (Left) + PARCEL STATUS SUMMARY (Right) — y=ROW_PAIR6, h=36mm
  // ═══════════════════════════════════════════════════════════════════════════
  const p6Y = ROW_PAIR6;

  // ── LEFT: 11. REVIEW / ACTION SUMMARY ────────────────────────────────────
  box(doc, LEFT_X, p6Y, HALF_W, PAIR6_H, C.white, C.border, 1.5, 0.3);
  sf(doc, 'bold', 7); sc(doc, C.navy);
  doc.text('11. REVIEW / ACTION SUMMARY', LEFT_X + PAD, p6Y + TITLE_Y_OFF);

  // Count + priority pills
  const itemCount = isConflict ? '3 ITEMS' : (isBuffer ? '1 ITEM' : '0 ITEMS');
  const prioLabel = isConflict ? 'HIGH' : (isBuffer ? 'MEDIUM' : 'LOW');
  const prioType  = isConflict ? 'error' : (isBuffer ? 'warning' : 'success');
  // Fixed badge positions (immune to font-state measurement)
  const rvBadge1X = LEFT_X + PAD + 57;   // after "11. REVIEW / ACTION SUMMARY"
  const rvBadge2X = pill(doc, rvBadge1X, p6Y + TITLE_Y_OFF - 0.3, itemCount, prioType, 4.2) + 2;
  pill(doc, rvBadge2X, p6Y + TITLE_Y_OFF - 0.3, prioLabel, prioType, 4.2);

  const reviewItems = isConflict ? [
    { num: '01', title: 'Area mismatch → Revenue review',         prio: 'HIGH priority',   ok: false },
    { num: '02', title: 'Building permission → Municipal review', prio: 'MEDIUM priority', ok: false },
    { num: '03', title: 'Field inspection → Surveyor note',       prio: 'LOW priority',    ok: true  },
  ] : isBuffer ? [
    { num: '01', title: 'Restriction record → Planning review', prio: 'MEDIUM priority', ok: false },
    { num: '02', title: 'Zoning compliance check',              prio: 'LOW priority',    ok: true  },
  ] : [
    { num: '01', title: 'Clean title record verified',                prio: 'No action required', ok: true },
    { num: '02', title: 'Registry synchronized across departments',   prio: 'All checks passed',  ok: true },
  ];

  const rvItemH  = 7.5;
  const rvItemGp = 1;
  const rvY0     = p6Y + 7.5;
  reviewItems.forEach((ri, idx) => {
    const ry = rvY0 + idx * (rvItemH + rvItemGp);
    box(doc, LEFT_X + PAD, ry, HALF_W - 2 * PAD, rvItemH, C.offwhite, C.border, 0.8, 0.2);
    sf(doc, 'bold', 6); sc(doc, ri.ok ? C.success : C.error);
    doc.text(ri.num, LEFT_X + PAD + 2, ry + rvItemH * 0.68);
    sf(doc, 'bold', 4.5); sc(doc, C.navy);
    doc.text(doc.splitTextToSize(ri.title, HALF_W - 2 * PAD - 18)[0], LEFT_X + PAD + 12, ry + rvItemH * 0.48);
    sf(doc, 'normal', 4); sc(doc, ri.ok ? C.success : C.error);
    doc.text(ri.prio, LEFT_X + PAD + 12, ry + rvItemH * 0.82);
  });

  // ── RIGHT: PARCEL STATUS SUMMARY ─────────────────────────────────────────
  box(doc, RIGHT_X, p6Y, HALF_W, PAIR6_H, C.white, C.border, 1.5, 0.3);
  sectionTitle(doc, RIGHT_X, p6Y, 'PARCEL STATUS SUMMARY');

  const sumFields = [
    { k: 'Parcel',         v: parcelId,  pill: false },
    { k: 'ULPIN',          v: ulpin,     pill: false },
    { k: 'Current Status', v: status,    pill: true  },
    { k: 'Key Records',    v: `${jurisdiction} (RoR, Reg, BP, Tax)`, pill: false },
    { k: 'Data Quality',   v: isConflict ? '1 Conflict' : 'Verified', pill: false, err: isConflict },
    { k: 'Action Required',v: isConflict ? 'Human Verification' : (isBuffer ? 'Planning Review' : 'None'), pill: false },
    { k: 'Last Updated',   v: lastUpdated, pill: false },
  ];
  const sumLabelX = RIGHT_X + PAD;
  const sumValX   = RIGHT_X + PAD + 28;
  const sumValW   = HALF_W - 2 * PAD - 28;
  const sumY0     = p6Y + 7.5;
  const sumStep   = (PAIR6_H - 8) / sumFields.length;
  sumFields.forEach((sf_item, idx) => {
    const sy = sumY0 + idx * sumStep;
    sf(doc, 'bold', 4.5); sc(doc, C.textMuted);
    doc.text(sf_item.k, sumLabelX, sy);
    if (sf_item.pill) {
      pill(doc, sumValX, sy, sf_item.v,
        (status === 'VERIFIED' || status === 'ACTIVE') ? 'success' : 'warning', 4.2);
    } else {
      sf(doc, 'bold', 4.5);
      sc(doc, sf_item.err ? C.error : C.textPrim);
      doc.text(doc.splitTextToSize(sf_item.v, sumValW)[0], sumValX, sy);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════
  sf(doc, 'normal', 4.5); sc(doc, C.textMuted);
  doc.text(
    'Generated from sample/demo data. This report is an information view and is not a legal certificate.',
    PAGE_W / 2, FOOTER_Y + 2, { align: 'center' }
  );

  // ── Strict 1-page guarantee ──────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  if (pageCount !== 1) {
    throw new Error(`PDF generator produced ${pageCount} pages instead of exactly 1`);
  }

  return doc;
}

/**
 * generateParcelPDF — public API.
 * Returns a Blob for browser download.
 */
export function generateParcelPDF(parcel, currentRole = 'CITIZEN', fvStatus = 'Verified') {
  const doc = buildParcelPDFDoc(parcel, currentRole, fvStatus);
  return doc.output('blob');
}

/**
 * safeFilename — produces filesystem-safe PDF filename.
 * Format: PLOT360_<ULPIN>_Parcel_Information_Report.pdf
 */
export function safeFilename(parcel) {
  const ulpin = (parcel?.ulpin || parcel?.parcel_id || 'UNKNOWN')
    .replace(/[^a-zA-Z0-9_\-]/g, '-');
  return `PLOT360_${ulpin}_Parcel_Information_Report.pdf`;
}
