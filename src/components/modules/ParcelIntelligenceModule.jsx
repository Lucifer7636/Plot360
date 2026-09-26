import React, { useState } from 'react';
import {
  Box,
  FileText,
  Calculator,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Download,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ParcelIntelligenceModule() {
  const { activeParcel, selectParcel, setActiveModule, setUnifiedReportOpen } = useApp();

  // Unit conversion state
  const [selectedUnit, setSelectedUnit] = useState('sqm'); // sqm, acre, bigha, kanal, marla, sqft

  if (!activeParcel) {
    return (
      <div className="page-scroll-area">
        <div className="page-header-container">
          <div className="breadcrumb-row">
            <span className="breadcrumb-item">PLOT360</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item">Parcel Intelligence</span>
          </div>
          <div className="page-title-row">
            <Box className="page-icon" />
            <h1 className="page-title">Parcel Intelligence & Analytical Dossier</h1>
          </div>
          <p className="page-subtitle">
            Select a cadastral parcel to calculate multi-unit conversions, inspect ISO-19152 LADM profiles, and generate valuation models.
          </p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <MapPin size={36} style={{ color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No Parcel Selected</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '380px' }}>
            To view comprehensive parcel intelligence, please select a parcel from the Land Explorer map or load a demo record.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" onClick={() => selectParcel('P-1027')}>
              Load Sample Parcel P-1027
            </button>
            <button className="btn-secondary" onClick={() => setActiveModule('explorer')}>
              Go to Land Explorer Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rawAreaNum = parseFloat(activeParcel.standardized_area) || 1248.5;
  const valuationNum = Math.round(rawAreaNum * 30000);

  const convertArea = (sqm) => {
    switch (selectedUnit) {
      case 'acre': return `${(sqm * 0.000247105).toFixed(3)} Acres`;
      case 'bigha': return `${(sqm * 0.000395368).toFixed(3)} Bigha (Punjab)`;
      case 'kanal': return `${(sqm * 0.00197684).toFixed(2)} Kanal`;
      case 'marla': return `${(sqm * 0.0395368).toFixed(1)} Marla`;
      case 'sqft': return `${(sqm * 10.7639).toLocaleString()} sq. ft.`;
      default: return `${sqm} m²`;
    }
  };

  return (
    <div className="page-scroll-area">
      {/* Header */}
      <div className="page-header-container">
        <div className="breadcrumb-row">
          <span className="breadcrumb-item">PLOT360</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">Parcel Intelligence</span>
          <span className="breadcrumb-sep">/</span>
          <span style={{ color: 'var(--brand-accent-blue)', fontWeight: 600 }}>{activeParcel.parcel_id}</span>
        </div>
        <div className="page-title-row">
          <Box className="page-icon" />
          <h1 className="page-title">Parcel Intelligence & Analytical Dossier</h1>
        </div>
        <p className="page-subtitle">
          Standardized land metrics, multi-unit area conversions, indicative valuation models, and unified parcel intelligence.
        </p>
      </div>

      {/* Parcel Identity Banner */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{activeParcel.parcel_id}</h2>
            <span className="status-pill-verified">✓ ULPIN Verified</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            ULPIN: <strong style={{ color: 'var(--brand-accent-cyan)' }}>{activeParcel.ulpin}</strong> • {activeParcel.location} • {activeParcel.jurisdiction}
          </div>
        </div>

        <button className="btn-primary" onClick={() => setUnifiedReportOpen(true)}>
          Launch Complete Land Passport
        </button>
      </div>

      {/* Area Standardization & Converter Tool */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Original vs Standardized Measurement Engine</h3>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Non-destructive standardisation preserves local revenue units while computing national metric coordinates
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'sqm', label: 'm²' },
              { id: 'acre', label: 'Acre' },
              { id: 'kanal', label: 'Kanal' },
              { id: 'marla', label: 'Marla' },
              { id: 'bigha', label: 'Bigha' },
              { id: 'sqft', label: 'sq. ft.' }
            ].map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUnit(u.id)}
                className="quick-action-btn"
                style={{
                  padding: '4px 10px',
                  backgroundColor: selectedUnit === u.id ? 'var(--brand-accent-blue)' : 'var(--bg-card-alt)',
                  color: selectedUnit === u.id ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ORIGINAL REVENUE VALUE</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {activeParcel.original_area} {activeParcel.original_unit || 'Acre'}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Recorded in Revenue Jamabandi Register
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>STANDARDIZED METRIC AREA</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-accent-blue)', marginTop: '2px' }}>
              {convertArea(rawAreaNum)}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--status-success)', marginTop: '2px' }}>
              ✓ Converted via ISO-19152 LADM
            </div>
          </div>

          <div style={{ background: 'var(--bg-card-alt)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>INDICATIVE ANALYTICAL VALUATION</span>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-accent-cyan)', marginTop: '2px' }}>
              ₹ {valuationNum.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              *Indicative Analytical Estimate based on Collector Circle Rate (₹ 30,000 / m²)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
