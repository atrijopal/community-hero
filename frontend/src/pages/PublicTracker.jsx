import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  IconMapPin, IconUser, IconCalendar, IconClock, IconThumbUp,
  IconAlertTriangle, IconSparkles, IconArrowLeft, IconPhoto,
  IconTimeline, IconRobot, IconScale, IconGhost,
} from '@tabler/icons-react';
import { useTicket } from '../hooks/useTicket';
import StatusBadge from '../components/shared/StatusBadge';
import SLACountdown from '../components/shared/SLACountdown';
import PhotoViewer from '../components/shared/PhotoViewer';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { formatDate, daysAgo } from '../utils/formatters';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import api from '../utils/api';
import toast from 'react-hot-toast';

const card = { backgroundColor: '#FFFFFF', border: '1px solid #E5E2DE', borderRadius: '8px' };
const info = { color: '#7A7875', fontSize: 12 };

function TimelineTab({ ticketId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!ticketId) return;
    const q = query(collection(db, 'ticket_logs'), where('ticketId', '==', ticketId));
    return onSnapshot(q, snap => {
      const sorted = snap.docs.map(d => d.data()).sort((a, b) => {
        const ta = a.timestamp?.seconds ?? 0;
        const tb = b.timestamp?.seconds ?? 0;
        return tb - ta;
      });
      setLogs(sorted);
    }, () => {});
  }, [ticketId]);

  const ACTION_COLOR = {
    TICKET_CREATED:           '#7A7875',
    OFFICER_ASSIGNED:         '#2D6A9F',
    RESOLVED:                 '#1A7A4A',
    GHOST_REOPEN:             '#8B1A1A',
    GHOST_CHECK:              '#6B50B8',
    AUTO_ESCALATED:           '#D4730A',
    RTI_GENERATED:            '#C13B2A',
    STATUS_UPDATE_IN_PROGRESS:'#2D6A9F',
  };

  if (logs.length === 0) return (
    <p className="text-sm py-6 text-center" style={{ color: '#B8B5B0' }}>No timeline events yet.</p>
  );

  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const color = ACTION_COLOR[log.action] || '#B8B5B0';
        return (
          <div key={i} className="flex gap-3 items-start py-3 border-b last:border-b-0" style={{ borderColor: '#E5E2DE' }}>
            <div className="w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
              style={{ backgroundColor: `${color}18`, color }}>
              <span className="text-xs font-bold">•</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: '#4A4A48' }}>
                {log.action?.replace(/_/g, ' ')}
                {log.newState && <span style={{ color: '#7A7875' }}> → {log.newState}</span>}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>{formatDate(log.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueryBot({ ticketPublicId }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);

  const suggestions = [
    'Why is my ticket delayed?',
    'When will this be resolved?',
    'Who is the assigned officer?',
    'Has the SLA deadline passed?',
  ];

  const askQuestion = async (q) => {
    const ask = q || question;
    if (!ask.trim()) return;
    setLoading(true);
    setHistory(h => [...h, { role: 'user', text: ask }]);
    setQuestion('');
    try {
      const res = await api.post(`/tickets/${ticketPublicId}/query`, { question: ask });
      setHistory(h => [...h, { role: 'bot', text: res.data.answer }]);
    } catch {
      setHistory(h => [...h, { role: 'bot', text: 'Sorry, I could not answer that right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* AI frame — purple per design doc */}
      <div className="p-4 mb-4 border-l-4" style={{ backgroundColor: '#EDE9F8', borderColor: '#6B50B8', borderRadius: '4px' }}>
        <p className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: '#6B50B8' }}>
          <IconSparkles size={14} stroke={2} /> Ask about your ticket
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => askQuestion(s)}
              className="text-xs px-3 py-1.5 border transition-colors"
              style={{ borderColor: '#6B50B8', color: '#6B50B8', borderRadius: '4px', backgroundColor: 'white' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6B50B8'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#6B50B8'; }}>
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); askQuestion(); }} className="flex gap-2">
          <input value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question…"
            className="flex-1 px-3 py-2 text-sm border"
            style={{ borderColor: '#E5E2DE', borderRadius: '6px', color: '#4A4A48' }} />
          <button type="submit" disabled={loading || !question.trim()}
            className="px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#6B50B8', borderRadius: '6px' }}>
            {loading ? '…' : 'Ask'}
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {history.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="rounded px-3 py-2 max-w-xs text-sm"
                style={{
                  backgroundColor: msg.role === 'user' ? '#C13B2A' : '#F5F3F0',
                  color: msg.role === 'user' ? 'white' : '#4A4A48',
                  borderRadius: '6px',
                }}>
                {msg.role === 'bot' && (
                  <span className="font-semibold mr-1" style={{ color: '#6B50B8' }}>◆</span>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="px-3 py-2 text-sm animate-pulse" style={{ backgroundColor: '#F5F3F0', color: '#7A7875', borderRadius: '6px' }}>
                Thinking…
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GhostReportCard({ ghostReport }) {
  if (!ghostReport) return null;
  const color = ghostReport.decision === 'reject_resolution' ? '#C13B2A'
              : ghostReport.decision === 'needs_review'       ? '#D4730A'
              : '#1A7A4A';
  const bg    = ghostReport.decision === 'reject_resolution' ? '#FDF1EF'
              : ghostReport.decision === 'needs_review'       ? '#FEF3E7'
              : '#EBF5EF';
  return (
    <div className="p-4 border-l-4" style={{ backgroundColor: bg, borderColor: color, borderRadius: '4px' }}>
      <div className="flex items-center gap-2 mb-3">
        <IconGhost size={16} stroke={1.5} style={{ color }} />
        <span className="font-semibold text-sm" style={{ color: '#4A4A48' }}>Ghost Detection Report</span>
        <span className="text-xs font-semibold px-2 py-0.5" style={{ backgroundColor: `${color}20`, color, borderRadius: '4px' }}>
          {ghostReport.decision?.replace(/_/g, ' ').toUpperCase()}
        </span>
      </div>
      <p className="text-sm mb-3" style={{ color: '#4A4A48' }}>{ghostReport.reason}</p>
      {ghostReport.comparison && (
        <div className="grid grid-cols-3 gap-3 text-xs p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.6)', color: '#7A7875' }}>
          <div><p className="font-semibold mb-1">New Report</p><p>{ghostReport.comparison.image1_shows}</p></div>
          <div><p className="font-semibold mb-1">Original</p><p>{ghostReport.comparison.image2_shows}</p></div>
          <div><p className="font-semibold mb-1">Resolution</p><p>{ghostReport.comparison.image3_shows}</p></div>
        </div>
      )}
    </div>
  );
}

function EvidenceReportCard({ evidenceReport }) {
  if (!evidenceReport) return null;
  const approved = evidenceReport.approved;
  const color = approved ? '#1A7A4A' : '#C13B2A';
  const bg    = approved ? '#EBF5EF' : '#FDF1EF';
  return (
    <div className="p-4 border-l-4" style={{ backgroundColor: bg, borderColor: color, borderRadius: '4px' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-semibold text-sm" style={{ color: '#4A4A48' }}>Resolution Evidence Report</span>
        <span className="text-xs font-semibold px-2 py-0.5" style={{ backgroundColor: `${color}20`, color, borderRadius: '4px' }}>
          {approved ? 'APPROVED' : 'REJECTED'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3" style={{ color: '#4A4A48' }}>
        <div>AI Confidence <span className="float-right font-medium">{evidenceReport.geminiConfidence}%</span></div>
        <div>Same Location  <span className="float-right">{evidenceReport.sameLocation ? '✓' : '✗'}</span></div>
        <div>Issue Resolved <span className="float-right">{evidenceReport.issueResolved ? '✓' : '✗'}</span></div>
      </div>
      {evidenceReport.rejectionReason && (
        <p className="text-sm px-3 py-2" style={{ color: '#C13B2A', backgroundColor: '#FDF1EF', borderRadius: '4px' }}>
          {evidenceReport.rejectionReason}
        </p>
      )}
    </div>
  );
}

export default function PublicTracker() {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const { ticket, loading, error } = useTicket(id);
  const [tab, setTab]       = useState('timeline');
  const [upvoted, setUpvoted]   = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => { if (ticket) setUpvoteCount(ticket.upvoteCount || 0); }, [ticket]);

  const handleUpvote = async () => {
    if (upvoted) return;
    try {
      const res = await api.post(`/tickets/${ticket.publicId}/upvote`, { email: 'anonymous@track.app' });
      setUpvoted(true);
      setUpvoteCount(res.data.upvoteCount);
      toast.success('Upvoted! This brings the issue to attention.');
    } catch { toast.error('Could not upvote. Try signing in.'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3F0' }}>
      <LoadingSpinner text="Loading ticket…" />
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="text-center">
        <p className="text-4xl mb-4 font-serif" style={{ color: '#B8B5B0' }}>?</p>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#4A4A48' }}>Ticket not found</h2>
        <p className="text-sm mb-5" style={{ color: '#7A7875' }}>Check the ticket ID and try again</p>
        <Link to="/" className="text-sm font-medium text-white px-5 py-2.5"
          style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>Go Home</Link>
      </div>
    </div>
  );

  const daysSinceCreated = daysAgo(ticket.createdAt);
  const canRTI    = daysSinceCreated >= 30;
  const canReopen = ticket.status === 'RESOLVED' && ticket.ghostWindowOpen;

  const tabs = [
    { id: 'timeline', label: 'Timeline',  icon: IconTimeline },
    { id: 'photos',   label: 'Photos',    icon: IconPhoto },
    { id: 'ask',      label: 'Ask AI',    icon: IconRobot },
    ...(ticket.evidenceReport ? [{ id: 'evidence', label: 'Evidence', icon: IconScale }] : []),
    ...(ticket.ghostReport    ? [{ id: 'ghost',    label: 'Ghost',    icon: IconGhost }] : []),
  ];

  const sevColor = ticket.severity >= 9 ? '#C13B2A' : ticket.severity >= 4 ? '#D4730A' : '#1A7A4A';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      {/* Minimal header */}
      <nav className="bg-white sticky top-0 z-50 border-b" style={{ borderColor: '#E5E2DE' }}>
        <div className="max-w-3xl mx-auto px-4 flex items-center h-12 gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#7A7875', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = '#C13B2A'}
            onMouseLeave={e => e.currentTarget.style.color = '#7A7875'}>
            <IconArrowLeft size={14} stroke={1.5} /> Back
          </button>
          <span style={{ color: '#E5E2DE' }}>/</span>
          <span className="font-mono text-sm tracking-wider" style={{ color: '#4A4A48' }}>{ticket.publicId}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Ticket header card */}
        <div style={card} className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <StatusBadge status={ticket.status} size="lg" />
                {ticket.slaBreached && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5"
                    style={{ backgroundColor: '#FDF1EF', color: '#C13B2A', borderRadius: '4px' }}>
                    <IconAlertTriangle size={11} stroke={2} /> SLA Breached
                  </span>
                )}
                {ticket.ghostCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5"
                    style={{ backgroundColor: '#F5EAEA', color: '#8B1A1A', borderRadius: '4px' }}>
                    Ghost ×{ticket.ghostCount}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-semibold capitalize" style={{ color: '#4A4A48' }}>
                {ticket.issueType?.replace(/_/g, ' ')}
              </h1>
              <p className="font-mono text-xs mt-0.5 tracking-wider" style={{ color: '#B8B5B0' }}>{ticket.publicId}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold" style={{ color: sevColor }}>
                {ticket.severity}<span className="text-sm font-normal" style={{ color: '#B8B5B0' }}>/10</span>
              </p>
              <p className="text-xs uppercase tracking-wider" style={{ color: '#B8B5B0' }}>severity</p>
            </div>
          </div>

          <p className="text-sm mb-4" style={{ color: '#4A4A48' }}>{ticket.description}</p>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { icon: IconMapPin,  label: 'Location',        value: ticket.location?.address, sub: `Ward: ${ticket.location?.ward}` },
              { icon: IconUser,    label: 'Assigned Officer', value: ticket.assignedOfficerName || 'Not assigned', sub: ticket.departmentId?.replace(/_/g, ' ') },
              { icon: IconCalendar,label: 'Reported',         value: formatDate(ticket.createdAt), sub: `${daysSinceCreated} days ago` },
              { icon: IconClock,   label: 'SLA Deadline',     value: null, sub: null, sla: true },
            ].map(({ icon: Icon, label, value, sub, sla }) => (
              <div key={label} className="p-3" style={{ backgroundColor: '#F5F3F0', borderRadius: '6px' }}>
                <p className="flex items-center gap-1 text-xs mb-1" style={{ color: '#B8B5B0' }}>
                  <Icon size={11} stroke={1.5} /> {label}
                </p>
                {sla
                  ? <SLACountdown slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached} />
                  : <>
                      <p className="text-sm font-medium" style={{ color: '#4A4A48' }}>{value}</p>
                      {sub && <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{sub}</p>}
                    </>
                }
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleUpvote} disabled={upvoted}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors disabled:opacity-60"
              style={{
                borderColor: upvoted ? '#C13B2A' : '#E5E2DE',
                color: upvoted ? '#C13B2A' : '#4A4A48',
                backgroundColor: upvoted ? '#FDF1EF' : 'white',
                borderRadius: '6px',
              }}>
              <IconThumbUp size={14} stroke={1.5} />
              {upvoted ? 'Upvoted' : 'Me Too'} ({upvoteCount})
            </button>

            {canReopen && (
              <Link to={`/citizen/tickets/${ticket.publicId}?action=reopen`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border"
                style={{ borderColor: '#D4730A', color: '#D4730A', backgroundColor: '#FEF3E7', borderRadius: '6px' }}>
                <IconGhost size={14} stroke={1.5} /> Issue Not Fixed?
              </Link>
            )}

            {canRTI && (
              <a href={ticket.rtiPdfUrl || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border"
                style={{ borderColor: '#C13B2A', color: '#C13B2A', backgroundColor: '#FDF1EF', borderRadius: '6px' }}>
                <IconScale size={14} stroke={1.5} /> RTI Document ({daysSinceCreated}d)
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={card}>
          <div className="flex overflow-x-auto border-b" style={{ borderColor: '#E5E2DE' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors"
                style={{
                  borderBottomColor: tab === id ? '#C13B2A' : 'transparent',
                  color: tab === id ? '#C13B2A' : '#7A7875',
                }}>
                <Icon size={14} stroke={1.5} />{label}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === 'timeline' && <TimelineTab ticketId={ticket.id} />}
            {tab === 'photos' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>Report Photo</p>
                  <PhotoViewer photos={[ticket.photos?.report].filter(Boolean)} labels={['Report']} />
                </div>
                {ticket.photos?.resolution && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#7A7875' }}>Resolution Photo</p>
                    <PhotoViewer photos={[ticket.photos.resolution]} labels={['Resolution']} />
                  </div>
                )}
              </div>
            )}
            {tab === 'ask'      && <QueryBot ticketPublicId={ticket.publicId} />}
            {tab === 'evidence' && <EvidenceReportCard evidenceReport={ticket.evidenceReport} />}
            {tab === 'ghost'    && <GhostReportCard ghostReport={ticket.ghostReport} />}
          </div>
        </div>

        {/* AI classification block — purple */}
        {ticket.aiSuggested && (
          <div className="p-4 border-l-4" style={{ backgroundColor: '#EDE9F8', borderColor: '#6B50B8', borderRadius: '4px' }}>
            <p className="font-semibold text-sm flex items-center gap-1.5 mb-1" style={{ color: '#6B50B8' }}>
              <IconSparkles size={14} stroke={2} /> ◆ AI Classification
            </p>
            <p className="text-sm" style={{ color: '#4A4A48' }}>
              Confidence: <strong>{ticket.aiSuggested.confidence}%</strong>
              {ticket.aiSuggested.reasoning && <span style={{ color: '#7A7875' }}> — {ticket.aiSuggested.reasoning}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
