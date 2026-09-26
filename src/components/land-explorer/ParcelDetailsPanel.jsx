import React, { useState } from 'react';
import {
  FileText,
  X,
  Building,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  ExternalLink,
  Zap,
  Droplet,
  Flame,
  Wifi,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateParcelPDF, safeFilename } from '../../utils/generateParcelPDF';

export default function ParcelDetailsPanel() {
  const {
    activeParcel,
    selectParcel,
    fieldVerificationStatus,
    setEvidenceModalOpen,
    setFieldModalOpen,
    setUnifiedReportOpen,
    currentLocation,
    parcelDetailTab,
    setParcelDetailTab,
    currentRole
  } = useApp();

  const activeTab = parcelDetailTab || 'overview';
  const setActiveTab = setParcelDetailTab;

  // Export state for panel PDF button
  const [panelExportState, setPanelExportState] = useState('idle');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'records', label: 'Land Records' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'encumbrance', label: 'Encumbrance' },
    { id: 'taxation', label: 'Taxation' },
    { id: 'utilities', label: 'Utilities' },
    { id: 'ai', label: 'AI Insights' }
  ];

  // ── No parcel selected state ──────────────────────────────────────────────
  if (!activeParcel) {
    return (
      <div className="parcel-panel-container">
        {/* Header placeholder */}
        <div className="parcel-panel-header">
          <div className="panel-title-area">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <FileText size={18} />
            </div>
            <div className="panel-parcel-badge">
              <div className="panel-parcel-id">
                <span style={{ color: 'var(--text-secondary)' }}>No parcel selected</span>
              </div>
              <div className="panel-ulpin" style={{ color: 'var(--text-muted)' }}>
                {currentLocation ? currentLocation.name : ''} — no demo cadastral data
              </div>
            </div>
          </div>
        </div>

        {/* Empty state message */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '32px 20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-card-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <MapPin size={24} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
            No parcel selected
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5 }}>
            {currentLocation && !currentLocation.hasDemoCadastral
              ? `No demo cadastral data configured for ${currentLocation.name}. Select a parcel from the map or switch to Chandigarh, Mohali, or Panchkula.`
              : 'Select any parcel from the cadastral map to inspect authoritative land records, approvals, and insights.'}
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: '11.5px', padding: '6px 14px', marginTop: '6px' }}
            onClick={() => selectParcel('P-1027')}
          >
            Load Sample Parcel (P-1027)
          </button>
        </div>
      </div>
    );
  }

  // Helper values with resilient multi-schema extraction
  const ownerName = activeParcel.owner?.name || 'Government of Punjab';
  const ownerRelation = activeParcel.owner?.relation || 's/o Harbhajan Singh';
  const ownerShare = activeParcel.owner?.share || '100%';
  const bpId = activeParcel.bp?.id || activeParcel.building_permission?.id || 'PJB/BP/2023/114';
  const bpStatus = activeParcel.bp?.status || activeParcel.building_permission?.status || 'Approved';
  const bpFloors = activeParcel.bp?.floors || activeParcel.building_permission?.floors || 'Restricted / Officer Access Only';
  const bpDate = activeParcel.bp?.date || activeParcel.building_permission?.date || '14 Nov 2023';

  const encStatus = activeParcel.enc?.status || activeParcel.encumbrance?.status || 'Clear';
  const encInst = activeParcel.enc?.inst || activeParcel.encumbrance?.institution || (encStatus === 'Active' ? 'Restricted / Officer Access Only' : 'Nil (No Charge)');
  const encAmt = activeParcel.enc?.amt || activeParcel.encumbrance?.amount || (encStatus === 'Active' ? 'Restricted / Officer Access Only' : '₹ 0.00');
  const encRef = activeParcel.enc?.ref || activeParcel.encumbrance?.reference || (encStatus === 'Active' ? 'Restricted / Officer Access Only' : 'N/A');

  const taxId = activeParcel.tax?.id || activeParcel.property_tax?.id || 'PT-CHD-2024-8902';
  const taxStatus = activeParcel.tax?.status || activeParcel.property_tax?.status || 'Paid';
  const taxPaid = activeParcel.tax?.paid || activeParcel.property_tax?.paid || activeParcel.property_tax?.amount_paid || 'Restricted / Officer Access Only';
  const taxDate = activeParcel.tax?.date || activeParcel.property_tax?.date || '28 Jun 2024';

  const utElec = activeParcel.ut?.elec || activeParcel.utilities?.electricity || 'Connected (Meter #99210)';
  const utWater = activeParcel.ut?.water || activeParcel.utilities?.water || 'Connected (Connection #4412)';
  const utSewer = activeParcel.ut?.sewer || activeParcel.utilities?.sewer || 'Connected & Audited';
  const utGas = activeParcel.ut?.gas || activeParcel.utilities?.gas || 'Available Nearby';

  return (
    <div className="parcel-panel-container">
      {/* Header */}
      <div className="parcel-panel-header">
        <div className="panel-title-area">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-card-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-accent-blue)'
            }}
          >
            <FileText size={18} />
          </div>
          <div className="panel-parcel-badge">
            <div className="panel-parcel-id">
              <span>{activeParcel.parcel_id}</span>
              <span className="status-pill-verified">✓ Verified</span>
            </div>
            <div className="panel-ulpin">ULPIN: <span className="font-mono" style={{ color: 'var(--brand-accent-cyan)', fontWeight: 600 }}>{activeParcel.ulpin}</span></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* PDF Export from panel header */}
          <button
            className="quick-action-btn"
            id="panel-export-pdf"
            disabled={panelExportState === 'generating'}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              opacity: panelExportState === 'generating' ? 0.7 : 1,
              cursor: panelExportState === 'generating' ? 'not-allowed' : 'pointer'
            }}
            title="Export PDF Parcel Report"
            onClick={async () => {
              if (panelExportState === 'generating') return;
              setPanelExportState('generating');
              try {
                const blob = generateParcelPDF(activeParcel, currentRole, fieldVerificationStatus);
                const filename = safeFilename(activeParcel);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setPanelExportState('done');
                setTimeout(() => setPanelExportState('idle'), 3000);
              } catch (err) {
                console.error('PDF export failed:', err);
                setPanelExportState('error');
                setTimeout(() => setPanelExportState('idle'), 4000);
              }
            }}
          >
            {panelExportState === 'generating' ? (
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
            ) : panelExportState === 'done' ? (
              <CheckCircle2 size={11} style={{ color: 'var(--status-success)' }} />
            ) : (
              <Download size={11} />
            )}
            <span>
              {panelExportState === 'generating' ? 'PDF…' : panelExportState === 'done' ? 'Done' : 'PDF'}
            </span>
          </button>
          <button
            className="panel-close-btn"
            title="Deselect parcel and close panel"
            onClick={() => selectParcel(null)}
            aria-label="Close details"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="parcel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`parcel-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="panel-scroll-body">
        {/* ── TAB 1: OVERVIEW ──────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Top 3 Quick Status Cards */}
            <div className="quick-status-grid">
              <div className="quick-status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Ownership</span>
                  <span className="status-badge-inline green">Approved</span>
                </div>
                <div className="status-card-val" title={ownerName}>
                  {ownerName}
                </div>
              </div>

              <div className="quick-status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Building Permission</span>
                  <span className={`status-badge-inline ${bpStatus === 'Approved' ? 'green' : 'amber'}`}>
                    {bpStatus}
                  </span>
                </div>
                <div className="status-card-val" title={bpId}>
                  {bpId}
                </div>
              </div>

              <div className="quick-status-card">
                <div className="status-card-header">
                  <span className="status-card-title">Encumbrance</span>
                  <span className={`status-badge-inline ${encStatus === 'Active' ? 'amber' : 'green'}`}>
                    {encStatus}
                  </span>
                </div>
                <div className="status-card-val">
                  {encStatus === 'Active' ? 'NOC Required' : 'No Liabilities'}
                </div>
              </div>
            </div>

            {/* Direct Temporal Satellite Evidence CTA */}
            {(activeParcel.ai_alert || activeParcel.sentinel_available) && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.28)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={13} />
                    <span>TEMPORAL CHANGE DETECTED</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Sentinel-2 ground transformation identified (2020 vs 2025)
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ fontSize: '10.5px', padding: '5px 10px', whiteSpace: 'nowrap' }}
                  onClick={() => setEvidenceModalOpen(true)}
                  title="Inspect genuine Sentinel-2 temporal observation"
                >
                  Inspect Evidence
                </button>
              </div>
            )}

            {/* Basic Information Section */}
            <div className="info-section">
              <div className="info-section-title">Basic Information</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Parcel ID</span>
                  <span className="info-val">{activeParcel.parcel_id}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">ULPIN</span>
                  <span className="info-val font-mono" style={{ fontSize: '11px', color: 'var(--brand-accent-cyan)' }}>{activeParcel.ulpin}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Location</span>
                  <span className="info-val">{activeParcel.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Area</span>
                  <span className="info-val">
                    {activeParcel.standardized_area} {activeParcel.standardized_unit || 'm²'} ({activeParcel.original_area} {activeParcel.original_unit || 'Acre'})
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Land Use</span>
                  <span className="info-val">{activeParcel.land_use}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Zoning</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-cyan)' }}>
                    {activeParcel.zoning}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Jurisdiction</span>
                  <span className="info-val">{activeParcel.jurisdiction}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Last Updated</span>
                  <span className="info-val" style={{ fontSize: '10px', color: 'var(--status-success)' }}>
                    {activeParcel.last_updated || '2024-09-18'} (Source Verified)
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Records (2x4 Grid with Direct Tab Navigation) */}
            <div className="info-section">
              <div className="info-section-title">Linked Records & Department Modules</div>
              <div className="linked-records-grid">
                <div className="record-tile" onClick={() => setActiveTab('records')}>
                  <FileText className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">RoR</span>
                    <span className="record-status-dot">Available</span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('records')}>
                  <ShieldCheck className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">Registration</span>
                    <span className="record-status-dot">Available</span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('approvals')}>
                  <Building className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">Building Sanction</span>
                    <span className={`record-status-dot ${bpStatus !== 'Approved' ? 'pending' : ''}`}>
                      {bpStatus}
                    </span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('taxation')}>
                  <CreditCard className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">Taxation</span>
                    <span className="record-status-dot">Available</span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('encumbrance')}>
                  <AlertTriangle className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">Encumbrance</span>
                    <span className={`record-status-dot ${encStatus === 'Active' ? 'pending' : ''}`}>
                      {encStatus === 'Active' ? 'Active Charge' : 'No Record'}
                    </span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('encumbrance')}>
                  <Building className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">Mortgage</span>
                    <span className={`record-status-dot ${encStatus === 'Active' ? 'pending' : ''}`}>
                      {encStatus === 'Active' ? 'Registered' : 'Nil'}
                    </span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('utilities')}>
                  <Layers className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">Utilities</span>
                    <span className="record-status-dot">Available</span>
                  </div>
                </div>
                <div className="record-tile" onClick={() => setActiveTab('ai')}>
                  <Sparkles className="record-icon" />
                  <div className="record-meta">
                    <span className="record-name">AI Insights</span>
                    <span className="record-status-dot">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Box — shown when parcel has an alert */}
            {activeParcel.ai_alert && (
              <div className="ai-insights-box">
                <div className="ai-header-row">
                  <div className="ai-header-title">AI Insights</div>
                  <div className="ai-flagged-badge">
                    <AlertTriangle size={12} />
                    <span>Flagged</span>
                  </div>
                </div>

                <div className="ai-event-title">{activeParcel.ai_alert.title}</div>
                <div className="ai-event-meta">
                  Flagged: {activeParcel.ai_alert.flagged_date} • Status:{' '}
                  <strong style={{ color: 'var(--brand-accent-cyan)' }}>{fieldVerificationStatus}</strong>
                </div>
                <div className="ai-event-desc">
                  {activeParcel.ai_alert.description}
                </div>

                {/* Before & After Thumbnail Comparison */}
                <div className="ai-comparison-thumbs">
                  <div className="thumb-card" title="Historical Satellite (Oct 2023)">
                    <img
                      src="/assets/demo/temporal_oct2023.jpg"
                      alt="Oct 2023 Before"
                      className="thumb-img"
                    />
                    <span className="thumb-label">Oct 2023</span>
                  </div>
                  <div className="thumb-card" title="Observed Satellite (Mar 2024)">
                    <img
                      src="/assets/demo/temporal_mar2024.jpg"
                      alt="Mar 2024 After"
                      className="thumb-img"
                    />
                    <span className="thumb-label" style={{ backgroundColor: 'rgba(239, 68, 68, 0.85)' }}>Mar 2024</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ai-btn-row">
                  <button
                    className="btn-secondary"
                    onClick={() => setFieldModalOpen(true)}
                    title="Open Field Verification Form"
                  >
                    Field Verification
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setEvidenceModalOpen(true)}
                    title="Open Temporal Comparison Evidence"
                  >
                    View Evidence
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: LAND RECORDS ─────────────────────────────────────────── */}
        {activeTab === 'records' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="info-section">
              <div className="info-section-title">Record of Rights (Jamabandi)</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Khata / Khewat No.</span>
                  <span className="info-val">{activeParcel.khata_no || 'KH-842'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Khasra / Survey No.</span>
                  <span className="info-val">{activeParcel.survey_no || '1027/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Primary Titleholder</span>
                  <span className="info-val">{ownerName}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Father / Relation</span>
                  <span className="info-val">{ownerRelation}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Ownership Share</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-blue)', fontWeight: 700 }}>
                    {ownerShare}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Possession Nature</span>
                  <span className="info-val">Self-Occupied (Khudkasht)</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Mutation Reference</span>
                  <span className="info-val">#MUT-2023-881 (Sanctioned)</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Revenue Source</span>
                  <span className="info-val" style={{ color: 'var(--status-success)' }}>
                    Punjab Land Records Society
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <div className="info-section-title">Deed Registration & Conveyance</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Deed Number</span>
                  <span className="info-val">REG-PB-2023-891</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sub-Registrar</span>
                  <span className="info-val">{activeParcel.tehsil || 'Chandigarh Central'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Execution Date</span>
                  <span className="info-val">24 Oct 2023</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Stamp Duty</span>
                  <span className="info-val" style={{ color: 'var(--status-success)' }}>
                    ₹ 3,45,000 (Paid & Verified)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: APPROVALS ────────────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="info-section">
              <div className="info-section-title">Building Permission & Sanctions</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Sanction ID</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-blue)', fontWeight: 700 }}>
                    {bpId}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sanction Status</span>
                  <span className="info-val" style={{ color: bpStatus === 'Approved' ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 700 }}>
                    {bpStatus.toUpperCase()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Permitted Height</span>
                  <span className="info-val">{bpFloors}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sanction Date</span>
                  <span className="info-val">{bpDate}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Permissible FAR</span>
                  <span className="info-val">1.50 (Standard) + 0.25</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Setbacks</span>
                  <span className="info-val">Front: 4.5m • Rear: 3.0m</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Environmental NOC</span>
                  <span className="info-val" style={{ color: 'var(--status-success)' }}>Granted</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Validity Until</span>
                  <span className="info-val">13 Nov 2026</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: ENCUMBRANCE ─────────────────────────────────────────── */}
        {activeTab === 'encumbrance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="info-section">
              <div className="info-section-title">Encumbrance & Charge Register</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Encumbrance Status</span>
                  <span className="info-val" style={{ color: encStatus === 'Active' ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 700 }}>
                    {encStatus === 'Active' ? 'ACTIVE CHARGE' : 'NIL ENCUMBRANCE'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Financial Institution</span>
                  <span className="info-val">{encInst}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Registered Charge</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-blue)', fontWeight: 700 }}>
                    {encAmt}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Charge Reference</span>
                  <span className="info-val">{encRef}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Transfer NOC</span>
                  <span className="info-val" style={{ color: encStatus === 'Active' ? 'var(--status-error)' : 'var(--status-success)' }}>
                    {encStatus === 'Active' ? 'Bank NOC Mandatory' : 'Clear for Transfer'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Search Period</span>
                  <span className="info-val">30 Years Completed</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-alt)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <strong>CERSAI Notice:</strong> {encStatus === 'Active'
                ? `Charge registered under Section 26D of SARFAESI Act by ${encInst}. Title documents held under equitable mortgage.`
                : 'No adverse charges, lis pendens, or court injunctions recorded against this ULPIN.'}
            </div>
          </div>
        )}

        {/* ── TAB 5: TAXATION ────────────────────────────────────────────── */}
        {activeTab === 'taxation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="info-section">
              <div className="info-section-title">Municipal Property Tax Assessment</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Tax Assessment ID</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-blue)', fontWeight: 700 }}>
                    {taxId}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Assessment Status</span>
                  <span className="info-val" style={{ color: taxStatus === 'Paid' ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 700 }}>
                    {taxStatus.toUpperCase()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Current Demand Paid</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-cyan)', fontWeight: 700 }}>
                    {taxPaid}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Payment Date</span>
                  <span className="info-val">{taxDate}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Outstanding Arrears</span>
                  <span className="info-val" style={{ color: 'var(--status-success)' }}>₹ 0.00 (Cleared)</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Assessment Year</span>
                  <span className="info-val">2024–2025</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: UTILITIES ───────────────────────────────────────────── */}
        {activeTab === 'utilities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="info-section">
              <div className="info-section-title">Public Utilities & Infrastructure Grid</div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-key">Electricity Supply</span>
                  <span className="info-val" style={{ color: 'var(--status-success)' }}>{utElec}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Potable Water</span>
                  <span className="info-val" style={{ color: 'var(--brand-accent-cyan)' }}>{utWater}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sewerage Network</span>
                  <span className="info-val">{utSewer}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Piped Natural Gas</span>
                  <span className="info-val">{utGas}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Optical Fiber (FTTH)</span>
                  <span className="info-val" style={{ color: 'var(--status-success)' }}>Connected</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Utility Right-of-Way</span>
                  <span className="info-val">Clear of Overhead HT Lines</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: AI INSIGHTS ─────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="ai-insights-box" style={{ margin: 0 }}>
              <div className="ai-header-row">
                <div className="ai-header-title">Earth Observation & Spatial AI</div>
                <div className="ai-flagged-badge">
                  <AlertTriangle size={12} />
                  <span>{activeParcel.ai_alert ? 'Alert Flagged' : 'Monitored'}</span>
                </div>
              </div>

              <div className="ai-event-title">
                {activeParcel.ai_alert ? activeParcel.ai_alert.title : 'Continuous Sentinel-2 Cadastral Surveillance'}
              </div>
              <div className="ai-event-meta">
                Status: <strong style={{ color: 'var(--brand-accent-cyan)' }}>{fieldVerificationStatus}</strong> • Confidence: 94.2%
              </div>
              <div className="ai-event-desc">
                {activeParcel.ai_alert
                  ? activeParcel.ai_alert.description
                  : 'Automated NDVI and NDBI delta processing shows parcel boundaries conform strictly with official revenue maps.'}
              </div>

              {/* Before & After Thumbnail Comparison */}
              <div className="ai-comparison-thumbs">
                <div className="thumb-card" title="Historical Satellite (Oct 2023)">
                  <img
                    src="/assets/demo/temporal_oct2023.jpg"
                    alt="Oct 2023 Before"
                    className="thumb-img"
                  />
                  <span className="thumb-label">Oct 2023</span>
                </div>
                <div className="thumb-card" title="Observed Satellite (Mar 2024)">
                  <img
                    src="/assets/demo/temporal_mar2024.jpg"
                    alt="Mar 2024 After"
                    className="thumb-img"
                  />
                  <span className="thumb-label" style={{ backgroundColor: 'rgba(239, 68, 68, 0.85)' }}>Mar 2024</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="ai-btn-row">
                <button
                  className="btn-secondary"
                  onClick={() => setFieldModalOpen(true)}
                  title="Open Field Verification Form"
                >
                  Field Verification
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setEvidenceModalOpen(true)}
                  title="Open Temporal Comparison Evidence"
                >
                  View Evidence
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Report Action Button (Available across all tabs) */}
        <button
          className="full-report-btn"
          onClick={() => setUnifiedReportOpen(true)}
        >
          <span>View Full Parcel Report (12 Tabs)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
