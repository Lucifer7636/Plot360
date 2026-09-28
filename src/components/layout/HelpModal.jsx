import React from 'react';
import { X, BookOpen, ShieldCheck, MapPin, Database, Key, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function HelpModal() {
  const { helpModalOpen, setHelpModalOpen, t } = useApp();

  if (!helpModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={() => setHelpModalOpen(false)}
    >
      <div
        style={{
          width: '840px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--brand-accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                PLOT360 — Platform User Guide & Architecture
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Smart India Hackathon • Problem Statement — Unified Land Governance in India
              </div>
            </div>
          </div>
          <button
            onClick={() => setHelpModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: Overview */}
          <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--brand-accent-cyan)', fontWeight: 700, fontSize: '13px' }}>
              <BookOpen size={16} />
              About PLOT360 & SIH Problem Statement
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              PLOT360 is an integrated land governance platform addressing fragmented cadastral and administrative databases across India. By unifying Cadastral GIS Vectors, Record of Rights (RoR), Sub-Registrar Deed Registrations, Municipal Master Plans, Property Tax, and Sentinel-2 Satellite Change Monitoring under a standardized 14-digit ULPIN, PLOT360 enables real-time cross-departmental synchronization, conflict detection, and transparent citizen services.
            </p>
          </div>

          {/* Section 2: ULPIN Specification */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--brand-accent-blue)', fontWeight: 700, fontSize: '13px' }}>
              <MapPin size={16} />
              14-Digit Standard ULPIN Model
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { code: 'IN', label: 'Country Code', desc: 'Republic of India standard prefix' },
                { code: 'PB / UP / KA', label: 'State / UT Code', desc: '2-letter ISO 3166-2 state code' },
                { code: 'CHD / LKO', label: 'Location ID', desc: '3-letter district/tehsil locator' },
                { code: '0001027', label: 'Unique Parcel ID', desc: 'Immutable cadastral sequence identifier' }
              ].map(item => (
                <div key={item.code} style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--brand-accent-cyan)' }}>{item.code}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Multi-Plot GIS Navigation */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--status-success)', fontWeight: 700, fontSize: '13px' }}>
              <Database size={16} />
              Cadastral Multi-Plot GIS Navigation
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              • <strong>Select Location / Jurisdiction:</strong> Use the topbar controls to change geographic context. The GIS camera flies smoothly to the target sector.<br />
              • <strong>Click Any Polygon:</strong> Every plot polygon on the map is a backend-connected entity. Clicking it selects the parcel and loads its verified cross-departmental records.<br />
              • <strong>Toggle Layers:</strong> Use the Layers icon in the map toolbar to toggle Satellite Basemap, Zoning Overlays, Cadastral Vectors, and Protected Buffers.
            </div>
          </div>

          {/* Section 4: RBAC Matrix */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--brand-orange)', fontWeight: 700, fontSize: '13px' }}>
              <ShieldCheck size={16} />
              Role-Based Access Control (RBAC) Matrix (8 Roles)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '6px 8px' }}>Role</th>
                    <th style={{ padding: '6px 8px' }}>Scope</th>
                    <th style={{ padding: '6px 8px' }}>Permitted Domains</th>
                  </tr>
                </thead>
                <tbody style={{ color: 'var(--text-secondary)' }}>
                  {[
                    { role: 'Citizen', scope: 'Public', perm: 'Public land record verification, service requests, tracking' },
                    { role: 'Revenue Officer', scope: 'Departmental', perm: 'RoR mutation, dispute adjudication, cadastral demarcation' },
                    { role: 'Registration Officer', scope: 'Departmental', perm: 'Deed registration, stamp duty verification, encumbrances' },
                    { role: 'Planning Officer', scope: 'Departmental', perm: 'Zoning compliance, master plan review, building approvals' },
                    { role: 'Municipal Officer', scope: 'Departmental', perm: 'Building sanctions, civic infrastructure, utilities' },
                    { role: 'Tax Officer', scope: 'Departmental', perm: 'Property tax assessments, demand notices, arrears recovery' },
                    { role: 'Administrator', scope: 'Administrative', perm: 'Full system configuration, user roles, simulated connectors' },
                    { role: 'Auditor', scope: 'Oversight', perm: 'Compliance verification, immutable audit logs, tamper audits' }
                  ].map(r => (
                    <tr key={r.role} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.role}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', fontSize: '10px' }}>
                          {r.scope}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>{r.perm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-alt)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            PLOT360 • Production Release Candidate
          </div>
          <button
            onClick={() => setHelpModalOpen(false)}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--brand-accent-blue)',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
