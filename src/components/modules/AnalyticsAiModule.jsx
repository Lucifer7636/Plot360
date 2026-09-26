import React, { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Sparkles,
  Upload,
  FileCheck,
  CheckCircle,
  XCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AnalyticsAiModule() {
  const {
    activeParcel,
    selectParcel,
    setEvidenceModalOpen,
    setFieldModalOpen,
    fieldVerificationStatus
  } = useApp();

  const [activeSection, setActiveSection] = useState('conflicts');
  const [conflictFilter, setConflictFilter] = useState('all');
  const [selectedConflict, setSelectedConflict] = useState({
    id: 'CONF-01',
    parcel_id: 'P-1028',
    ulpin: 'IN-PB-CHD-0001028',
    field: 'Parcel Area',
    sourceA: 'Record of Rights (Jamabandi)',
    valueA: '1,416.40 m² (0.35 Acre)',
    sourceB: 'Property Tax Assessment',
    valueB: '1,530.00 m² (0.38 Acre)',
    diff: '+113.60 m² discrepancy (+8%)',
    officer: 'Revenue Officer (Tehsil North)',
    status: 'OPEN'
  });

  // Document Intelligence state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const handleSimulatedUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file.name);
    setExtracting(true);
    setExtractedData(null);

    setTimeout(() => {
      setExtracting(false);
      setExtractedData({
        ulpin: 'IN-PB-CHD-0001027',
        parcel: 'P-1027',
        owner: 'Ravinder Singh',
        area: '1,248.50 m²',
        deed_no: 'REG-PB-2023-891',
        date: '24 Oct 2023',
        match_status: 'MATCHED_WITH_ROR',
        confidence: '98.4%'
      });
    }, 1200);
  };

  return (
    <div className="page-scroll-area">
      {/* Header */}
      <div className="page-header-container">
        <div className="breadcrumb-row">
          <span className="breadcrumb-item">PLOT360</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">Analytics & AI</span>
        </div>
        <div className="page-title-row">
          <BarChart3 className="page-icon" />
          <h1 className="page-title">Analytics, Decision Support & AI Hub</h1>
        </div>
        <p className="page-subtitle">
          Multi-departmental data conflict reconciliation, temporal satellite change detection, document intelligence, and predictive analytics.
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { id: 'conflicts', label: 'Data Conflict Center (83)' },
          { id: 'changes', label: 'Satellite Change Alerts (42)' },
          { id: 'duplicates', label: 'Duplicate Detection (15)' },
          { id: 'doc-ai', label: 'Document Intelligence (OCR)' },
          { id: 'predictive', label: 'Predictive Decision Support' }
        ].map(t => (
          <button
            key={t.id}
            className={`quick-action-btn ${activeSection === t.id ? 'active' : ''}`}
            style={{
              backgroundColor: activeSection === t.id ? 'var(--brand-accent-blue)' : 'var(--bg-card)',
              color: activeSection === t.id ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveSection(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. DATA CONFLICTS */}
      {activeSection === 'conflicts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Summary Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div
              onClick={() => setConflictFilter('area')}
              style={{
                background: conflictFilter === 'area' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${conflictFilter === 'area' ? 'var(--brand-accent-blue)' : 'var(--border-card)'}`,
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AREA MISMATCHES</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-error)' }}>31</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>RoR vs Tax area deltas</div>
            </div>

            <div
              onClick={() => setConflictFilter('owner')}
              style={{
                background: conflictFilter === 'owner' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${conflictFilter === 'owner' ? 'var(--brand-accent-blue)' : 'var(--border-card)'}`,
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OWNER NAME MISMATCHES</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-warning)' }}>12</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Spelling & mutation lag</div>
            </div>

            <div
              onClick={() => setConflictFilter('duplicate')}
              style={{
                background: conflictFilter === 'duplicate' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${conflictFilter === 'duplicate' ? 'var(--brand-accent-blue)' : 'var(--border-card)'}`,
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DUPLICATE SURVEY NUMBERS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand-accent-cyan)' }}>15</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Overlap in legacy records</div>
            </div>

            <div
              onClick={() => setConflictFilter('missing')}
              style={{
                background: conflictFilter === 'missing' ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${conflictFilter === 'missing' ? 'var(--brand-accent-blue)' : 'var(--border-card)'}`,
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MISSING DEPARTMENT DATA</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>25</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Unlinked municipal files</div>
            </div>
          </div>

          {/* Conflict Split: List on Left, Detail on Right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>Active Conflict Queue</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'CONF-01', parcel: 'P-1028', type: 'Area Mismatch', desc: 'RoR 1,416 m² vs Property Tax 1,530 m²', badge: 'red' },
                  { id: 'CONF-02', parcel: 'P-1025', type: 'Classification Delta', desc: 'Commercial vs Municipal Residential Tax', badge: 'amber' },
                  { id: 'CONF-03', parcel: 'P-1009', type: 'Missing Encumbrance NOC', desc: 'Bank charge listed without registry entry', badge: 'blue' }
                ].map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      selectParcel(item.parcel);
                    }}
                    style={{
                      padding: '10px 12px',
                      background: activeParcel?.parcel_id === item.parcel ? 'var(--bg-card-hover)' : 'var(--bg-card-alt)',
                      border: `1px solid ${activeParcel?.parcel_id === item.parcel ? 'var(--brand-accent-blue)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700 }}>
                        {item.parcel} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({item.id})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: item.badge === 'red' ? 'var(--bg-badge-red)' : 'var(--bg-badge-amber)', color: item.badge === 'red' ? 'var(--status-error)' : 'var(--status-warning)' }}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Source A vs Source B Comparison */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Source Comparison: {selectedConflict.parcel_id}</h4>
                <span className="status-badge-inline red">CONFLICT FLAGGED</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SOURCE A</span>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent-cyan)', marginTop: '2px' }}>
                    {selectedConflict.sourceA}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedConflict.valueA}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SOURCE B</span>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '2px' }}>
                    {selectedConflict.sourceB}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {selectedConflict.valueB}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                <strong>Difference Identified:</strong> {selectedConflict.diff}
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Automated record modification prohibited. Physical resurvey ordered for revenue demarcation.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => alert('Assigned to Revenue Officer for Physical Resurvey')}>
                  Assign to Officer
                </button>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => alert('Marked for joint inter-departmental review')}>
                  Mark Under Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SATELLITE CHANGE ALERTS */}
      {activeSection === 'changes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="ai-insights-box">
            <div className="ai-header-row">
              <span className="ai-header-title">Satellite Change Alert: {activeParcel.parcel_id}</span>
              <span className="ai-flagged-badge">POTENTIAL CHANGE DETECTED</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Satellite imagery change detection algorithm identified ground clearance and construction commencement on parcel <strong>{activeParcel.parcel_id}</strong> (ULPIN: {activeParcel.ulpin}) between <strong>Oct 2023</strong> and <strong>Mar 2024</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn-primary" onClick={() => setEvidenceModalOpen(true)}>
                Open Draggable Temporal Evidence Comparison
              </button>
              <button className="btn-secondary" onClick={() => setFieldModalOpen(true)}>
                Field Verification (Current: {fieldVerificationStatus})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DOCUMENT INTELLIGENCE SIMULATION */}
      {activeSection === 'doc-ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Upload Land Record or Deed</h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Simulated OCR & NLP entity extractor parses scanned deed PDF/images and cross-references extracted metadata with official cadastral databases.
            </p>

            <label
              style={{
                border: '2px dashed var(--border-card)',
                borderRadius: '10px',
                padding: '30px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg-card-alt)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Upload size={28} style={{ color: 'var(--brand-accent-blue)' }} />
              <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Click to select sample Deed / Jamabandi Scan</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Simulates OCR extraction on client-side</div>
              <input type="file" onChange={handleSimulatedUpload} style={{ display: 'none' }} />
            </label>

            {uploadedFile && (
              <div style={{ fontSize: '12px', color: 'var(--brand-accent-cyan)' }}>
                Selected file: <strong>{uploadedFile}</strong>
              </div>
            )}
            {extracting && (
              <div style={{ fontSize: '12px', color: 'var(--status-warning)' }}>
                ⚡ Processing OCR entity extraction and polygon cross-reference...
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Extracted Field Entities</h3>
            {extractedData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PARCEL ID</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{extractedData.parcel}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ULPIN</span>
                    <div style={{ fontWeight: 700, color: 'var(--brand-accent-cyan)', fontSize: '11.5px' }}>{extractedData.ulpin}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PRIMARY RIGHTS HOLDER</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{extractedData.owner}</div>
                  </div>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>STANDARDIZED AREA</span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{extractedData.area}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--status-success)' }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-success)' }}>
                      Entity Match Confirmed ({extractedData.confidence} Confidence)
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Extracted deed fields match 100% with Punjab Land Records Jamabandi database.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Upload any document to simulate AI extraction and instant cross-validation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. DUPLICATES & PREDICTIVE ANALYTICS */}
      {(activeSection === 'duplicates' || activeSection === 'predictive') && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>
            Decision Support & Spatial Hotspots
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DEVELOPMENT ACTIVITY INDEX</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand-accent-blue)', marginTop: '4px' }}>+14.8%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sector 17 & Sector 18 commercial expansion</div>
            </div>
            <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RECORD INCONSISTENCY RATE</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-success)', marginTop: '4px' }}>0.33%</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Decreased by 12% following ULPIN roll-out</div>
            </div>
            <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>INFRASTRUCTURE GAP INDEX</span>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--status-warning)', marginTop: '4px' }}>Low (98% Served)</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Water and electricity lines fully mapped</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
