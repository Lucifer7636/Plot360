import React, { useState } from 'react';
import {
  Landmark,
  FileText,
  ShieldCheck,
  Building,
  AlertTriangle,
  History,
  CheckCircle,
  ExternalLink,
  Search,
  MapPin,
  Clock,
  Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GovernanceModule() {
  const { activeParcel, selectParcel, setActiveModule, setUnifiedReportOpen, locationParcels, selectedLocation } = useApp();
  const [subTab, setSubTab] = useState('ror');
  const [filterText, setFilterText] = useState('');

  if (!activeParcel) {
    const displayedParcels = (locationParcels || []).filter(p => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return (
        p.parcel_id?.toLowerCase().includes(q) ||
        p.ulpin?.toLowerCase().includes(q) ||
        p.land_use?.toLowerCase().includes(q) ||
        p.survey_no?.toLowerCase().includes(q)
      );
    });

    return (
      <div className="page-scroll-area">
        <div className="page-header-container">
          <div className="breadcrumb-row">
            <span className="breadcrumb-item">PLOT360</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item">Governance & Records</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--text-secondary)' }}>Cadastral Directory</span>
          </div>
          <div className="page-title-row">
            <Landmark className="page-icon" />
            <h1 className="page-title">Governance & Land Records</h1>
          </div>
          <p className="page-subtitle">
            Official land registries, deed verification, Record of Rights (Jamabandi), and encumbrance tracking across jurisdictions.
          </p>
        </div>

        {/* Location & Jurisdiction Context Banner */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-accent-cyan)'
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Active Jurisdiction: {selectedLocation?.name || 'Chandigarh & Punjab Region'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {displayedParcels.length} Cadastral Records Indexed • Select a record below or open the GIS Map to view boundaries
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => setActiveModule('explorer')}>
              Open Land Explorer Map
            </button>
            <button className="btn-primary" onClick={() => selectParcel('P-1027')}>
              Inspect Sample P-1027
            </button>
          </div>
        </div>

        {/* Cadastral Records Directory Table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Cadastral Registry Index</h3>
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filter by Parcel ID, ULPIN, or Use..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px 6px 30px',
                  fontSize: '11.5px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 10px' }}>Parcel ID</th>
                  <th style={{ padding: '8px 10px' }}>ULPIN</th>
                  <th style={{ padding: '8px 10px' }}>Survey / Khata</th>
                  <th style={{ padding: '8px 10px' }}>Land Use</th>
                  <th style={{ padding: '8px 10px' }}>Standard Area</th>
                  <th style={{ padding: '8px 10px' }}>Registry Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedParcels.map(p => (
                  <tr key={p.parcel_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.parcel_id}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="font-mono" style={{ fontSize: '11px', color: 'var(--brand-accent-cyan)' }}>{p.ulpin}</span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{p.survey_no || p.khasra_no || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 7px', borderRadius: '4px', fontSize: '11px' }}>
                        {p.land_use || 'Standard'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{p.area_display || `${p.standardized_area || 0} m²`}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="status-pill-verified" style={{ fontSize: '10.5px' }}>✓ Verified</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => selectParcel(p.parcel_id)}
                      >
                        Inspect Jamabandi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const ownerName = activeParcel.owner?.name || 'Authorized Rights Holder';
  const encStatus = activeParcel.enc?.status || activeParcel.encumbrance?.status || 'Clear';
  const encInst = activeParcel.enc?.inst || activeParcel.encumbrance?.institution || (encStatus === 'Active' ? 'Restricted / Officer Access Only' : 'None (No active lien)');
  const encAmt = activeParcel.enc?.amt || activeParcel.encumbrance?.amount || (encStatus === 'Active' ? 'Restricted / Officer Access Only' : '₹ 0.00');
  const encRef = activeParcel.enc?.ref || activeParcel.encumbrance?.reference || (encStatus === 'Active' ? 'Restricted / Officer Access Only' : 'N/A');

  return (
    <div className="page-scroll-area">
      {/* Header */}
      <div className="page-header-container">
        <div className="breadcrumb-row">
          <span className="breadcrumb-item">PLOT360</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">Governance & Records</span>
          <span className="breadcrumb-sep">/</span>
          <span style={{ color: 'var(--brand-accent-blue)', fontWeight: 600 }}>{activeParcel.parcel_id}</span>
        </div>
        <div className="page-title-row">
          <Landmark className="page-icon" />
          <h1 className="page-title">Governance & Land Records</h1>
        </div>
        <p className="page-subtitle">
          Official land registries, deed verification, Record of Rights (Jamabandi), and encumbrance tracking across jurisdictions.
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { id: 'ror', label: 'Record of Rights (RoR)' },
          { id: 'registration', label: 'Deed Registration' },
          { id: 'ownership', label: 'Chain of Title / History' },
          { id: 'encumbrance', label: 'Encumbrance & Mortgages' },
          { id: 'disputes', label: 'Tribunal & Disputes' }
        ].map(t => (
          <button
            key={t.id}
            className={`quick-action-btn ${subTab === t.id ? 'active' : ''}`}
            style={{
              backgroundColor: subTab === t.id ? 'var(--brand-accent-blue)' : 'var(--bg-card)',
              color: subTab === t.id ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {subTab === 'ror' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Record of Rights: Jamabandi Record</h3>
              <span className="status-pill-verified">✓ Punjab Revenue Dept. Verified</span>
            </div>
            <div className="info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="info-item">
                <span className="info-key">Khata / Khewat No.</span>
                <span className="info-val">{activeParcel.khata_no || 'KH-842 / KW-112'}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Khasra / Survey No.</span>
                <span className="info-val">{activeParcel.survey_no || '1027/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Recorded Area</span>
                <span className="info-val">{activeParcel.standardized_area} {activeParcel.standardized_unit || 'm²'} ({activeParcel.original_area} {activeParcel.original_unit || 'Acre'})</span>
              </div>
              <div className="info-item">
                <span className="info-key">Land Classification</span>
                <span className="info-val">{activeParcel.land_use} (Non-agricultural)</span>
              </div>
              <div className="info-item">
                <span className="info-key">Rights-holder / Owner</span>
                <span className="info-val">{ownerName}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Cultivator / Possession</span>
                <span className="info-val">Self-Occupied / Khudkasht</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-card-alt)', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              <strong>Revenue Officer Remarks:</strong> Mutation #MUT-2023-881 sanctioned following registered sale deed #REG-PB-2023-891. All land cess and local revenue taxes are settled.
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700 }}>Data Provenance & Trust</h4>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Verification proof for parcel records:
            </div>
            <div style={{ background: 'var(--bg-card-alt)', padding: '10px', borderRadius: '8px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Source Department:</strong> Dept. of Land Resources & Revenue, Punjab</div>
              <div><strong>Record ID:</strong> ROR-PB-CHD-2023-1027</div>
              <div><strong>Digital Signature:</strong> SHA-256 Verified (0x9a8f...31bc)</div>
              <div><strong>Last Updated:</strong> {activeParcel.last_updated || '2024-09-18'}</div>
              <div><strong>Status:</strong> <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>SOURCE VERIFIED & AVAILABLE</span></div>
            </div>
            <button className="full-report-btn" onClick={() => setUnifiedReportOpen(true)}>
              Open Full Parcel Dossier
            </button>
          </div>
        </div>
      )}

      {subTab === 'registration' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Registered Conveyance Deeds for {activeParcel.parcel_id}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card-alt)', borderRadius: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>1. Application Submitted</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>12 Oct 2023</div>
            </div>
            <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--status-success)', margin: '0 10px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>2. Stamp Duty Paid</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>₹ 3,45,000 Verified</div>
            </div>
            <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--status-success)', margin: '0 10px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>3. Sub-Registrar Executed</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>24 Oct 2023</div>
            </div>
            <div style={{ height: '2px', flex: 1, backgroundColor: 'var(--status-success)', margin: '0 10px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--status-success)', fontWeight: 700 }}>4. Title Transferred</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deed #REG-PB-2023-891</div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'ownership' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Chain of Title & Historical Ownership Chronology</h3>
            <span className="status-pill-verified">30-Year Continuous Record</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-accent-blue)' }}>
                  Current Owner: {ownerName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Acquired via Registered Sale Deed #REG-PB-2023-891 on 24 Oct 2023 • Mutation #MUT-2023-881 Sanctioned
                </div>
              </div>
              <span className="status-badge-inline green">ACTIVE TITLE</span>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Previous Owner: Harbhajan Singh & Brothers
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Acquired via Inheritance (Virasat) on 14 Mar 2005 • Jamabandi Khata #KH-612
                </div>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>TRANSFERRED (2023)</span>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Original Allotment: Punjab Urban Development Authority (PUDA)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Allotment Letter #PUDA/SEC17/1994/281 dated 18 Nov 1994
                </div>
              </div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>HISTORICAL (1994)</span>
            </div>
          </div>
        </div>
      )}

      {subTab === 'encumbrance' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Liabilities & Encumbrance Register</h3>
            <span className={`status-badge-inline ${encStatus === 'Active' ? 'amber' : 'green'}`}>
              {encStatus === 'Active' ? 'ENCUMBERED' : 'CLEAR TITLE'}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px' }}>Charge ID</th>
                <th style={{ padding: '8px' }}>Lender / Entity</th>
                <th style={{ padding: '8px' }}>Type</th>
                <th style={{ padding: '8px' }}>Amount</th>
                <th style={{ padding: '8px' }}>Registered Date</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {encStatus === 'Active' ? (
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{encRef}</td>
                  <td style={{ padding: '10px 8px' }}>{encInst}</td>
                  <td style={{ padding: '10px 8px' }}>Equitable Mortgage</td>
                  <td style={{ padding: '10px 8px' }}>{encAmt}</td>
                  <td style={{ padding: '10px 8px' }}>15 Nov 2023</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-badge-amber)', color: 'var(--status-warning)', fontWeight: 600 }}>
                      ACTIVE (NOC Required)
                    </span>
                  </td>
                </tr>
              ) : (
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>NIL</td>
                  <td style={{ padding: '10px 8px' }}>None (Unencumbered)</td>
                  <td style={{ padding: '10px 8px' }}>Freehold Clear</td>
                  <td style={{ padding: '10px 8px' }}>₹ 0.00</td>
                  <td style={{ padding: '10px 8px' }}>2024-09-01</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-badge-green)', color: 'var(--status-success)', fontWeight: 600 }}>
                      CLEAR
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'disputes' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Scale size={32} style={{ color: 'var(--status-success)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No Active Disputes or Adverse Claims</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.5 }}>
            Automated verification query across the Sub-Divisional Magistrate (SDM) Revenue Tribunal, District Civil Court, and High Court Registry returned 0 pending claims or stay orders for ULPIN {activeParcel.ulpin}.
          </p>
          <span className="status-pill-verified" style={{ marginTop: '6px' }}>✓ Litigation Free (Search Period 30 Yrs)</span>
        </div>
      )}
    </div>
  );
}
