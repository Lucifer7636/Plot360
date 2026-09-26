import React, { useState } from 'react';
import {
  X,
  UserCheck,
  CheckCircle,
  AlertCircle,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function FieldVerificationModal() {
  const {
    activeParcel,
    fieldModalOpen,
    setFieldModalOpen,
    fieldVerificationStatus,
    fieldVerificationNotes,
    updateFieldVerification
  } = useApp();

  const [status, setStatus] = useState(fieldVerificationStatus);
  const [notes, setNotes] = useState(fieldVerificationNotes);
  const [successMsg, setSuccessMsg] = useState(false);

  // Accessible Escape key listener
  React.useEffect(() => {
    if (!fieldModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFieldModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fieldModalOpen, setFieldModalOpen]);

  if (!fieldModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateFieldVerification(status, notes);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setFieldModalOpen(false);
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="field-verification-title"
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
    >
      <div
        style={{
          width: '560px',
          maxWidth: '96vw',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
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
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--brand-accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 id="field-verification-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Field Verification Workflow
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Parcel {activeParcel?.parcel_id} • ULPIN: <span className="font-mono">{activeParcel?.ulpin}</span>
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setFieldModalOpen(false)} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Record on-site findings and verification determination. This update will be logged to the PLOT360 land audit trail.
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Verification Status Determination
            </label>
            <div
              role="radiogroup"
              aria-label="Verification Status Determination"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}
            >
              <div
                role="radio"
                tabIndex={0}
                aria-checked={status === 'VERIFIED'}
                onClick={() => setStatus('VERIFIED')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setStatus('VERIFIED');
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1.5px solid ${status === 'VERIFIED' ? 'var(--status-success)' : 'var(--border-subtle)'}`,
                  backgroundColor: status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-alt)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} style={{ color: 'var(--status-success)' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Verified</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Change confirmed valid</div>
                </div>
              </div>

              <div
                role="radio"
                tabIndex={0}
                aria-checked={status === 'UNDER_REVIEW'}
                onClick={() => setStatus('UNDER_REVIEW')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setStatus('UNDER_REVIEW');
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1.5px solid ${status === 'UNDER_REVIEW' ? 'var(--brand-accent-cyan)' : 'var(--border-subtle)'}`,
                  backgroundColor: status === 'UNDER_REVIEW' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card-alt)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ color: 'var(--brand-accent-cyan)' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Under Review</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Inspection in progress</div>
                </div>
              </div>

              <div
                role="radio"
                tabIndex={0}
                aria-checked={status === 'REQUIRES_MORE_EVIDENCE'}
                onClick={() => setStatus('REQUIRES_MORE_EVIDENCE')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setStatus('REQUIRES_MORE_EVIDENCE');
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1.5px solid ${status === 'REQUIRES_MORE_EVIDENCE' ? 'var(--status-warning)' : 'var(--border-subtle)'}`,
                  backgroundColor: status === 'REQUIRES_MORE_EVIDENCE' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card-alt)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <HelpCircle size={16} style={{ color: 'var(--status-warning)' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>More Evidence</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Drone survey needed</div>
                </div>
              </div>

              <div
                role="radio"
                tabIndex={0}
                aria-checked={status === 'PENDING'}
                onClick={() => setStatus('PENDING')}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setStatus('PENDING');
                  }
                }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1.5px solid ${status === 'PENDING' ? 'var(--text-muted)' : 'var(--border-subtle)'}`,
                  backgroundColor: status === 'PENDING' ? 'var(--bg-card-hover)' : 'var(--bg-card-alt)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileCheck size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Pending</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Queued for site visit</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="officer-inspection-notes" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              Officer Inspection Notes & Findings
            </label>
            <textarea
              id="officer-inspection-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter site inspection findings, surveyor name, GPS coordinates verification..."
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>

          {successMsg && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--status-success)',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              ✓ Field Verification Successfully Logged & Persisted!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFieldModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 18px' }}
            >
              Commit Verification Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
