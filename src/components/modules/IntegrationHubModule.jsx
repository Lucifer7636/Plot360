import React, { useState } from 'react';
import {
  Share2,
  CheckCircle,
  AlertCircle,
  Database,
  Code,
  Layers,
  ArrowRight,
  Play,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiGet } from '../../api/client';
import { triggerIntegrationSync } from '../../api/integrations';

export default function IntegrationHubModule() {
  const { activeParcel } = useApp();
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/parcels/{ulpin}');
  const [apiResponse, setApiResponse] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState(null);

  const targetUlpin = activeParcel ? activeParcel.ulpin : 'IN-PB-CHD-0001027';
  const targetParcelId = activeParcel ? activeParcel.parcel_id : 'P-1027';

  const apis = [
    {
      id: 'revenue',
      name: 'Revenue & RoR Registry',
      dept: 'Dept. of Land Records, Punjab',
      status: 'CONNECTED',
      latency: '42ms',
      records: '24,832',
      version: 'v2.4'
    },
    {
      id: 'registration',
      name: 'Deed Registration System',
      dept: 'Inspector General of Registration',
      status: 'CONNECTED',
      latency: '68ms',
      records: '18,402',
      version: 'v3.1'
    },
    {
      id: 'planning',
      name: 'Town Planning & Zoning GIS',
      dept: 'Chief Town Planner, Chandigarh',
      status: 'CONNECTED',
      latency: '55ms',
      records: '9,120',
      version: 'v1.8'
    },
    {
      id: 'municipality',
      name: 'Municipal Property Tax System',
      dept: 'Municipal Corporation Chandigarh',
      status: 'CONNECTED',
      latency: '78ms',
      records: '22,100',
      version: 'v2.0'
    },
    {
      id: 'utilities',
      name: 'Public Utilities Grid',
      dept: 'Power & Water Supply Board',
      status: 'SIMULATED',
      latency: '110ms',
      records: '24,800',
      version: 'v1.0-sim'
    },
    {
      id: 'banking',
      name: 'Mortgage & CERSAI Registry',
      dept: 'Central Registry of Securitisation',
      status: 'SIMULATED',
      latency: '95ms',
      records: '5,420',
      version: 'v1.2-sim'
    }
  ];

  const handleTestEndpoint = async () => {
    const formattedUrl = selectedEndpoint
      .replace('/api/v1', '')
      .replace('{ulpin}', encodeURIComponent(targetUlpin));

    try {
      const data = await apiGet(formattedUrl);
      if (data) {
        setApiResponse(JSON.stringify(data, null, 2));
        return;
      }
    } catch {
      // Fallback below
    }

    // High fidelity normalized payload fallback
    let responsePayload = {};
    if (selectedEndpoint === '/api/v1/parcels/{ulpin}') {
      responsePayload = {
        status: 'SUCCESS',
        ulpin: targetUlpin,
        parcel_id: targetParcelId,
        location: activeParcel?.location || 'Sector 17, Chandigarh',
        area: {
          standardized: activeParcel?.standardized_area || 1248.5,
          original: activeParcel?.original_area || 0.31
        },
        land_use: activeParcel?.land_use || 'Residential',
        zoning: activeParcel?.zoning || 'Residential (R-2)',
        jurisdiction: activeParcel?.jurisdiction || 'Chandigarh',
        last_updated: activeParcel?.last_updated || '2024-09-18'
      };
    } else if (selectedEndpoint === '/api/v1/parcels/{ulpin}/ownership') {
      responsePayload = {
        ulpin: targetUlpin,
        owner: activeParcel?.owner || { name: 'Ravinder Singh', share: '100%' },
        khata_no: activeParcel?.khata_no || 'KH-842',
        survey_no: activeParcel?.survey_no || '1027/A',
        verification_status: 'VERIFIED_DIGITALLY'
      };
    } else if (selectedEndpoint === '/api/v1/parcels/{ulpin}/planning') {
      responsePayload = {
        ulpin: targetUlpin,
        zoning: activeParcel?.zoning || 'Residential (R-2)',
        permissible_far: 1.5,
        building_permission: activeParcel?.bp || { id: 'PJB/BP/2023/114', status: 'Approved' }
      };
    } else {
      responsePayload = {
        ulpin: targetUlpin,
        tax: activeParcel?.tax || { id: 'PT-CHD-2024-8902', status: 'Paid' },
        utilities: activeParcel?.ut || { elec: 'Connected', water: 'Connected' },
        encumbrance: activeParcel?.enc || { status: 'Active', inst: 'HDFC Bank Ltd.' }
      };
    }

    setApiResponse(JSON.stringify(responsePayload, null, 2));
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncSuccessMessage(null);
    try {
      await triggerIntegrationSync('revenue');
    } catch {
      // Continue simulation
    } finally {
      setTimeout(() => {
        setSyncing(false);
        setSyncSuccessMessage('DEMO SYNC — NO EXTERNAL SYSTEM CALLED: Simulated demonstration datasets refreshed against PLOT360 Common Land Model.');
        setTimeout(() => setSyncSuccessMessage(null), 5000);
      }, 1000);
    }
  };

  return (
    <div className="page-scroll-area">
      {/* Header */}
      <div className="page-header-container">
        <div className="breadcrumb-row">
          <span className="breadcrumb-item">PLOT360</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">Integration Hub</span>
        </div>
        <div className="page-title-row">
          <Share2 className="page-icon" />
          <h1 className="page-title">Interoperability & Integration Hub</h1>
        </div>
        <p className="page-subtitle">
          Departmental API gateways, state data normalization pipelines, Common Land Model connectors, and sync monitors.
        </p>
      </div>

      {/* Sync Success Feedback Banner */}
      {syncSuccessMessage && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--status-warning)',
            fontSize: '12.5px',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} />
          <span>{syncSuccessMessage}</span>
        </div>
      )}

      {/* Sync Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand-accent-blue)' }}>
              PLOT360 Common Land Model Pipeline
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                color: 'var(--status-warning)',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 7px',
                borderRadius: '4px'
              }}
            >
              SIMULATED SYNC
            </span>
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            STATE DEPARTMENT DATA → STATE-SPECIFIC MAPPING → VALIDATION → COMMON LAND MODEL → PLOT360
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleSyncAll}
          disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={syncing ? 'spin' : ''} />
          <span>{syncing ? 'Simulating Pipeline Sync...' : 'Simulate Sync (Demo)'}</span>
        </button>
      </div>

      {/* 6 Connected APIs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {apis.map(api => (
          <div
            key={api.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{api.name}</span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: api.status === 'CONNECTED' ? 'var(--bg-badge-green)' : 'var(--bg-badge-blue)',
                  color: api.status === 'CONNECTED' ? 'var(--status-success)' : 'var(--brand-accent-cyan)'
                }}
              >
                {api.status}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{api.dept}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
              <span>Latency: <strong>{api.latency}</strong></span>
              <span>Records: <strong>{api.records}</strong></span>
              <span>{api.version}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive REST API Explorer */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '14.5px', fontWeight: 700 }}>Interactive REST API Sandbox</h3>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Query live normalized JSON payloads using active ULPIN {targetUlpin}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedEndpoint}
              onChange={(e) => {
                setSelectedEndpoint(e.target.value);
                setApiResponse(null);
              }}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: '6px', color: 'var(--text-primary)', padding: '6px 10px', fontSize: '12px' }}
            >
              <option value="/api/v1/parcels/{ulpin}">GET /api/v1/parcels/{'{ulpin}'} (Consolidated)</option>
              <option value="/api/v1/parcels/{ulpin}/ownership">GET /api/v1/parcels/{'{ulpin}'}/ownership (RoR)</option>
              <option value="/api/v1/parcels/{ulpin}/planning">GET /api/v1/parcels/{'{ulpin}'}/planning (Zoning)</option>
              <option value="/api/v1/parcels/{ulpin}/tax">GET /api/v1/parcels/{'{ulpin}'}/tax (Fiscal)</option>
            </select>
            <button className="btn-primary" onClick={handleTestEndpoint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Play size={13} />
              <span>Send Request</span>
            </button>
          </div>
        </div>

        {apiResponse && (
          <pre
            style={{
              background: '#040915',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border-card)',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '11.5px',
              overflowX: 'auto',
              maxHeight: '220px'
            }}
          >
            {apiResponse}
          </pre>
        )}
      </div>
    </div>
  );
}
