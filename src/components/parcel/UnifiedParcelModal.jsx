import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Building,
  CreditCard,
  Layers,
  Sparkles,
  History,
  Database,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function UnifiedParcelModal() {
  const {
    activeParcel,
    unifiedReportOpen,
    setUnifiedReportOpen,
    setEvidenceModalOpen,
    setFieldModalOpen,
    fieldVerificationStatus
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');

  if (!unifiedReportOpen || !activeParcel) return null;

  const tabs = [
    { id: 'overview', label: 'Land Passport' },
    { id: 'ownership', label: 'Ownership & RoR' },
    { id: 'registration', label: 'Registration' },
    { id: 'planning', label: 'Planning & Zoning' },
    { id: 'building', label: 'Building Permission' },
    { id: 'liabilities', label: 'Liabilities & Encumbrance' },
    { id: 'tax', label: 'Property Tax' },
    { id: 'utilities', label: 'Utilities' },
    { id: 'restrictions', label: 'Restrictions' },
    { id: 'history', label: 'Temporal History' },
    { id: 'provenance', label: 'Data Provenance' },
    { id: 'ai', label: 'AI Insights' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '950px',
          maxWidth: '96vw',
          height: '650px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-alt)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: 'var(--brand-accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Unified Parcel View: {activeParcel.parcel_id}
                </h2>
                <span className="status-pill-verified">✓ Active Government Record</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ULPIN: <strong style={{ color: 'var(--brand-accent-cyan)' }}>{activeParcel.ulpin}</strong> • {activeParcel.location}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="quick-action-btn"
              onClick={() => {
                const reportContent = `PLOT360 OFFICIAL LAND PASSPORT SUMMARY REPORT\nParcel ID: ${activeParcel.parcel_id}\nULPIN: ${activeParcel.ulpin}\nLocation: ${activeParcel.location}\nArea: ${activeParcel.standardized_area} sqm\nLand Use: ${activeParcel.land_use}\nZoning: ${activeParcel.zoning}\nOwner: ${activeParcel.owner?.name || 'Government'}\nBuilding Permission: ${activeParcel.bp?.id || 'Approved'}\nEncumbrance Status: ${activeParcel.enc?.status || 'Clear'}\nStatus: Verified\nGenerated: ${new Date().toISOString()}`;
                const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `PLOT360_${activeParcel.parcel_id}_Land_Passport.txt`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              title="Download official text report"
            >
              <Download size={13} />
              <span>Export Record</span>
            </button>
            <button
              className="icon-btn"
              onClick={() => setUnifiedReportOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`parcel-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'rgba(2, 132, 199, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-accent-cyan)' }}>
                    PLOT360 Land Passport — Common Parcel Record
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Authoritative consolidated parcel profile cross-referenced across 6 state department databases.
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Information view only (Not a legal title guarantee)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div className="quick-status-card">
                  <span className="info-key">Standardized Area</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-accent-blue)' }}>
                    {activeParcel.standardized_area}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Original: {activeParcel.original_area}</span>
                </div>
                <div className="quick-status-card">
                  <span className="info-key">Land Context</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {activeParcel.rural_urban}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tehsil: {activeParcel.tehsil || 'Central'}</span>
                </div>
                <div className="quick-status-card">
                  <span className="info-key">Zoning Class</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-accent-cyan)' }}>
                    {activeParcel.zoning}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Permitted: Residential R-2</span>
                </div>
                <div className="quick-status-card">
                  <span className="info-key">Record Status</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--status-success)' }}>
                    Data Available
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeParcel.last_updated}</span>
                </div>
              </div>

              {/* Status checklist */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Governance & Legal Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ownership Record</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Verified ({activeParcel.owner.name})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deed Registration</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Registered</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Encumbrance Status</span>
                      <span style={{ color: activeParcel.encumbrance?.status === 'Active' ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 600 }}>
                        {activeParcel.encumbrance?.status === 'Active' ? '⚠ Active Mortgage (HDFC Bank)' : '✓ Clear'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Disputes Tribunal</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ No Active Litigation</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Municipal & Infrastructure Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Building Permission</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Approved (G+2 Floors)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Property Tax Status</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Fully Paid (2024-25)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Electricity Connection</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Connected (Meter #99210)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Water & Sewerage</span>
                      <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>✓ Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ownership' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Record of Rights (RoR / Jamabandi)</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Primary Rights Holder</span>
                  <span className="info-val">{activeParcel.owner.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Parentage / Guardian</span>
                  <span className="info-val">{activeParcel.owner.relation || 's/o Harbhajan Singh'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Share Proportion</span>
                  <span className="info-val">{activeParcel.owner.share || '100% (Sole Owner)'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Khata Number</span>
                  <span className="info-val">{activeParcel.khata_no || 'KH-842'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Khasra / Survey Number</span>
                  <span className="info-val">{activeParcel.survey_no || '1027/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Source Department</span>
                  <span className="info-val">Punjab Revenue & Land Records Dept.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Deed Registration Timeline</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card-alt)', borderRadius: '10px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Submitted</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>12 Oct 2023</div>
                </div>
                <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--status-success)', margin: '0 10px' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Documents Verified</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>18 Oct 2023</div>
                </div>
                <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--status-success)', margin: '0 10px' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Sub-Registrar Review</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24 Oct 2023</div>
                </div>
                <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--status-success)', margin: '0 10px' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓ Registered</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deed #REG-PB-2023-891</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="ai-insights-box">
                <div className="ai-header-row">
                  <div className="ai-header-title">Satellite Change Detection Event</div>
                  <span className="status-pill-verified" style={{ background: 'var(--bg-badge-red)', color: 'var(--status-error)' }}>
                    ⚠ Potential Change Detected — Verification Required
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Current Human-in-the-loop Status: <strong style={{ color: 'var(--brand-accent-cyan)' }}>{fieldVerificationStatus}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Spatial change detection algorithms flagged unauthorized conversion from agricultural classification to residential site leveling.
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setUnifiedReportOpen(false);
                      setEvidenceModalOpen(true);
                    }}
                  >
                    Open Draggable Temporal Evidence Viewer
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setUnifiedReportOpen(false);
                      setFieldModalOpen(true);
                    }}
                  >
                    Update Field Verification Officer Status
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Temporal Land History (2022 — 2026)</h3>
              <div style={{ borderLeft: '2px solid var(--brand-accent-blue)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-accent-cyan)' }}>2026 / Current</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Active verified records integrated across land administration departments. Building permission valid.</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>2024</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>AI Change detection flagged site preparation. Field verification initiated.</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>2023</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Title deed registered to Ravinder Singh. Building permission application submitted.</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>2022</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Prior agricultural classification under Punjab Land Revenue Records.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Statutory Planning & Master Plan Zoning</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Master Plan Classification</span>
                  <span className="info-val">{activeParcel.zoning || 'Residential (R-2)'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Land Use Category</span>
                  <span className="info-val">{activeParcel.land_use || 'Residential'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Permissible Ground Coverage</span>
                  <span className="info-val">40.0%</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Floor Area Ratio (FAR)</span>
                  <span className="info-val">1.50</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Master Plan Period</span>
                  <span className="info-val">Master Plan 2031</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Planning Authority</span>
                  <span className="info-val">Town & Country Planning Department</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'building' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Municipal Building Sanction & Permissions</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Permission ID</span>
                  <span className="info-val">{activeParcel.bp?.id || activeParcel.building_permission?.permission_id || 'PJB/BP/2023/114'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sanction Status</span>
                  <span className="info-val" style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                    {activeParcel.bp?.status || activeParcel.building_permission?.status || 'Approved'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sanctioned Height / Floors</span>
                  <span className="info-val">{activeParcel.bp?.floors || activeParcel.building_permission?.floors || 'Restricted / Officer Access Only'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Approval Date</span>
                  <span className="info-val">{activeParcel.bp?.date || activeParcel.bp?.approval_date || activeParcel.building_permission?.approval_date || '14 Nov 2023'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sanctioned Built-Up Area</span>
                  <span className="info-val">{activeParcel.standardized_area ? `${activeParcel.standardized_area} m²` : '1,248.50 m²'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Approving Agency</span>
                  <span className="info-val">Municipal Corporation Building Branch</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'liabilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Registered Encumbrance & Mortgage Liens</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Encumbrance Status</span>
                  <span className="info-val" style={{ color: (activeParcel.enc?.status === 'Active' || activeParcel.encumbrance?.status === 'Active') ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 600 }}>
                    {activeParcel.enc?.status || activeParcel.encumbrance?.status || 'Clear'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Lending Financial Institution</span>
                  <span className="info-val">{activeParcel.enc?.inst || activeParcel.encumbrance?.institution || ((activeParcel.enc?.status === 'Active' || activeParcel.encumbrance?.status === 'Active') ? 'Restricted / Officer Access Only' : 'None (No active lien)')}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Registered Charge Amount</span>
                  <span className="info-val">{activeParcel.enc?.amt || activeParcel.encumbrance?.loan_amount || ((activeParcel.enc?.status === 'Active' || activeParcel.encumbrance?.status === 'Active') ? 'Restricted / Officer Access Only' : 'N/A')}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Mortgage Registry Ref</span>
                  <span className="info-val">{activeParcel.enc?.ref || activeParcel.encumbrance?.reference || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">NOC Requirement for Transfer</span>
                  <span className="info-val">{(activeParcel.enc?.noc || activeParcel.encumbrance?.noc_required) ? 'Mandatory Bank NOC Required' : 'Not Required'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">CERSAI Registry Status</span>
                  <span className="info-val">{(activeParcel.enc?.status === 'Active' || activeParcel.encumbrance?.status === 'Active') ? 'Charge Recorded' : 'Unencumbered'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Municipal Property Taxation & Assessment</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Property Tax Assessment ID</span>
                  <span className="info-val">{activeParcel.tax?.id || activeParcel.tax?.assessment_id || activeParcel.property_tax?.assessment_id || 'PT-CHD-2024-8902'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Payment Status</span>
                  <span className="info-val" style={{ color: 'var(--status-success)', fontWeight: 600 }}>
                    {activeParcel.tax?.status || activeParcel.property_tax?.status || 'Paid'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-key">Last Assessed Tax Paid</span>
                  <span className="info-val">{activeParcel.tax?.paid || activeParcel.tax?.amount_paid || activeParcel.property_tax?.amount_paid || 'Restricted / Officer Access Only'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Payment Date</span>
                  <span className="info-val">{activeParcel.tax?.date || activeParcel.tax?.last_payment || activeParcel.property_tax?.last_payment || '28 Jun 2024'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Assessment Cycle</span>
                  <span className="info-val">FY 2024-2025 (Annual)</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Billing Authority</span>
                  <span className="info-val">Municipal Corporation Revenue Cell</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'utilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Civic Utilities & Infrastructure Feasibility</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Electricity Feasibility</span>
                  <span className="info-val">{activeParcel.ut?.elec || 'Connected (Meter #99210)'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Potable Water Connection</span>
                  <span className="info-val">{activeParcel.ut?.water || 'Connected (Connection #4412)'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Sewerage Network Line</span>
                  <span className="info-val">{activeParcel.ut?.sewer || 'Connected'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Piped Natural Gas</span>
                  <span className="info-val">{activeParcel.ut?.gas || 'Available Nearby'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'restrictions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Statutory, Environmental & Buffer Restrictions</h3>
              <div style={{ padding: '16px', background: 'var(--bg-card-alt)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success)', fontWeight: 600 }}>
                  <span>✓</span> No environmental, coastal regulation zone (CRZ), or eco-sensitive buffer restrictions active.
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Parcel does not intersect with defense buffer corridors, railway right-of-way easements, or high-tension power line reservations.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'provenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Data Provenance & Cryptographic Audit Ledger</h3>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="info-item">
                  <span className="info-key">Cadastral Vector Source</span>
                  <span className="info-val">State Land Records Directorate (EPSG:4326)</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Audit Verification Status</span>
                  <span className="info-val" style={{ color: 'var(--status-success)', fontWeight: 600 }}>Verified & Reconciled</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Last Multi-Agency Reconciliation</span>
                  <span className="info-val">{activeParcel.last_updated || '12 Aug 2025, 10:24 AM'}</span>
                </div>
                <div className="info-item">
                  <span className="info-key">Record Integrity Ledger</span>
                  <span className="info-val">Immutably logged to PLOT360 land audit trail</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
