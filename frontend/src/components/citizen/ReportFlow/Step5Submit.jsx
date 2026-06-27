import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSparkles } from '@tabler/icons-react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { useTranslateMap } from '../../../hooks/useTranslate';
import { useAuth } from '../../../hooks/useAuth';

const STRINGS = {
  // duplicate screen
  dupTitle:       'This issue was already reported',
  dupSub:         'AI found a matching ticket nearby. Review it before submitting again.',
  whyFlagged:     'Why flagged:',
  match:          'match',
  trackTicket:    'Track This Ticket',
  differentSubmit:'It\'s Different — Submit',
  dupWarning:     'Submitting a duplicate wastes officer time. Only proceed if this is a genuinely different issue.',
  reported:       'Reported',
  // success screen
  successTitle:   'Report Submitted!',
  yourTicketId:   'Your Ticket ID',
  saveId:         'Save this ID to track your report',
  status:         'Status',
  pendingStatus:  'UNASSIGNED — pending assignment',
  slaDeadline:    'SLA Deadline',
  xpEarned:       'XP Earned',
  trackBtn:       'Track Your Ticket',
  reportAnother:  'Report Another',
  // review screen
  reviewTitle:    'Review & Submit',
  reviewSub:      'Confirm everything looks right before submitting',
  issueType:      'Issue Type',
  severity:       'Severity',
  danger:         'Danger',
  department:     'Department',
  location:       'Location',
  ward:           'Ward',
  phone:          'Phone',
  email:          'Email',
  afterSubmit:    'After submission: AI checks for duplicates → Officer assigned within SLA → You\'ll receive updates via notification/WhatsApp/email',
  submitBtn:      'Submit Report',
  submitting:     'Submitting…',
  submitSuccess:  'Report submitted!',
  submitFailed:   'Submission failed. Please try again.',
};

