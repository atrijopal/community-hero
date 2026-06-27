import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IconArrowLeft, IconMapPin, IconNavigation, IconPlayerPlay,
  IconCamera, IconAlertTriangle, IconCircleCheck, IconClock,
  IconUpload, IconChevronRight,
} from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import SLACountdown from '../../components/shared/SLACountdown';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useTicket } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import api from '../../utils/api';

const SEV_COLOR = (s) => s >= 9 ? '#C13B2A' : s >= 7 ? '#D4730A' : '#1A7A4A';

function Section({ title, children }) {
  return (
    <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
      {title && <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#B8B5B0' }}>{title}</p>}
      {children}
    </div>
  );
}

function ActionPanel({ ticket, docId }) {
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState(null);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const fileRef                 = useRef();

  const startWork = async () => {
    setLoading(true);
    try {
      await api.patch(`/tickets/${docId}/status`, { status: 'IN_PROGRESS' });
      toast.success('Status updated to In Progress');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update status');
    } finally { setLoading(false); }
  };

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const submitResolution = async () => {
    if (!file) { toast.error('Select a resolution photo first'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post(`/tickets/${docId}/resolution`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      if (res.data.status === 'RESOLVED') {
        toast.success('Ticket resolved! AI verified your evidence.');
      } else {
        toast('AI could not verify resolution — check details below.', { icon: '⚠️' });
      }
    } catch (e) {
      const d = e.response?.data;
      setResult(d);
      if (e.response?.status === 422) {
        toast('Resolution photo rejected by AI — try again.', { icon: '⚠️' });
      } else {
        toast.error(d?.error || 'Upload failed');
      }
    } finally { setLoading(false); }
  };

  const mapsUrl = ticket.location?.lat && ticket.location?.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${ticket.location.lat},${ticket.location.lng}`
    : null;

  // Already resolved / closed — show evidence
  if (['RESOLVED', 'GHOST_FLAGGED', 'CLOSED_OVERRIDE', 'REJECTED'].includes(ticket.status)) {
    return (
      <Section title="Resolution">
        <div className="flex items-center gap-2 mb-3">
          <IconCircleCheck size={20} style={{ color: '#1A7A4A' }} />
          <span className="font-semibold" style={{ color: '#1A7A4A' }}>
            {ticket.status === 'RESOLVED' ? 'Ticket resolved' : ticket.status.replace(/_/g, ' ')}
          </span>
        </div>
        {ticket.photos?.resolution && (
          <img src={ticket.photos.resolution} alt="Resolution" className="w-full object-cover mt-2"
            style={{ borderRadius: '6px', maxHeight: 240 }} />
        )}
        {ticket.evidenceReport && (
          <div className="mt-3 text-sm space-y-1" style={{ color: '#7A7875' }}>
            <p>AI confidence: <strong>{ticket.evidenceReport.geminiConfidence}%</strong></p>
            <p>Same location: <strong>{ticket.evidenceReport.sameLocation ? 'Yes' : 'No'}</strong></p>
            <p>Issue resolved: <strong>{ticket.evidenceReport.issueResolved ? 'Yes' : 'No'}</strong></p>
          </div>
        )}
      </Section>
    );
  }

  // ASSIGNED — primary action: start work
  if (ticket.status === 'ASSIGNED') {
    return (
      <Section title="Your Action">
        <p className="text-sm mb-4" style={{ color: '#7A7875' }}>
          You've been assigned this ticket. Head to the location and mark it in progress when you arrive.
        </p>
        <div className="flex flex-col gap-3">
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 font-semibold border transition-opacity hover:opacity-80"
              style={{ borderColor: '#C13B2A', color: '#C13B2A', borderRadius: '6px' }}>
              <IconNavigation size={18} />
              Open in Google Maps
            </a>
          )}
          <button onClick={startWork} disabled={loading}
            className="flex items-center justify-center gap-2 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
            <IconPlayerPlay size={18} />
            {loading ? 'Updating…' : 'Mark as In Progress'}
          </button>
        </div>
      </Section>
    );
  }

  // IN_PROGRESS — upload resolution photo
  if (ticket.status === 'IN_PROGRESS') {
    return (
      <Section title="Submit Resolution">
        <p className="text-sm mb-4" style={{ color: '#7A7875' }}>
          Upload a clear "after" photo showing the issue has been fixed. AI will compare it with the original report photo.
        </p>

        {/* Before / After side-by-side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#B8B5B0' }}>Before</p>
            {ticket.photos?.report ? (
              <img src={ticket.photos.report} alt="Before" className="w-full object-cover"
                style={{ borderRadius: '6px', height: 120 }} />
            ) : (
              <div className="flex items-center justify-center h-24 border" style={{ borderColor: '#E5E2DE', borderRadius: '6px' }}>
                <span className="text-xs" style={{ color: '#B8B5B0' }}>No photo</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#B8B5B0' }}>After (yours)</p>
            {preview ? (
              <img src={preview} alt="After preview" className="w-full object-cover"
                style={{ borderRadius: '6px', height: 120 }} />
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed transition-colors hover:border-gray-400"
                style={{ borderColor: '#E5E2DE', borderRadius: '6px' }}>
                <IconCamera size={20} style={{ color: '#B8B5B0' }} />
                <span className="text-xs mt-1" style={{ color: '#B8B5B0' }}>Tap to add</span>
              </button>
            )}
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={pickFile} />

        {preview && (
          <button onClick={() => fileRef.current?.click()} className="text-xs mb-3 underline" style={{ color: '#7A7875' }}>
            Change photo
          </button>
        )}

        {/* AI result */}
        {result && (
          <div className="mb-4 p-3 text-sm"
            style={{
              backgroundColor: result.status === 'RESOLVED' ? '#EBF5EF' : '#FDF1EF',
              borderRadius: '6px',
              color: result.status === 'RESOLVED' ? '#1A7A4A' : '#C13B2A',
            }}>
            {result.status === 'RESOLVED' ? (
              <p>AI verified your resolution ({result.geminiValidation?.confidence_score || result.geminiValidation?.confidence || 0}% confidence)</p>
            ) : (
              <>
                <p className="font-semibold">Verification failed</p>
                <p className="mt-1">{result.geminiValidation?.rejection_reason || 'AI could not confirm the issue is resolved'}</p>
                {result.retriesRemaining > 0 && (
                  <p className="mt-1 text-xs">{result.retriesRemaining} attempt(s) remaining before escalation</p>
                )}
              </>
            )}
          </div>
        )}

        <button onClick={submitResolution} disabled={loading || !file}
          className="w-full flex items-center justify-center gap-2 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: '#1A7A4A', borderRadius: '6px' }}>
          <IconUpload size={18} />
          {loading ? 'Uploading & verifying…' : 'Submit Resolution Photo'}
        </button>

        {ticket.resolutionRetries > 0 && (
          <p className="text-xs mt-2 text-center" style={{ color: '#D4730A' }}>
            {ticket.resolutionRetries} failed attempt(s) · {Math.max(0, 3 - ticket.resolutionRetries)} remaining before auto-escalation
          </p>
        )}

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 mt-3 text-sm transition-opacity hover:opacity-70"
            style={{ color: '#7A7875' }}>
            <IconMapPin size={14} />
            Navigate to site
          </a>
        )}
      </Section>
    );
  }

  // ESCALATED
  return (
    <Section title="Status">
      <div className="flex items-center gap-2">
        <IconAlertTriangle size={18} style={{ color: '#D4730A' }} />
        <span className="font-semibold" style={{ color: '#D4730A' }}>Escalated — awaiting admin review</span>
      </div>
    </Section>
  );
}

export default function OfficerTicketDetail() {
  const { publicId } = useParams();
  const { ticket, loading, error } = useTicket(publicId);

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar /><LoadingSpinner text="Loading ticket…" />
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p style={{ color: '#7A7875' }}>Ticket not found.</p>
        <Link to="/officer/queue" className="mt-4 inline-block underline" style={{ color: '#C13B2A' }}>Back to queue</Link>
      </div>
    </div>
  );

  const mapsUrl = ticket.location?.lat && ticket.location?.lng
    ? `https://www.google.com/maps/?q=${ticket.location.lat},${ticket.location.lng}`
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Back + header */}
        <div>
          <Link to="/officer/queue" className="inline-flex items-center gap-1 text-sm mb-3 transition-opacity hover:opacity-70"
            style={{ color: '#7A7875' }}>
            <IconArrowLeft size={15} /> Back to queue
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs" style={{ color: '#B8B5B0' }}>{ticket.publicId}</span>
                <StatusBadge status={ticket.status} />
                {ticket.slaBreached && (
                  <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: '#FFF3E0', color: '#D4730A', borderRadius: '4px' }}>SLA BREACHED</span>
                )}
              </div>
              <h1 className="text-xl font-bold" style={{ color: '#2A2A28' }}>{issueTypeLabel(ticket.issueType)}</h1>
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-bold" style={{ color: SEV_COLOR(ticket.severity) }}>{ticket.severity}</span>
              <span className="text-xs" style={{ color: '#B8B5B0' }}>/10</span>
              <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>SEVERITY</p>
            </div>
          </div>
        </div>

        {/* ACTION PANEL — most important, shown first */}
        <ActionPanel ticket={ticket} docId={ticket.id} />

        {/* SLA */}
        {ticket.slaDeadline && (
          <Section>
            <div className="flex items-center gap-2">
              <IconClock size={16} style={{ color: '#7A7875' }} />
              <span className="text-sm" style={{ color: '#7A7875' }}>SLA Deadline</span>
              <SLACountdown slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached} />
            </div>
          </Section>
        )}

        {/* Issue details */}
        <Section title="Issue Details">
          {ticket.description && (
            <p className="text-sm mb-3" style={{ color: '#4A4A48' }}>{ticket.description}</p>
          )}
          {ticket.photos?.report && (
            <img src={ticket.photos.report} alt="Reported issue"
              className="w-full object-cover"
              style={{ borderRadius: '6px', maxHeight: 240 }} />
          )}
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="flex items-start gap-2">
            <IconMapPin size={16} className="mt-0.5 shrink-0" style={{ color: '#C13B2A' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#2A2A28' }}>{ticket.location?.address || 'No address'}</p>
              {ticket.location?.ward && (
                <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>Ward: {ticket.location.ward}</p>
              )}
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold shrink-0 px-2 py-1 border transition-opacity hover:opacity-70"
                style={{ color: '#C13B2A', borderColor: '#C13B2A', borderRadius: '4px' }}>
                <IconNavigation size={12} /> Maps
                <IconChevronRight size={12} />
              </a>
            )}
          </div>
        </Section>

        {/* Citizen info (anonymised) */}
        <Section title="Reported">
          <p className="text-sm" style={{ color: '#7A7875' }}>
            {timeAgo(ticket.createdAt)} · {ticket.upvoteCount || 0} neighbours confirmed this issue
          </p>
        </Section>

      </div>
    </div>
  );
}
