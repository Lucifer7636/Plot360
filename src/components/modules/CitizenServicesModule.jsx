import React, { useState } from 'react';
import {
  Users,
  Search,
  FileCheck,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createServiceRequest, getServiceRequests } from '../../api/citizen';

export default function CitizenServicesModule() {
  const { activeParcel, selectParcel, parcels } = useApp();

  const [citizenQuery, setCitizenQuery] = useState('');
  const [selectedService, setSelectedService] = useState('demarcation');
  const [applicantName, setApplicantName] = useState('Ravinder Singh');
  const [applicantPhone, setApplicantPhone] = useState('+91 98765 43210');
  const [requestNotes, setRequestNotes] = useState('Request for boundary pillar verification with adjoining parcel P-1026.');

  const [submittedRequests, setSubmittedRequests] = useState(() => {
    const saved = localStorage.getItem('plot360_citizen_requests');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'SR-2026-1049',
            parcel_id: 'P-1027',
            ulpin: 'IN-PB-CHD-0001027',
            service: 'Certified RoR Copy (Fard)',
            date: '18 Sep 2026',
            status: 'COMPLETED',
            step: 5
          },
          {
            id: 'SR-2026-1088',
            parcel_id: 'P-1027',
            ulpin: 'IN-PB-CHD-0001027',
            service: 'Building Permission NOC',
            date: '19 Sep 2026',
            status: 'DEPARTMENT_REVIEW',
            step: 4
          }
        ];
  });

  const [newRequestSuccess, setNewRequestSuccess] = useState(null);

  const [searchError, setSearchError] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError(null);
    if (!citizenQuery.trim()) return;
    const found = parcels.find(
      p =>
        p.parcel_id.toLowerCase() === citizenQuery.toLowerCase() ||
        p.ulpin.toLowerCase() === citizenQuery.toLowerCase()
    );
    if (found) {
      selectParcel(found.parcel_id);
    } else {
      setSearchError(`No parcel found matching "${citizenQuery}". Try P-1027 or IN-PB-CHD-0001027.`);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const fallbackId = `SR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    let persistentId = fallbackId;

    try {
      const res = await createServiceRequest({
        service_type: selectedService,
        parcel_id: activeParcel ? activeParcel.parcel_id : 'P-1027',
        ulpin: activeParcel ? activeParcel.ulpin : 'IN-PB-CHD-0001027',
        applicant_name: applicantName,
        applicant_phone: applicantPhone,
        notes: requestNotes
      });
      if (res && res.request_id) {
        persistentId = res.request_id;
      }
    } catch (_) {
      // Offline fallback
    }

    const newReq = {
      id: persistentId,
      parcel_id: activeParcel ? activeParcel.parcel_id : 'P-1027',
      ulpin: activeParcel ? activeParcel.ulpin : 'IN-PB-CHD-0001027',
      service:
        selectedService === 'demarcation'
          ? 'Cadastral Boundary Demarcation'
          : selectedService === 'mutation'
          ? 'Title Mutation (Intiqal)'
          : selectedService === 'noc'
          ? 'Municipal No-Objection Certificate'
          : 'Certified Land Record (Nakall)',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'SUBMITTED',
      step: 1
    };

    const updated = [newReq, ...submittedRequests];
    setSubmittedRequests(updated);
    localStorage.setItem('plot360_citizen_requests', JSON.stringify(updated));
    setNewRequestSuccess(persistentId);
  };

  return (
    <div className="page-scroll-area">
      {/* Header */}
      <div className="page-header-container">
        <div className="breadcrumb-row">
          <span className="breadcrumb-item">PLOT360</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item">Citizen Services</span>
        </div>
        <div className="page-title-row">
          <Users className="page-icon" />
          <h1 className="page-title">Citizen Land Services & Tracking</h1>
        </div>
        <p className="page-subtitle">
          Public parcel lookup, single-window service applications, and real-time transaction lifecycle tracking.
        </p>
      </div>

      {/* Citizen Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '10px', background: 'var(--bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              id="citizen-land-search"
              aria-label="Search Land by ULPIN or Parcel ID"
              type="text"
              className="search-input"
              style={{ height: '40px', paddingLeft: '38px', fontSize: '13px' }}
              placeholder="Search your Land by ULPIN, Parcel ID, Survey No., or Location (e.g. IN-PB-CHD-0001027 or P-1027)..."
              value={citizenQuery}
              onChange={(e) => {
                setCitizenQuery(e.target.value);
                setSearchError(null);
              }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '0 20px', fontSize: '13px' }}>
            Search Land
          </button>
        </div>
        {searchError && (
          <div style={{ fontSize: '11.5px', color: 'var(--status-error)', padding: '0 4px' }}>
            {searchError}
          </div>
        )}
      </form>

      {/* Grid: Left (Service Request Submission) + Right (Application Tracking) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px' }}>
        {/* Service Request Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Apply for Citizen Land Service</h3>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Selected Parcel: <strong style={{ color: 'var(--brand-accent-blue)' }}>{activeParcel?.parcel_id || 'P-1027'}</strong> ({activeParcel?.ulpin || 'IN-PB-CHD-0001027'})
          </div>

          <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label htmlFor="citizen-service-type" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>SERVICE TYPE</label>
              <select
                id="citizen-service-type"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
              >
                <option value="demarcation">Cadastral Boundary Demarcation (Hadd Shikni)</option>
                <option value="mutation">Title Mutation / Intiqal Application</option>
                <option value="noc">Municipal Clearance / NOC</option>
                <option value="ror">Certified Copy of Jamabandi (Fard)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label htmlFor="citizen-applicant-name" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>APPLICANT NAME</label>
                <input
                  id="citizen-applicant-name"
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  style={{ width: '100%', marginTop: '4px', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
              <div>
                <label htmlFor="citizen-applicant-phone" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>MOBILE NUMBER</label>
                <input
                  id="citizen-applicant-phone"
                  type="text"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  style={{ width: '100%', marginTop: '4px', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="citizen-request-notes" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>DETAILS & REMARKS</label>
              <textarea
                id="citizen-request-notes"
                rows={3}
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                style={{ width: '100%', marginTop: '4px', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-card)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', resize: 'none' }}
              />
            </div>

            {newRequestSuccess && (
              <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-success)', fontSize: '11.5px', fontWeight: 600 }}>
                ✓ Application Generated! Request ID: <strong>{newRequestSuccess}</strong>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ padding: '10px', marginTop: '4px' }}>
              Submit Service Request
            </button>
          </form>
        </div>

        {/* Real-time Tracking Stepper */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Track Service Request: SR-2026-1088</h3>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Service: <strong>Building Permission NOC</strong> • Parcel: <strong>P-1027</strong>
          </div>

          {/* Interactive Stepper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-card-alt)', padding: '14px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Application Submitted</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>19 Sep 2026, 09:30 AM — Digital application filed with Aadhaar KYC</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Documents Received</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>19 Sep 2026, 11:15 AM — Title deed and site architecture plan uploaded</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Cadastral Boundary Verification</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>19 Sep 2026, 02:40 PM — ULPIN automated cross-check passed with 0 overlaps</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand-accent-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>●</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-accent-cyan)' }}>Department Review in Progress</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Town Planning Officer review underway (Estimated completion: 24 hours)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border-card)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>○</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700 }}>Final Approval & Digital Certificate Issue</div>
                <div style={{ fontSize: '10.5px' }}>Cryptographically signed NOC issued with QR code</div>
              </div>
            </div>
          </div>

          {/* Past requests list */}
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '6px' }}>
            My Active Applications ({submittedRequests.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
            {submittedRequests.map(req => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-card-alt)', borderRadius: '6px', fontSize: '11.5px' }}>
                <div>
                  <strong>{req.id}</strong> • {req.service}
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Parcel: {req.parcel_id} • {req.date}</div>
                </div>
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: req.status === 'COMPLETED' ? 'var(--bg-badge-green)' : 'var(--bg-badge-blue)', color: req.status === 'COMPLETED' ? 'var(--status-success)' : 'var(--brand-accent-cyan)', fontWeight: 600, fontSize: '10px' }}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