export default function Step5Submit({ photo, formData, location, contact, onReset }) {
  const tr          = useTranslateMap(STRINGS);
  const { user }    = useAuth();
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [duplicate, setDuplicate]     = useState(null);
  const [dupMeta, setDupMeta]         = useState(null);

  const buildPayload = (bypassDuplicateOf = null) => {
    const data = {
      ...formData,
      location,
      phone:        contact.phone  || '',
      email:        contact.email  || '',
      citizenName:  user?.displayName || '',
      aiSuggested:  formData.aiSuggested,
    };
    if (bypassDuplicateOf) {
      data.bypassDuplicateOf        = bypassDuplicateOf;
      data.duplicateMatchConfidence = dupMeta?.matchConfidence || 0;
    }
    const payload = new FormData();
    payload.append('photo', photo);
    payload.append('data', JSON.stringify(data));
    return payload;
  };

  const handleSubmit = async (bypassDuplicateOf = null) => {
    setLoading(true);
    try {
      const res = await api.post('/tickets', buildPayload(bypassDuplicateOf), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(tr.submitSuccess);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.duplicate) {
        setDuplicate(err.response.data.existingTicket);
        setDupMeta({ matchReason: err.response.data.matchReason, matchConfidence: err.response.data.matchConfidence });
      } else {
        toast.error(err.response?.data?.error || tr.submitFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Duplicate screen ─────────────────────────────────────────────── */
  if (duplicate) {
    const tk          = duplicate;
    const dangerColor = tk.dangerLevel === 'critical' ? '#C13B2A' : tk.dangerLevel === 'moderate' ? '#D4730A' : '#1A7A4A';
    const statusColor = ['RESOLVED','CLOSED_OVERRIDE'].includes(tk.status) ? '#1A7A4A'
                      : tk.status === 'REJECTED' ? '#C13B2A' : '#D4730A';
    const reportedDate = tk.createdAt
      ? new Date(tk.createdAt._seconds ? tk.createdAt._seconds * 1000 : tk.createdAt)
          .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#4A4A48' }}>{tr.dupTitle}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#7A7875' }}>{tr.dupSub}</p>
          {dupMeta?.matchReason && (
            <p className="text-xs mt-1.5 italic px-3 py-2" style={{ color: '#6B50B8', backgroundColor: '#EDE9F8', borderRadius: '6px' }}>
              <span style={{ color: '#8B79C8' }}>{tr.whyFlagged}</span> {dupMeta.matchReason}
              {dupMeta.matchConfidence ? ` (${dupMeta.matchConfidence}% ${tr.match})` : ''}
            </p>
          )}
        </div>

        <div className="border overflow-hidden" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          {tk.photoUrl && (
            <img src={tk.photoUrl} alt="Reported issue" className="w-full object-cover"
              style={{ height: 190, display: 'block', borderBottom: '1px solid #E5E2DE' }} />
          )}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm" style={{ color: '#C13B2A' }}>{tk.publicId}</span>
              <span className="text-xs font-semibold px-2 py-0.5"
                style={{ backgroundColor: `${statusColor}18`, color: statusColor, borderRadius: '4px' }}>
                {tk.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p style={{ color: '#7A7875' }}>{tr.issueType}</p>
                <p className="font-medium capitalize" style={{ color: '#4A4A48' }}>{tk.issueType?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p style={{ color: '#7A7875' }}>{tr.severity}</p>
                <p className="font-medium" style={{ color: '#4A4A48' }}>
                  {tk.severity}/10 <span className="capitalize" style={{ color: dangerColor }}>({tk.dangerLevel})</span>
                </p>
              </div>
            </div>
            {tk.description && (
              <p className="text-xs px-3 py-2 line-clamp-3" style={{ backgroundColor: '#F5F3F0', borderRadius: '6px', color: '#4A4A48' }}>
                {tk.description}
              </p>
            )}
            {(tk.address || reportedDate) && (
              <div className="text-xs space-y-0.5">
                {tk.address && <p style={{ color: '#7A7875' }}>{tk.address}</p>}
                {reportedDate && <p style={{ color: '#B8B5B0' }}>{tr.reported} {reportedDate}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Link to={`/track/${tk.publicId}`}
            className="flex-1 py-3 font-semibold text-sm text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
            {tr.trackTicket}
          </Link>
          <button
            onClick={() => { const id = duplicate?.publicId; setDuplicate(null); handleSubmit(id); }}
            className="flex-1 border py-3 font-medium text-sm transition-colors hover:opacity-80"
            style={{ borderColor: '#E5E2DE', color: '#4A4A48', borderRadius: '6px' }}>
            {tr.differentSubmit}
          </button>
        </div>
        <p className="text-xs text-center" style={{ color: '#B8B5B0' }}>{tr.dupWarning}</p>
      </div>
    );
  }

  /* ── Success screen ───────────────────────────────────────────────── */
  if (result) {
    return (
      <div className="space-y-5 text-center">
        <h2 className="text-2xl font-bold" style={{ color: '#4A4A48' }}>{tr.successTitle}</h2>
        <div className="border p-5" style={{ backgroundColor: '#FDF1EF', borderColor: '#E5C5BF', borderRadius: '8px' }}>
          <p className="text-sm mb-2" style={{ color: '#7A7875' }}>{tr.yourTicketId}</p>
          <p className="text-3xl font-bold font-mono" style={{ color: '#C13B2A' }}>{result.ticketId}</p>
          <p className="text-xs mt-2" style={{ color: '#B8B5B0' }}>{tr.saveId}</p>
        </div>
        <div className="space-y-3 text-left p-4 text-sm border" style={{ backgroundColor: '#FAFAF9', borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <div className="flex justify-between">
            <span style={{ color: '#7A7875' }}>{tr.status}</span>
            <span className="font-medium" style={{ color: '#D4730A' }}>{tr.pendingStatus}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#7A7875' }}>{tr.slaDeadline}</span>
            <span className="font-medium" style={{ color: '#4A4A48' }}>{new Date(result.slaDeadline).toDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#7A7875' }}>{tr.xpEarned}</span>
            <span className="font-medium" style={{ color: '#1A7A4A' }}>+50 XP</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/track/${result.ticketId}`}
            className="flex-1 py-3 font-medium text-sm text-white text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
            {tr.trackBtn}
          </Link>
          <button onClick={onReset}
            className="flex-1 border py-3 font-medium text-sm transition-colors"
            style={{ borderColor: '#E5E2DE', color: '#4A4A48', borderRadius: '6px' }}>
            {tr.reportAnother}
          </button>
        </div>
      </div>
    );
  }

  /* ── Review + submit screen ───────────────────────────────────────── */
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>{tr.reviewTitle}</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>{tr.reviewSub}</p>
      </div>

      <div className="space-y-3 p-4 text-sm border" style={{ backgroundColor: '#FAFAF9', borderColor: '#E5E2DE', borderRadius: '8px' }}>
        <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.issueType}</span><span className="font-medium capitalize" style={{ color: '#4A4A48' }}>{formData.issueType?.replace(/_/g,' ')}</span></div>
        <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.severity}</span><span className="font-medium" style={{ color: '#4A4A48' }}>{formData.severity}/10</span></div>
        <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.danger}</span>
          <span className="font-medium capitalize" style={{ color: formData.dangerLevel === 'critical' ? '#C13B2A' : formData.dangerLevel === 'moderate' ? '#D4730A' : '#1A7A4A' }}>{formData.dangerLevel}</span>
        </div>
        <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.department}</span><span className="font-medium" style={{ color: '#4A4A48' }}>{formData.departmentId?.replace(/_/g,' ')}</span></div>
        <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.location}</span><span className="font-medium text-right max-w-xs text-xs" style={{ color: '#4A4A48' }}>{location?.address?.substring(0, 60)}…</span></div>
        <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.ward}</span><span className="font-medium" style={{ color: '#4A4A48' }}>{location?.ward}</span></div>
        {contact?.phone && <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.phone}</span><span className="font-medium" style={{ color: '#4A4A48' }}>{contact.phone}</span></div>}
        {contact?.email && <div className="flex justify-between"><span style={{ color: '#7A7875' }}>{tr.email}</span><span className="font-medium" style={{ color: '#4A4A48' }}>{contact.email}</span></div>}
      </div>

      <div className="border p-3 text-xs flex items-start gap-2" style={{ backgroundColor: '#EDE9F8', borderColor: '#B8A9E5', borderRadius: '6px', color: '#4A3870' }}>
        <IconSparkles size={14} stroke={1.5} style={{ color: '#6B50B8', flexShrink: 0, marginTop: 1 }} />
        <span>{tr.afterSubmit}</span>
      </div>

      <button
        onClick={() => handleSubmit()}
        disabled={loading}
        className="w-full py-4 font-bold text-base text-white transition-opacity disabled:opacity-50 hover:opacity-90"
        style={{ backgroundColor: '#1A7A4A', borderRadius: '6px' }}
      >
        {loading ? tr.submitting : tr.submitBtn}
      </button>
    </div>
  );
}
