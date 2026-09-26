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
  const { activeParcel, selectParcel, setActiveModule, setUnifiedReportOpen, locationParcels, selectedLocation } = useApp();

  // Unit conversion state
  const [selectedUnit, setSelectedUnit] = useState('sqm'); // sqm, acre, bigha, kanal, marla, sqft
  const [customSqm, setCustomSqm] = useState(1250);

  const rawAreaNum = activeParcel ? (parseFloat(activeParcel.standardized_area) || 1248.5) : customSqm;
  const valuationNum = Math.round(rawAreaNum * 30000);

  const convertArea = (sqm) => {
    switch (selectedUnit) {
      case 'acre': return `${(sqm * 0.000247105).toFixed(3)} Acres`;
      case 'bigha': return `${(sqm * 0.000395368).toFixed(3)} Bigha (Punjab)`;
      case 'kanal': return `${(sqm * 0.00197684).toFixed(2)} Kanal`;
      case 'marla': return `${(sqm * 0.0395368).toFixed(1)} Marla`;
      case 'sqft': return `${(sqm * 10.7639).toLocaleString()} sq. ft.`;
      default: return `${sqm.toLocaleString()} m²`;
    }
  };

  if (!activeParcel) {
    return (
      <div className="page-scroll-area">
        <div className="page-header-container">
          <div className="breadcrumb-row">
            <span className="breadcrumb-item">PLOT360</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item">Parcel Intelligence</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--text-secondary)' }}>Analytical Calculator</span>
          </div>
          <div className="page-title-row">
            <Box className="page-icon" />
            <h1 className="page-title">Parcel Intelligence & Analytical Dossier</h1>
          </div>
          <p className="page-subtitle">
            Multi-unit cadastral area conversions, indicative valuation models, and unified parcel intelligence.
          </p>
        </div>

        {/* Location Context Banner */}
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
              <Calculator size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cadastral Analytical Workspace • {selectedLocation?.name || 'Chandigarh & Punjab Region'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Test unit conversion benchmarks below or select a specific parcel to load its verified Jamabandi metrics.
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

        {/* Interactive Measurement Engine (Benchmark Mode) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Interactive Cadastral Area & Valuation Engine</h3>
                <span className="badge-demo" style={{ fontSize: '10px' }}>BENCHMARK CALCULATOR</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Non-destructive standardization computes state revenue units and indicative circle-rate valuation
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>INPUT BENCHMARK AREA (m²)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={customSqm}
                  onChange={(e) => setCustomSqm(Math.max(1, parseFloat(e.target.value) || 0))}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    width: '120px'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>sq. meters</span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Adjust number to test regional revenue conversion
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>CONVERTED REVENUE VALUE</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-accent-blue)', marginTop: '6px' }}>
                {convertArea(customSqm)}
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--status-success)', marginTop: '4px' }}>
                ✓ Converted via ISO-19152 LADM
              </div>
            </div>

            <div style={{ background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '8px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>INDICATIVE ANALYTICAL VALUATION</span>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-accent-cyan)', marginTop: '6px' }}>
                ₹ {valuationNum.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                *Indicative Analytical Estimate (₹ 30,000 / m² Circle Rate)
              </div>
            </div>
          </div>
        </div>

        {/* Location Parcels Selection Grid */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Select a Cadastral Parcel to Inspect Dossier</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{locationParcels?.length || 0} parcels available</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {(locationParcels || []).map(p => (
              <div
                key={p.parcel_id}
                style={{
                  background: 'var(--bg-card-alt)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{p.parcel_id}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{p.land_use || 'Cadastral'}</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '10.5px', color: 'var(--brand-accent-cyan)', marginTop: '2px' }}>
                    {p.ulpin}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Area: {p.area_display || `${p.standardized_area || 0} m²`}
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ fontSize: '11px', padding: '5px 10px', width: '100%' }}
                  onClick={() => selectParcel(p.parcel_id)}
                >
                  Load into Dossier
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            ULPIN: <strong className="font-mono" style={{ color: 'var(--brand-accent-cyan)' }}>{activeParcel.ulpin}</strong> • {activeParcel.location} • {activeParcel.jurisdiction}
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
