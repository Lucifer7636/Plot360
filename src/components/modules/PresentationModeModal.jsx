import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Tv,
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  LogOut,
  CheckCircle,
  Shield,
  Layers,
  MapPin,
  Building,
  FileText,
  AlertTriangle,
  Sparkles,
  Share2,
  Activity,
  Globe,
  Gauge,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PresentationModeModal() {
  const {
    activeParcel,
    activeULPIN,
    selectParcel,
    setActiveModule,
    setEvidenceModalOpen,
    setFieldModalOpen,
    setUnifiedReportOpen,
    evidenceModalOpen,
    fieldModalOpen,
    currentRole,
    currentLanguage,
    currentJurisdiction,
    currentLocation,
    changeLocation,
    demoLocations,
    locationParcels,
    parcels,
    t,
    isPresentationActive,
    isPresentationGateOpen,
    setIsPresentationGateOpen,
    presentationStep,
    setPresentationStep,
    presentationRunning,
    setPresentationRunning,
    startPresentation,
    exitPresentation
  } = useApp();

  // Demonstration parcel choices across demo catalog
  const demoParcelsList = useMemo(() => [
    {
      id: 'P-1027',
      name: 'P-1027: Chandigarh AI Sentinel-2 Change Alert & Approved Building',
      ulpin: 'IN-PB-CHD-0001027',
      loc: 'Chandigarh',
      sentinelAvailable: true,
      desc: 'Ground transformation alert with genuine Copernicus Sentinel-2 BOA reflectance temporal differencing (2020 vs 2025).'
    },
    {
      id: 'P-1028',
      name: 'P-1028: Chandigarh Area Discrepancy Conflict (RoR 1,416m² vs Tax 1,530m²)',
      ulpin: 'IN-PB-CHD-0001028',
      loc: 'Chandigarh',
      sentinelAvailable: false,
      desc: 'Cross-departmental area mismatch flagged between Revenue Jamabandi and Municipal Property Tax.'
    },
    {
      id: 'P-1025',
      name: 'P-1025: Chandigarh Commercial Complex (Amrik Builders)',
      ulpin: 'IN-PB-CHD-0001025',
      loc: 'Chandigarh',
      sentinelAvailable: false,
      desc: 'Commercial high-density plinth with multi-floor sanction and active mortgage encumbrance.'
    },
    {
      id: 'P-1009',
      name: 'P-1009: Chandigarh Institutional Zone (Govt Medical College)',
      ulpin: 'IN-PB-CHD-0001009',
      loc: 'Chandigarh',
      sentinelAvailable: false,
      desc: 'Public healthcare facility parcel with strict statutory buffer and green belt zoning.'
    },
    {
      id: 'P-3001',
      name: 'P-3001: Bengaluru Outer Ring Road IT Tech Corridor',
      ulpin: 'IN-KA-BLR-0003001',
      loc: 'Bengaluru',
      sentinelAvailable: false,
      desc: 'High-tech commercial enterprise development with Karnataka Khata & BBMP tax records.'
    },
    {
      id: 'P-7001',
      name: 'P-7001: Lucknow Gomti Nagar Commercial Hub',
      ulpin: 'IN-UP-LKO-0007001',
      loc: 'Lucknow',
      sentinelAvailable: false,
      desc: 'Commercial mixed-use corridor under LDA master plan with digital registry linkage.'
    }
  ], []);

  // Selected parcel candidate inside the Entry Gate before explicit start
  const [gateSelectedId, setGateSelectedId] = useState('P-1027');
  const [gateSearchQuery, setGateSearchQuery] = useState('');

  // UI state for floating controller
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 1.5x, 2x
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const timerRef = useRef(null);

  // Sync gate selection with active parcel on open
  useEffect(() => {
    if (isPresentationGateOpen) {
      setGateSelectedId(activeParcel?.parcel_id || 'P-1027');
    }
  }, [isPresentationGateOpen, activeParcel]);

  // 20-Step Cinematic Guided Demo Sequence aligned with SIH Problem & Architecture
  const presentationSteps = useMemo(() => [
    {
      step: 1,
      title: '1. Land Governance Problem: Siloed Databases',
      desc: 'In India, land administration historically suffers from fragmented records across 6+ departments: Revenue (RoR Jamabandi), Registration (Deeds), Survey & Cadastre, Town Planning (Zoning/Master Plans), Municipal Corporation (Property Tax), and Banks (Mortgages). Silos cause title disputes, unauthorized constructions, and revenue leakages.',
      actionLabel: 'Initialize PLOT360 Unified Land Stack',
      category: 'PROBLEM'
    },
    {
      step: 2,
      title: '2. Common Identifier: 14-Digit ULPIN Standard',
      desc: `PLOT360 establishes the 14-digit Unique Land Parcel Identification Number (e.g. ${activeULPIN || activeParcel?.ulpin || 'IN-PB-CHD-0001027'}) as the single authoritative anchor linking all departmental records deterministically.`,
      actionLabel: 'Bind Parcel to ULPIN Registry',
      category: 'IDENTIFIER'
    },
    {
      step: 3,
      title: '3. Multi-Plot GIS Cadastral Basemap',
      desc: 'High-resolution Google Maps basemaps integrated with georeferenced vector cadastral polygons and centroid coordinates. Every parcel in the jurisdiction is interactively selectable with bounding box filtering.',
      actionLabel: 'Examine Georeferenced Cadastral Vector',
      category: 'GIS'
    },
    {
      step: 4,
      title: '4. Governance & RoR (Jamabandi Record of Rights)',
      desc: 'Demonstration model of state Land Records Department records (Jamabandi Record of Rights) showing tenure type (Freehold/Leasehold), joint ownership shares, cultivation status, and latest mutation transaction timestamp.',
      actionLabel: 'Verify Record of Rights',
      category: 'REVENUE'
    },
    {
      step: 5,
      title: '5. Ownership & Registered Deeds',
      desc: 'Demonstration Sub-Registrar Department integration retrieving registered conveyance deeds, registered sale agreements, stamp duty receipts, and digital transfer histories.',
      actionLabel: 'Audit Registered Title Deeds',
      category: 'REGISTRATION'
    },
    {
      step: 6,
      title: '6. Master Plan, Land Use & Zoning',
      desc: 'Town and Country Planning integration framework validating permissible land use categories (Residential / Commercial / Agricultural / Mixed-Use), master plan alignment, and Floor Area Ratio (FAR) ceilings.',
      actionLabel: 'Verify Permissible Land Use & Zoning',
      category: 'PLANNING'
    },
    {
      step: 7,
      title: '7. Building Sanction & Built-up Compliance',
      desc: 'Demonstration Municipal Urban Local Body (ULB) building sanction ledger cross-referencing approved plinth area, permitted floors, building sanction order number, and construction completion certificates.',
      actionLabel: 'Cross-Check Building Sanction Plan',
      category: 'BUILDING'
    },
    {
      step: 8,
      title: '8. Liabilities, Mortgages & Encumbrances',
      desc: 'Demonstration Banking & CERSAI integration model detecting equitable mortgages, financial liens, hypothecation records, and civil court stay orders. In citizen role, confidential financial figures are masked under RBAC.',
      actionLabel: 'Inspect Financial Liens & Encumbrances',
      category: 'LIABILITIES'
    },
    {
      step: 9,
      title: '9. Property Tax Assessment & Municipal Valuation',
      desc: 'Municipal Corporation property tax demonstration ledger showing annual rateable value, GIS-based built-up assessment vs assessed area, payment status, and municipal property identifier.',
      actionLabel: 'Review Property Tax Assessment Ledger',
      category: 'TAXATION'
    },
    {
      step: 10,
      title: '10. Utilities & Infrastructure Connectivity',
      desc: 'Demonstration multi-utility integration modeling Jal Board (Water/Sewerage), State Power DISCOM, and telecom infrastructure easements, identifying municipal service connections.',
      actionLabel: 'Verify Utility Meter Connections',
      category: 'UTILITIES'
    },
    {
      step: 11,
      title: '11. Environmental & Green Belt Restrictions',
      desc: 'Spatial intersection analysis against statutory ecological protection zones, forest buffers, water body catchment zones, and heritage conservation corridors.',
      actionLabel: 'Check Statutory Buffer Restrictions',
      category: 'RESTRICTIONS'
    },
    {
      step: 12,
      title: '12. Temporal Satellite Change Evidence',
      desc: 'Genuine Copernicus Sentinel-2 Bottom-of-Atmosphere (BOA) surface reflectance differencing (2020 vs 2025) across 6 spectral bands. Draggable split slider reveals actual spatial ground development on verified demonstration targets.',
      actionLabel: 'Launch Sentinel-2 Draggable Slider',
      category: 'SATELLITE'
    },
    {
      step: 13,
      title: '13. Explainable AI & Human-in-the-Loop Review',
      desc: 'Siamese U-Net spatial feature extraction highlights candidate building anomalies. Crucially, AI never declares illegality; it queues evidence for field verification officers with geo-tagged photographic inspection.',
      actionLabel: 'Queue for Field Verification Officer',
      category: 'AI_REVIEW'
    },
    {
      step: 14,
      title: '14. Automated Cross-Departmental Conflict Engine',
      desc: 'Continuous consistency checking across departmental records flags discrepancies (e.g. RoR land area vs Tax registered area, or building construction on agricultural zoning).',
      actionLabel: 'Analyze Cross-Department Conflicts',
      category: 'CONFLICTS'
    },
    {
      step: 15,
      title: '15. Single-Window Citizen Land Services',
      desc: 'Citizen self-service portal for online mutation requests, Non-Encumbrance Certificate (NEC) issuance, building sanction e-filing, and property tax payment with transparent SLA tracking.',
      actionLabel: 'Explore Citizen Digital Portal',
      category: 'CITIZEN'
    },
    {
      step: 16,
      title: '16. Inter-Departmental Workflow & Case Tracking',
      desc: 'Unified state-machine lifecycle tracking service requests across Revenue, Town Planning, and Registration with SLA escalation, digital signature milestones, and role assignments.',
      actionLabel: 'View Active Departmental Workflows',
      category: 'WORKFLOW'
    },
    {
      step: 17,
      title: '17. Geospatial Analytics & Predictive Decision Support',
      desc: 'Executive dashboard visualizing urban expansion frontiers, tax assessment shortfall heatmaps, agricultural land conversion trends, and compliance risk index by ward/tehsil.',
      actionLabel: 'Inspect Geospatial Analytics Hub',
      category: 'ANALYTICS'
    },
    {
      step: 18,
      title: '18. Interoperability Hub & Legacy API Adapters',
      desc: 'RESTful microservice connectors with OpenAPI 3.1 specifications and cryptographic audit trails, demonstrating how legacy state databases connect to PLOT360 without database overhaul.',
      actionLabel: 'Inspect Interoperability Hub',
      category: 'INTEGRATION'
    },
    {
      step: 19,
      title: '19. Multi-State Jurisdiction Architecture',
      desc: 'Federated multi-jurisdiction engine dynamically switching state terminology (e.g., Jamabandi in Punjab/Haryana vs 7/12 Extract in Maharashtra vs Khata in Karnataka) across 15 national study locations.',
      actionLabel: 'Demonstrate Multi-Jurisdiction Engine',
      category: 'JURISDICTIONS'
    },
    {
      step: 20,
      title: '20. Scalability & Nationwide Deployment Readiness',
      desc: 'Cloud-native, containerized architecture supporting nationwide ULPIN scale (140+ million land parcels), zero synthetic imagery, strict server-side RBAC, and full quad-lingual accessibility.',
      actionLabel: 'Conclude Tour & Return to Explorer',
      category: 'SCALE'
    }
  ], [activeULPIN, activeParcel]);

  const currentStep = presentationSteps[presentationStep] || presentationSteps[0];

  // Role permissions check for presentation stages
  const getRoleStepStatus = (stepCategory) => {
    if (currentRole === 'citizen') {
      if (['LIABILITIES', 'CONFLICTS', 'WORKFLOW'].includes(stepCategory)) {
        return {
          label: 'Citizen View (Protected)',
          alert: 'Internal officer inspection notes and confidential mortgage amounts are masked under RBAC.'
        };
      }
    }
    return { label: `Authorized (${currentRole})`, alert: null };
  };

  // Check whether genuine Copernicus Sentinel-2 satellite data exists for the target parcel
  const isSatelliteAvailable = Boolean(
    activeParcel?.parcel_id === 'P-1027' || activeParcel?.sentinel_available
  );

  // Perform step action dynamically
  const executeStepAction = (stepIdx) => {
    const step = presentationSteps[stepIdx];
    if (!step) return;

    if (stepIdx === 0) {
      // 1. Problem - ensure Explorer is active view
      setActiveModule('explorer');
    } else if (stepIdx === 1) {
      // 2. ULPIN - ensure target parcel is bound
      if (activeParcel?.parcel_id) {
        selectParcel(activeParcel.parcel_id);
      }
      setActiveModule('explorer');
    } else if (stepIdx === 2) {
      // 3. GIS Cadastral
      setActiveModule('explorer');
    } else if (stepIdx >= 3 && stepIdx <= 10) {
      // 4-11: Data inspection steps (Records, Ownership, Planning, Building, Liabilities, Tax, Utilities, Restrictions)
      setActiveModule('explorer');
    } else if (stepIdx === 11) {
      // 12. Satellite Evidence - opens genuine Sentinel-2 or truthful NOT_AVAILABLE state
      setEvidenceModalOpen(true);
    } else if (stepIdx === 12) {
      // 13. AI Field review
      setEvidenceModalOpen(false);
      setFieldModalOpen(true);
    } else if (stepIdx === 13) {
      // 14. Conflicts
      setFieldModalOpen(false);
      if (currentRole !== 'citizen') {
        setActiveModule('analytics');
      } else {
        setActiveModule('explorer');
      }
    } else if (stepIdx === 14) {
      // 15. Citizen Services
      setActiveModule('citizen');
    } else if (stepIdx === 15) {
      // 16. Workflow
      setActiveModule('records');
    } else if (stepIdx === 16) {
      // 17. Analytics
      setActiveModule('analytics');
    } else if (stepIdx === 17) {
      // 18. Integrations
      setActiveModule('integrations');
    } else if (stepIdx === 18) {
      // 19. Multi-jurisdiction
      setActiveModule('explorer');
    } else if (stepIdx === 19) {
      // 20. Conclusion
      setActiveModule('explorer');
    }
  };

  // Step advancement handlers
  const handleNext = () => {
    if (presentationStep < presentationSteps.length - 1) {
      const nextIdx = presentationStep + 1;
      setPresentationStep(nextIdx);
      executeStepAction(nextIdx);
    } else {
      setPresentationRunning(false);
      handleExit();
    }
  };

  const handlePrev = () => {
    if (presentationStep > 0) {
      const prevIdx = presentationStep - 1;
      setPresentationStep(prevIdx);
      executeStepAction(prevIdx);
    }
  };

  const handleRestart = () => {
    setPresentationStep(0);
    executeStepAction(0);
  };

  const handleExit = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    exitPresentation();
  };

  // Automated playback timer (uses clearTimeout, never clearInterval)
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (
      presentationRunning &&
      !isPresentationGateOpen &&
      !evidenceModalOpen &&
      !fieldModalOpen
    ) {
      const baseDelay = 4500; // 4.5s at 1x
      const delay = Math.round(baseDelay / playbackSpeed);

      timerRef.current = setTimeout(() => {
        if (presentationStep < presentationSteps.length - 1) {
          const nextIdx = presentationStep + 1;
          setPresentationStep(nextIdx);
          executeStepAction(nextIdx);
        } else {
          setPresentationRunning(false);
        }
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    presentationRunning,
    presentationStep,
    playbackSpeed,
    isPresentationGateOpen,
    evidenceModalOpen,
    fieldModalOpen
  ]);

  // Pause autoplay immediately when evidence or field verification modal opens
  useEffect(() => {
    if (evidenceModalOpen || fieldModalOpen) {
      if (presentationRunning) {
        setPresentationRunning(false);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [evidenceModalOpen, fieldModalOpen, presentationRunning, setPresentationRunning]);

  // Keyboard navigation & accessibility
  useEffect(() => {
    if (!isPresentationActive) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;

      if (e.key === 'Escape') {
        if (!evidenceModalOpen && !fieldModalOpen) {
          handleExit();
        }
      } else if (e.key === 'ArrowRight' && !isPresentationGateOpen) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isPresentationGateOpen) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' && !isPresentationGateOpen) {
        e.preventDefault();
        setPresentationRunning((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPresentationActive,
    isPresentationGateOpen,
    presentationStep,
    evidenceModalOpen,
    fieldModalOpen
  ]);

  // Return nothing if Presentation Mode is not active
  if (!isPresentationActive) {
    return null;
  }

  // Filtered parcels for the Entry Gate
  const filteredGateParcels = demoParcelsList.filter((p) => {
    if (!gateSearchQuery.trim()) return true;
    const q = gateSearchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.ulpin.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.loc.toLowerCase().includes(q)
    );
  });

  const selectedGateParcel = demoParcelsList.find((p) => p.id === gateSelectedId) || demoParcelsList[0];

  // ----------------------------------------------------
  // VIEW 1: ENTRY GATE MODAL
  // ----------------------------------------------------
  if (isPresentationGateOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 24, 0.88)',
          backdropFilter: 'blur(10px)',
          zIndex: 1060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="presentation-gate-title"
      >
        <div
          style={{
            width: 'min(780px, 96vw)',
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
          {/* Gate Header */}
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
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--brand-accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Tv size={20} />
              </div>
              <div>
                <h2
                  id="presentation-gate-title"
                  style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
                >
                  Start Presentation Mode
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Select exactly ONE target parcel or location to anchor the 20-step demonstration.
                </p>
              </div>
            </div>
            <button
              className="icon-btn"
              onClick={handleExit}
              aria-label="Close presentation mode"
              title="Close Presentation Mode"
            >
              <X size={18} />
            </button>
          </div>

          {/* Gate Body: Search & Parcel Cards */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Search demonstration parcels by ULPIN, Parcel ID, or Location..."
                value={gateSearchQuery}
                onChange={(e) => setGateSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-alt)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
                aria-label="Filter demonstration parcels"
              />
            </div>

            {/* Selection Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {filteredGateParcels.map((p) => {
                const isSelected = gateSelectedId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setGateSelectedId(p.id)}
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGateSelectedId(p.id);
                      }
                    }}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? 'var(--brand-accent-blue)' : 'var(--border-subtle)'}`,
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-card-alt)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {p.id}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: p.sentinelAvailable ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.06)',
                            color: p.sentinelAvailable ? 'var(--brand-accent-cyan)' : 'var(--text-muted)',
                            border: p.sentinelAvailable ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid var(--border-subtle)'
                          }}
                        >
                          {p.sentinelAvailable ? 'Sentinel-2 Data Available' : 'Cadastral Demo Record'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--brand-accent-cyan)', marginTop: '2px', fontWeight: 600 }}>
                        ULPIN: {p.ulpin}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.35 }}>
                        {p.desc}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--brand-accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '1.5px solid var(--border-subtle)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Target Summary Banner */}
            {selectedGateParcel && (
              <div
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info size={16} style={{ color: 'var(--brand-accent-cyan)', flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                    Active Target: <strong>{selectedGateParcel.id}</strong> ({selectedGateParcel.ulpin}) • {selectedGateParcel.loc}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {selectedGateParcel.sentinelAvailable
                    ? 'Copernicus Sentinel-2 Temporal Data: Registered'
                    : 'Sentinel-2 Temporal Data: Not Registered (Anti-fabrication enforced)'}
                </div>
              </div>
            )}
          </div>

          {/* Gate Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-card-alt)'
            }}
          >
            <button
              className="btn-secondary"
              onClick={handleExit}
              aria-label="Cancel presentation"
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => startPresentation(gateSelectedId)}
              disabled={!gateSelectedId}
              aria-label="Start presentation with selected target"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                padding: '8px 20px',
                opacity: gateSelectedId ? 1 : 0.5
              }}
            >
              <Play size={14} />
              <span>Start Presentation (20 Steps)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: PERSISTENT FLOATING CONTROLLER / DOCK
  // ----------------------------------------------------
  const roleInfo = getRoleStepStatus(currentStep.category);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(1100px, calc(100vw - 32px))',
        zIndex: 1050,
        backgroundColor: 'rgba(10, 16, 32, 0.96)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'all 0.25s ease'
      }}
      role="region"
      aria-label="Presentation Mode Dock"
    >
      {/* 1. Progress Bar */}
      <div
        role="progressbar"
        aria-valuenow={presentationStep + 1}
        aria-valuemin={1}
        aria-valuemax={presentationSteps.length}
        aria-label={`Step ${presentationStep + 1} of ${presentationSteps.length}`}
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          position: 'relative'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((presentationStep + 1) / presentationSteps.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--brand-accent-blue), var(--brand-accent-cyan))',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* 2. Primary Control Bar */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: isDockCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {presentationRunning ? (
            <button
              className="btn-secondary"
              onClick={() => setPresentationRunning(false)}
              aria-label="Pause automated tour"
              title="Pause Automated Tour"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.35)'
              }}
            >
              <Pause size={14} />
              <span>Pause</span>
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setPresentationRunning(true)}
              aria-label="Play automated tour"
              title="Resume Automated Tour"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                fontSize: '12px'
              }}
            >
              <Play size={14} />
              <span>{presentationStep === 0 ? 'Play Tour' : 'Resume'}</span>
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={handlePrev}
            disabled={presentationStep === 0}
            aria-label="Previous step"
            title="Previous Stage"
            style={{ padding: '6px 9px' }}
          >
            <SkipBack size={14} />
          </button>

          <button
            className="btn-secondary"
            onClick={handleNext}
            disabled={presentationStep === presentationSteps.length - 1}
            aria-label="Next step"
            title="Next Stage"
            style={{ padding: '6px 9px' }}
          >
            <SkipForward size={14} />
          </button>

          <button
            className="btn-secondary"
            onClick={handleRestart}
            aria-label="Restart tour from step 1"
            title="Restart from Step 1"
            style={{ padding: '6px 9px' }}
          >
            <RotateCcw size={14} />
          </button>

          {/* Speed Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                aria-label={`Playback speed ${s}x`}
                style={{
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  borderRadius: '5px',
                  border: playbackSpeed === s ? '1px solid var(--brand-accent-blue)' : '1px solid rgba(255,255,255,0.1)',
                  background: playbackSpeed === s ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255,255,255,0.04)',
                  color: playbackSpeed === s ? 'var(--brand-accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Stage Header & Target Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--brand-accent-cyan)'
            }}
          >
            STEP {currentStep.step} / {presentationSteps.length}
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {currentStep.title}
          </div>

          <div
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Target: <strong style={{ color: 'var(--brand-accent-cyan)' }}>{activeParcel?.parcel_id || 'P-1027'}</strong>
          </div>
        </div>

        {/* Right Controls: Step Action, Collapse & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-primary"
            onClick={() => {
              executeStepAction(presentationStep);
              handleNext();
            }}
            aria-label={`Execute stage action: ${currentStep.actionLabel}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px'
            }}
          >
            <span>{currentStep.actionLabel}</span>
            <SkipForward size={13} />
          </button>

          <button
            className="btn-secondary"
            onClick={() => setIsPresentationGateOpen(true)}
            aria-label="Switch demonstration target parcel"
            title="Switch Target Parcel"
            style={{ padding: '6px 10px', fontSize: '11px' }}
          >
            Switch Target
          </button>

          <button
            className="icon-btn"
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            aria-label={isDockCollapsed ? 'Expand presentation dock' : 'Collapse presentation dock'}
            title={isDockCollapsed ? 'Expand Details' : 'Collapse Details'}
          >
            {isDockCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            className="btn-secondary"
            onClick={handleExit}
            aria-label="Exit presentation mode"
            title="Exit Presentation Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              fontSize: '12px'
            }}
          >
            <LogOut size={13} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* 3. Expanded Details Drawer */}
      {!isDockCollapsed && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(5, 10, 24, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--brand-accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {currentStep.category} ARCHITECTURE STAGE
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {roleInfo.label}
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, maxWidth: '960px' }}>
            {currentStep.desc}
          </p>

          {/* Step 12 Truthful Satellite Indicator */}
          {presentationStep === 11 && (
            <div
              style={{
                backgroundColor: isSatelliteAvailable ? 'rgba(56, 189, 248, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: isSatelliteAvailable ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: isSatelliteAvailable ? 'var(--brand-accent-cyan)' : 'var(--status-warning)'
              }}
            >
              {isSatelliteAvailable ? (
                <>
                  <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                  <span>
                    Genuine Copernicus Sentinel-2 BOA Surface Reflectance Differencing Available (2020 vs 2025) for <strong>{activeParcel?.parcel_id}</strong>.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>
                    Temporal Sentinel-2 satellite observation rasters are not registered for <strong>{activeParcel?.parcel_id}</strong>. In strict accordance with PLOT360 Anti-Fabrication rules, synthetic or placeholder satellite imagery is prohibited.
                  </span>
                </>
              )}
            </div>
          )}

          {/* Role Protection Warning (e.g. for Citizen Role) */}
          {roleInfo.alert && (
            <div
              style={{
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: '#eab308'
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>{roleInfo.alert}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
