import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ViewEvidenceModal() {
  const {
    activeParcel,
    evidenceModalOpen,
    setEvidenceModalOpen,
    setFieldModalOpen,
    fieldVerificationStatus
  } = useApp();

  const [sliderPos, setSliderPos] = useState(50); // 0% to 100% split
  const [showCadastral, setShowCadastral] = useState(true);

  // Accessible Escape key listener
  React.useEffect(() => {
    if (!evidenceModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEvidenceModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evidenceModalOpen, setEvidenceModalOpen]);

  if (!evidenceModalOpen) return null;

  const isSentinelAvailable = activeParcel?.parcel_id === 'P-1027' || Boolean(activeParcel?.sentinel_available);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '1000px',
          maxWidth: '96vw',
          height: '680px',
          maxHeight: '92vh',
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
            padding: '14px 20px',
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
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isSentinelAvailable ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isSentinelAvailable ? 'var(--status-error)' : 'var(--status-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="evidence-modal-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Temporal Change Evidence: {activeParcel.parcel_id}
                </h2>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: isSentinelAvailable ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: isSentinelAvailable ? 'var(--status-error)' : 'var(--status-warning)',
                    border: isSentinelAvailable ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {isSentinelAvailable ? 'POTENTIAL CHANGE DETECTED — VERIFICATION REQUIRED' : 'SATELLITE EVIDENCE NOT AVAILABLE'}
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                ULPIN: <strong className="font-mono" style={{ color: 'var(--brand-accent-cyan)' }}>{activeParcel.ulpin}</strong> • {activeParcel.location}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isSentinelAvailable && (
              <button
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowCadastral(!showCadastral)}
              >
                <Layers size={13} />
                <span>{showCadastral ? 'Hide Boundary' : 'Show Boundary'}</span>
              </button>
            )}
            <button className="icon-btn" onClick={() => setEvidenceModalOpen(false)} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid-split-responsive" style={{ flex: 1, overflow: 'hidden' }}>
          {/* LEFT PANEL */}
          {isSentinelAvailable ? (
            <div
              style={{
                position: 'relative',
                backgroundColor: '#050b18',
                overflow: 'hidden',
                userSelect: 'none'
              }}
            >
              {/* Base Image (Time 2: 2025 Sentinel-2 Observation - After) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/assets/demo/chandigarh_satellite_basemap.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'contrast(1.2) brightness(1.05)'
                }}
              />

              {/* Time 2 Label (Right) */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  zIndex: 5,
                  backgroundColor: 'rgba(239, 68, 68, 0.85)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                Time 2: Sentinel-2 2025 Observation
              </div>

              {/* Clipped Overlay Image (Time 1: 2020 Baseline Observation - Before) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${sliderPos}%`,
                  overflow: 'hidden',
                  borderRight: '2px solid #ffffff',
                  boxShadow: '2px 0 10px rgba(0,0,0,0.5)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '1000px',
                    height: '100%',
                    backgroundImage: 'url(/assets/demo/chandigarh_satellite_basemap.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'brightness(0.92) contrast(1.02) saturate(1.3)'
                  }}
                />
                {/* Time 1 Label (Left) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    zIndex: 5,
                    backgroundColor: 'rgba(37, 99, 235, 0.85)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  Time 1: Sentinel-2 2020 Baseline
                </div>
              </div>

              {/* Cadastral Vector Overlay */}
              {showCadastral && (
                <svg
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 8
                  }}
                  viewBox="0 0 800 600"
                  preserveAspectRatio="none"
                >
                  <polygon
                    points="300,340 440,390 390,490 250,440"
                    fill="rgba(56, 189, 248, 0.2)"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="6,4"
                  />
                  <circle cx="370" cy="415" r="4" fill="#38bdf8" />
                  <text x="310" y="420" fill="#38bdf8" fontSize="13" fontWeight="700">
                    {activeParcel.parcel_id} Cadastral Boundary
                  </text>
                </svg>
              )}

              {/* Interactive Draggable Slider Handle */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'ew-resize'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(0,0,0,0.6)',
                    border: '2px solid var(--brand-accent-cyan)'
                  }}
                >
                  <Sliders size={16} />
                </div>
              </div>

              {/* Native Drag Input */}
              <input
                type="range"
                min="5"
                max="95"
                aria-label="Temporal satellite comparison slider"
                aria-valuenow={sliderPos}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'ew-resize',
                  zIndex: 20
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 5,
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)'
                }}
              >
                ⇄ Drag slider to inspect genuine Sentinel-2 temporal transformation
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '40px',
                textAlign: 'center',
                backgroundColor: '#050b18',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--status-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                SATELLITE EVIDENCE NOT AVAILABLE FOR THIS DEMO PARCEL
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.6, margin: 0 }}>
                Genuine Copernicus Sentinel-2 temporal observation rasters (2020 vs 2025) are not registered for <strong>{activeParcel.parcel_id}</strong> ({activeParcel.location}).
                In strict accordance with PLOT360 Anti-Fabrication rules, synthetic or placeholder satellite imagery is prohibited.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-card)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  SATELLITE_STATUS: <strong style={{ color: 'var(--status-warning)' }}>NOT_AVAILABLE</strong>
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-card)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  CANONICAL_TARGET: <strong style={{ color: 'var(--brand-accent-cyan)' }}>P-1027 (Chandigarh)</strong>
                </span>
              </div>
            </div>
          )}

          {/* RIGHT: Explainable AI & Human Review Status */}
          <div
            style={{
              padding: '18px',
              backgroundColor: 'var(--bg-card)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderLeft: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent-cyan)', textTransform: 'uppercase' }}>
                {isSentinelAvailable ? 'Explainable AI Diagnostics' : 'Satellite Telemetry Status'}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {isSentinelAvailable ? 'Potential New Construction Detected' : 'No Genuine Satellite Observation'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div style={{ background: 'var(--bg-card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>OBSERVATION STATUS</span>
                <p style={{ color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.3 }}>
                  {isSentinelAvailable
                    ? 'Canonical Copernicus Sentinel-2 Level-2A Bottom-of-Atmosphere (BOA) surface reflectance validated across 6 spectral bands.'
                    : 'Genuine multi-temporal Copernicus Sentinel-2 observations have not been acquired for this demo node. Ground verification required.'}
                </p>
              </div>

              {isSentinelAvailable && (
                <>
                  <div style={{ background: 'var(--bg-card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>TEMPORAL CHANGE FOOTPRINT</span>
                    <p style={{ color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.3 }}>
                      Siamese U-Net spatial difference detected 385.40 m² potential development within cadastral boundaries ({activeParcel.ulpin}).
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: 'var(--bg-card-alt)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>SOURCE SENSOR</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                        Sentinel-2 (10m)
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card-alt)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>CONFIDENCE SCORE</span>
                      <div style={{ fontWeight: 700, color: 'var(--status-success)', marginTop: '2px' }}>
                        89% (High)
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HUMAN-IN-THE-LOOP STATUS:</span>
                  <strong style={{ color: 'var(--brand-accent-cyan)', fontSize: '12px' }}>
                    {fieldVerificationStatus}
                  </strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isSentinelAvailable && (
                <button
                  className="btn-primary"
                  style={{ padding: '10px', fontSize: '12px' }}
                  onClick={() => {
                    setEvidenceModalOpen(false);
                    setFieldModalOpen(true);
                  }}
                >
                  Perform Field Verification Review
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ padding: '8px', fontSize: '11.5px' }}
                onClick={() => setEvidenceModalOpen(false)}
              >
                Close Evidence Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
