import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  IconMapPin, IconUser, IconCalendar, IconClock, IconThumbUp,
  IconAlertTriangle, IconSparkles, IconArrowLeft, IconPhoto,
  IconTimeline, IconRobot, IconScale, IconGhost, IconShare,
  IconLink, IconCheck, IconUsers, IconFlag, IconArrowRight,
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
import { useTranslateMap } from '../hooks/useTranslate';

const card = { backgroundColor: '#FFFFFF', border: '1px solid #E5E2DE', borderRadius: '8px' };

const STRINGS = {
  // Nav
  back:               'Back',
  // Not found
  notFound:           'Ticket not found',
  notFoundSub:        'Check the ticket ID and try again',
  goHome:             'Go Home',
  // Duplicate notice
  possibleDuplicate:  'Possible duplicate',
  dupAlreadyReported: 'A similar issue was already reported as',
  viewOriginal:       'View original',
  // Ticket card
  severity:           'SEVERITY',
  slaBreach:          'SLA Breached',
  // RTI block
  rtiTitle:           'RTI Application',
  rtiUnresolved:      'days unresolved',
  rtiAutoFiled:       'This ticket crossed 30 days. An RTI has been auto-filed under the Right to Information Act.',
  downloadPdf:        'Download PDF',
  // Community section
  beFirstCorroborate: 'Be the first to corroborate this issue',
  neighboursSeen:     'neighbours have seen this issue',
  neighbourSeen:      'neighbour has seen this issue',
  communityVerified:  'Community-verified ✓',
  corroborated:       'Corroborated',
  noticed:            'Noticed',
  newReport:          'New report',
  share:              'Share',
  copied:             'Copied!',
  reportSimilar:      'Report a similar issue',
  copyLink:           'Copy link',
  flagNotFixed:       'Issue not fixed? Flag it',
  uploading:          'Uploading…',
  personReported:     'person in this area reported seeing this issue',
  peopleReported:     'people in this area reported seeing this issue',
  corrobExplainer:    'Corroborations help prioritise this issue. At 10+, it becomes community-verified and gets escalated faster.',
  iSeenThis:          "I've seen this issue too",
  youCorroborated:    'You corroborated this ✓',
  linkCopied:         'Link copied to clipboard',
  corrobThanks:       'Thanks — your corroboration strengthens this report.',
  corrobError:        'Could not upvote. Try signing in.',
  reopenSuccess:      'Flagged as unresolved — it will be reviewed again.',
  reopenError:        'Could not reopen. Please sign in first.',
  // Tabs
  tabTimeline:        'Timeline',
  tabPhotos:          'Photos',
  tabAskAI:           'Ask AI',
  tabEvidence:        'Evidence',
  tabGhost:           'Ghost',
  // Timeline
  noTimeline:         'No timeline events yet. Updates will appear here as the ticket progresses.',
  // Timeline action labels
  ticketCreated:      'Ticket submitted',
  officerAssigned:    'Officer assigned',
  workStarted:        'Work started — In Progress',
  markedResolved:     'Marked as resolved',
  citizenFlagged:     'Citizen flagged — not resolved',
  aiGhostRan:         'AI ghost detection ran',
  escalatedSLA:       'Escalated after SLA breach',
  rtiFiled:           'RTI application filed automatically',
  firstAppeal:        'First appeal letter generated',
  mergedDuplicate:    'Merged as duplicate',
  // Photos tab
  reportPhoto:        'Report Photo',
  resolutionPhoto:    'Resolution Photo',
  // Ask AI
  askAbout:           'Ask about this ticket',
  whyDelayed:         'Why is my ticket delayed?',
  whenResolved:       'When will this be resolved?',
  whoAssigned:        'Who is the assigned officer?',
  slaExpired:         'Has the SLA deadline passed?',
  typeQuestion:       'Type your question…',
  askBtn:             'Ask',
  thinking:           'Thinking…',
  aiError:            'Sorry, I could not answer that right now.',
  // Evidence
  resolutionEvidence: 'Resolution Evidence',
  approved:           'APPROVED',
  rejected:           'REJECTED',
  aiConf:             'AI Confidence',
  sameLocation:       'Same Location',
  issueResolved:      'Issue Resolved',
  yes:                'Yes',
  no:                 'No',
  // Ghost
  ghostReport:        'Ghost Detection Report',
  newReport2:         'New Report',
  original:           'Original',
  resolution:         'Resolution',
  // AI classification
  aiClassification:   'AI Classification',
  // Info grid labels
  infoLocation:       'Location',
  infoOfficer:        'Assigned Officer',
  infoReported:       'Reported',
  infoSLA:            'SLA Deadline',
  daysAgoLabel:       'days ago',
  notAssigned:        'Not yet assigned',
  // Footer
  footerNote:         'This ticket is public. Anyone with the link can follow its progress.',
  reportYours:        'Report your own issue →',
};

// ─── CommunitySection ─────────────────────────────────────────────────────────
function CommunitySection({ ticket, upvoteCount, upvoted, onUpvote, canReopen, tr }) {
  const [copied, setCopied]           = useState(false);
  const [reopenLoading, setReopenLoading] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${ticket.publicId} — Community Hero`, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(tr.linkCopied);
    }
  };

  const level = upvoteCount >= 10 ? 'verified'
              : upvoteCount >= 3  ? 'corroborated'
              : upvoteCount >= 1  ? 'noticed'
              : 'new';

  const levelConfig = {
    verified:     { bg: '#E8F5EE', border: '#A7D5B9', text: '#1A7A4A', badge: tr.communityVerified },
    corroborated: { bg: '#E8F5EE', border: '#A7D5B9', text: '#1A7A4A', badge: tr.corroborated },
    noticed:      { bg: '#FEF3E7', border: '#F0C070', text: '#D4730A', badge: tr.noticed },
    new:          { bg: '#F5F3F0', border: '#E5E2DE', text: '#7A7875', badge: tr.newReport },
  }[level];

  const avatarCount = Math.min(upvoteCount, 7);

  const headerText = upvoteCount === 0
    ? tr.beFirstCorroborate
    : `${upvoteCount} ${upvoteCount === 1 ? tr.neighbourSeen : tr.neighboursSeen}`;

  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{
        background: levelConfig.bg, borderBottom: `1px solid ${levelConfig.border}`,
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <IconUsers size={16} stroke={1.5} style={{ color: levelConfig.text, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: levelConfig.text }}>{headerText}</span>
          {upvoteCount > 0 && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
              textTransform: 'uppercase', padding: '2px 7px', borderRadius: 10,
              background: levelConfig.border, color: levelConfig.text,
            }}>{levelConfig.badge}</span>
          )}
        </div>
        <button onClick={handleShare} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          background: 'white', border: `1px solid ${levelConfig.border}`,
          color: levelConfig.text, cursor: 'pointer', flexShrink: 0,
        }}>
          {copied ? <IconCheck size={12} stroke={2.5} /> : <IconShare size={12} stroke={1.5} />}
          {copied ? tr.copied : tr.share}
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {avatarCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex' }}>
              {Array.from({ length: avatarCount }).map((_, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  marginLeft: i > 0 ? -10 : 0,
                  border: '2px solid white', zIndex: avatarCount - i,
                  background: ['#C13B2A20','#D4730A20','#1A7A4A20','#2D6A9F20','#6B50B820','#B8B5B020','#4A4A4820'][i % 7],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#7A7875', fontWeight: 700,
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {upvoteCount > 7 && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', marginLeft: -10,
                  border: '2px solid white', background: '#E5E2DE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#7A7875', fontWeight: 700,
                }}>+{upvoteCount - 7}</div>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#7A7875', margin: 0 }}>
              {upvoteCount === 1
                ? `1 ${tr.personReported}`
                : `${upvoteCount} ${tr.peopleReported}`}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={onUpvote} disabled={upvoted} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', borderRadius: 6, cursor: upvoted ? 'default' : 'pointer',
            fontWeight: 600, fontSize: 13, border: 'none',
            background: upvoted ? '#1A7A4A' : '#C13B2A',
            color: 'white', opacity: upvoted ? 0.85 : 1,
          }}>
            {upvoted ? <IconCheck size={15} stroke={2.5} /> : <IconThumbUp size={15} stroke={1.5} />}
            {upvoted ? tr.youCorroborated : tr.iSeenThis}
          </button>

          <Link to="/citizen/report" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            border: '1px solid #E5E2DE', color: '#4A4A48',
            background: 'white', textDecoration: 'none',
          }}>
            <IconFlag size={13} stroke={1.5} />
            {tr.reportSimilar}
          </Link>

          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            border: '1px solid #E5E2DE', color: '#4A4A48',
            background: 'white', cursor: 'pointer',
          }}>
            <IconLink size={13} stroke={1.5} />
            {tr.copyLink}
          </button>

          {canReopen && (
            <>
              <input type="file" accept="image/*" id="reopen-photo" style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setReopenLoading(true);
                  const fd = new FormData();
                  fd.append('photo', file);
                  try {
                    await api.post(`/tickets/${ticket.id}/reopen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    toast.success(tr.reopenSuccess);
                  } catch { toast.error(tr.reopenError); }
                  e.target.value = '';
                  setReopenLoading(false);
                }}
              />
              <button onClick={() => document.getElementById('reopen-photo').click()} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: '1px solid #D4730A', color: '#D4730A',
                background: '#FEF3E7', cursor: 'pointer',
              }}>
                <IconGhost size={13} stroke={1.5} />
                {reopenLoading ? tr.uploading : tr.flagNotFixed}
              </button>
            </>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#B8B5B0', marginTop: 10, marginBottom: 0 }}>
          {tr.corrobExplainer}
        </p>
      </div>
    </div>
  );
}

// ─── TimelineTab ──────────────────────────────────────────────────────────────
function TimelineTab({ ticketId, tr }) {
  const [logs, setLogs] = useState([]);

  // Map action codes → translated label keys
  const ACTION_KEY = {
    TICKET_CREATED:            'ticketCreated',
    OFFICER_ASSIGNED:          'officerAssigned',
    STATUS_UPDATE_IN_PROGRESS: 'workStarted',
    RESOLVED:                  'markedResolved',
    GHOST_REOPEN:              'citizenFlagged',
    GHOST_CHECK:               'aiGhostRan',
    AUTO_ESCALATED:            'escalatedSLA',
    RTI_GENERATED:             'rtiFiled',
    FIRST_APPEAL_GENERATED:    'firstAppeal',
    DUPLICATE_MERGED:          'mergedDuplicate',
  };

  const ACTION_COLOR = {
    TICKET_CREATED: '#7A7875', OFFICER_ASSIGNED: '#2D6A9F', STATUS_UPDATE_IN_PROGRESS: '#2D6A9F',
    RESOLVED: '#1A7A4A', GHOST_REOPEN: '#8B1A1A', GHOST_CHECK: '#6B50B8',
    AUTO_ESCALATED: '#D4730A', RTI_GENERATED: '#C13B2A', FIRST_APPEAL_GENERATED: '#C13B2A',
    DUPLICATE_MERGED: '#7A7875',
  };

  useEffect(() => {
    if (!ticketId) return;
    const q = query(collection(db, 'ticket_logs'), where('ticketId', '==', ticketId));
    return onSnapshot(q, snap => {
      const sorted = snap.docs.map(d => d.data()).sort((a, b) => {
        const ta = a.timestamp ?? '';
        const tb = b.timestamp ?? '';
        return tb > ta ? 1 : -1;
      });
      setLogs(sorted);
    }, () => {});
  }, [ticketId]);

  if (logs.length === 0) return (
    <p style={{ color: '#B8B5B0', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>
      {tr.noTimeline}
    </p>
  );

  return (
    <div>
      {logs.map((log, i) => {
        const labelKey = ACTION_KEY[log.action];
        const label    = labelKey ? tr[labelKey] : log.action?.replace(/_/g, ' ');
        const color    = ACTION_COLOR[log.action] || '#B8B5B0';
        return (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '12px 0',
            borderBottom: i < logs.length - 1 ? '1px solid #F0EDE9' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: `${color}15`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginTop: 1,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#4A4A48', margin: '0 0 2px' }}>{label}</p>
              {log.note && <p style={{ fontSize: 12, color: '#7A7875', margin: '0 0 2px' }}>{log.note}</p>}
              <p style={{ fontSize: 11, color: '#B8B5B0', margin: 0 }}>{formatDate(log.timestamp)}</p>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              background: `${color}15`, color, flexShrink: 0, marginTop: 6,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {log.newState || ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ask AI ──────────────────────────────────────────────────────────────────
function QueryBot({ ticketPublicId, tr }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);

  const suggestions = [tr.whyDelayed, tr.whenResolved, tr.whoAssigned, tr.slaExpired];

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
      setHistory(h => [...h, { role: 'bot', text: tr.aiError }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: '#EDE9F8', borderLeft: '3px solid #6B50B8', borderRadius: 4, padding: '14px 16px', marginBottom: 14 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: '#6B50B8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconSparkles size={14} stroke={2} /> {tr.askAbout}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => askQuestion(s)} style={{
              fontSize: 12, padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
              border: '1px solid #6B50B8', color: '#6B50B8', background: 'white',
            }}>
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); askQuestion(); }} style={{ display: 'flex', gap: 8 }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            placeholder={tr.typeQuestion} style={{
              flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 6,
              border: '1px solid #E5E2DE', outline: 'none', color: '#4A4A48',
            }} />
          <button type="submit" disabled={loading || !question.trim()} style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 600, color: 'white',
            background: '#6B50B8', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading || !question.trim() ? 0.6 : 1,
          }}>
            {loading ? '…' : tr.askBtn}
          </button>
        </form>
      </div>
      {history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {history.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                padding: '8px 12px', borderRadius: 6, maxWidth: '80%', fontSize: 13, lineHeight: 1.5,
                background: msg.role === 'user' ? '#C13B2A' : '#F5F3F0',
                color: msg.role === 'user' ? 'white' : '#4A4A48',
              }}>
                {msg.role === 'bot' && <span style={{ color: '#6B50B8', fontWeight: 700, marginRight: 4 }}>◆</span>}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '8px 12px', background: '#F5F3F0', color: '#7A7875', fontSize: 13, borderRadius: 6 }}>{tr.thinking}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ghost + Evidence cards ───────────────────────────────────────────────────
function GhostReportCard({ ghostReport, tr }) {
  if (!ghostReport) return null;
  const color = ghostReport.decision === 'reject_resolution' ? '#C13B2A'
              : ghostReport.decision === 'needs_review'       ? '#D4730A'
              : '#1A7A4A';
  return (
    <div style={{ background: `${color}10`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <IconGhost size={15} stroke={1.5} style={{ color }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: '#4A4A48' }}>{tr.ghostReport}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${color}20`, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {ghostReport.decision?.replace(/_/g, ' ')}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#4A4A48', marginBottom: ghostReport.comparison ? 10 : 0 }}>{ghostReport.reason}</p>
      {ghostReport.comparison && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, background: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 6 }}>
          {[[tr.newReport2, ghostReport.comparison.image1_shows],[tr.original, ghostReport.comparison.image2_shows],[tr.resolution, ghostReport.comparison.image3_shows]].map(([label, val]) => (
            <div key={label}><p style={{ fontSize: 10, fontWeight: 700, color: '#7A7875', marginBottom: 3 }}>{label}</p><p style={{ fontSize: 12, color: '#4A4A48', margin: 0 }}>{val}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceReportCard({ evidenceReport, tr }) {
  if (!evidenceReport) return null;
  const color = evidenceReport.approved ? '#1A7A4A' : '#C13B2A';
  return (
    <div style={{ background: `${color}10`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#4A4A48' }}>{tr.resolutionEvidence}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${color}20`, color, textTransform: 'uppercase' }}>
          {evidenceReport.approved ? tr.approved : tr.rejected}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: '#4A4A48' }}>
        {[
          [tr.aiConf,        `${evidenceReport.geminiConfidence}%`],
          [tr.sameLocation,  evidenceReport.sameLocation  ? `✓ ${tr.yes}` : `✗ ${tr.no}`],
          [tr.issueResolved, evidenceReport.issueResolved ? `✓ ${tr.yes}` : `✗ ${tr.no}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F0EDE9' }}>
            <span style={{ color: '#7A7875' }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      {evidenceReport.rejectionReason && (
        <p style={{ fontSize: 12, color: '#C13B2A', background: '#FDF1EF', padding: '8px 10px', borderRadius: 4, marginTop: 10, marginBottom: 0 }}>
          {evidenceReport.rejectionReason}
        </p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PublicTracker() {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const { ticket, loading, error } = useTicket(id);
  const tr                  = useTranslateMap(STRINGS);
  const [tab, setTab]       = useState('timeline');
  const [upvoted, setUpvoted]     = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => { if (ticket) setUpvoteCount(ticket.upvoteCount || 0); }, [ticket]);

  const handleUpvote = async () => {
    if (upvoted) return;
    try {
      const res = await api.post(`/tickets/${ticket.id}/upvote`, { email: 'anonymous@track.app' });
      setUpvoted(true);
      setUpvoteCount(res.data.upvoteCount);
      toast.success(tr.corrobThanks);
    } catch { toast.error(tr.corrobError); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3F0' }}>
      <LoadingSpinner />
    </div>
  );

  if (error || !ticket) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3F0' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, color: '#B8B5B0', marginBottom: 12 }}>?</p>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#4A4A48', marginBottom: 8 }}>{tr.notFound}</h2>
        <p style={{ fontSize: 13, color: '#7A7875', marginBottom: 20 }}>{tr.notFoundSub}</p>
        <Link to="/" style={{ fontSize: 13, fontWeight: 600, color: 'white', background: '#C13B2A', padding: '10px 20px', borderRadius: 6, textDecoration: 'none' }}>
          {tr.goHome}
        </Link>
      </div>
    </div>
  );

  const daysSinceCreated = daysAgo(ticket.createdAt);
  const canRTI           = daysSinceCreated >= 30;
  const canReopen        = ticket.status === 'RESOLVED' && ticket.ghostWindowOpen;
  const sevColor         = ticket.severity >= 9 ? '#C13B2A' : ticket.severity >= 4 ? '#D4730A' : '#1A7A4A';

  const tabs = [
    { id: 'timeline', label: tr.tabTimeline, icon: IconTimeline },
    { id: 'photos',   label: tr.tabPhotos,   icon: IconPhoto },
    { id: 'ask',      label: tr.tabAskAI,    icon: IconRobot },
    ...(ticket.evidenceReport ? [{ id: 'evidence', label: tr.tabEvidence, icon: IconScale }]  : []),
    ...(ticket.ghostReport    ? [{ id: 'ghost',    label: tr.tabGhost,    icon: IconGhost  }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E5E2DE', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#7A7875', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <IconArrowLeft size={14} stroke={1.5} /> {tr.back}
          </button>
          <span style={{ color: '#E5E2DE' }}>/</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#4A4A48', letterSpacing: '0.05em' }}>{ticket.publicId}</span>
          <div style={{ flex: 1 }} />
          <Link to="/" style={{ fontSize: 11, fontWeight: 700, color: '#C13B2A', textDecoration: 'none', letterSpacing: '0.04em' }}>
            COMMUNITY HERO
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Duplicate notice */}
        {ticket.probableDuplicateOf && (
          <div style={{
            background: '#FEF3E7', border: '1px solid #F0C070', borderRadius: 8,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <IconAlertTriangle size={15} stroke={1.5} style={{ color: '#D4730A', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#D4730A' }}>{tr.possibleDuplicate} — </span>
              <span style={{ fontSize: 12, color: '#7A7875' }}>
                {tr.dupAlreadyReported}{' '}
                <Link to={`/track/${ticket.probableDuplicateOf}`} style={{ color: '#D4730A', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                  {ticket.probableDuplicateOf}
                </Link>
                {ticket.duplicateMatchConfidence && ` (${ticket.duplicateMatchConfidence}% match)`}
              </span>
            </div>
            <Link to={`/track/${ticket.probableDuplicateOf}`} style={{
              fontSize: 11, fontWeight: 600, color: '#D4730A',
              display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', flexShrink: 0,
            }}>
              {tr.viewOriginal} <IconArrowRight size={11} stroke={2} />
            </Link>
          </div>
        )}

        {/* Main ticket card */}
        <div style={card}>
          <div style={{ height: 4, background: '#E5E2DE', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(ticket.severity / 10) * 100}%`, background: sevColor, borderRadius: '8px 8px 0 0' }} />
          </div>

          <div style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <StatusBadge status={ticket.status} size="lg" />
                  {ticket.slaBreached && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#FDF1EF', color: '#C13B2A' }}>
                      <IconAlertTriangle size={10} stroke={2} /> {tr.slaBreach}
                    </span>
                  )}
                  {ticket.ghostCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#F5EAEA', color: '#8B1A1A' }}>
                      Ghost ×{ticket.ghostCount}
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2A2A28', margin: '0 0 2px', textTransform: 'capitalize' }}>
                  {ticket.issueType?.replace(/_/g, ' ')}
                </h1>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#B8B5B0', margin: 0, letterSpacing: '0.06em' }}>{ticket.publicId}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 700, color: sevColor, lineHeight: 1, margin: 0 }}>
                  {ticket.severity}<span style={{ fontSize: 14, fontWeight: 400, color: '#B8B5B0' }}>/10</span>
                </p>
                <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B8B5B0', marginTop: 2 }}>{tr.severity}</p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#4A4A48', lineHeight: 1.65, marginBottom: 18 }}>{ticket.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0 }}>
              {[
                { icon: IconMapPin,   labelKey: 'infoLocation', value: ticket.location?.address,                            sub: `Ward: ${ticket.location?.ward}` },
                { icon: IconUser,     labelKey: 'infoOfficer',  value: ticket.assignedOfficerName || tr.notAssigned,        sub: ticket.departmentId?.replace(/_/g, ' ') },
                { icon: IconCalendar, labelKey: 'infoReported', value: formatDate(ticket.createdAt),                        sub: `${daysSinceCreated} ${tr.daysAgoLabel}` },
                { icon: IconClock,    labelKey: 'infoSLA',      value: null, sub: null, sla: true },
              ].map(({ icon: Icon, labelKey, value, sub, sla }) => (
                <div key={labelKey} style={{ padding: '10px 12px', background: '#F5F3F0', borderRadius: 6 }}>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#B8B5B0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Icon size={10} stroke={1.5} /> {tr[labelKey]}
                  </p>
                  {sla
                    ? <SLACountdown slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached} />
                    : <>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#4A4A48', margin: '0 0 1px' }}>{value}</p>
                        {sub && <p style={{ fontSize: 11, color: '#7A7875', margin: 0 }}>{sub}</p>}
                      </>
                  }
                </div>
              ))}
            </div>

            {canRTI && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#FDF1EF', border: '1px solid #F5C6C0', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconScale size={16} stroke={1.5} style={{ color: '#C13B2A', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#C13B2A', margin: '0 0 1px' }}>
                    {tr.rtiTitle} — {daysSinceCreated} {tr.rtiUnresolved}
                  </p>
                  <p style={{ fontSize: 11, color: '#7A7875', margin: 0 }}>{tr.rtiAutoFiled}</p>
                </div>
                {ticket.rtiPdfUrl && (
                  <a href={ticket.rtiPdfUrl} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 11, fontWeight: 600, color: 'white', background: '#C13B2A',
                    padding: '6px 12px', borderRadius: 4, textDecoration: 'none', flexShrink: 0,
                  }}>
                    {tr.downloadPdf}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Community section */}
        <CommunitySection
          ticket={ticket}
          upvoteCount={upvoteCount}
          upvoted={upvoted}
          onUpvote={handleUpvote}
          canReopen={canReopen}
          tr={tr}
        />

        {/* Tabs */}
        <div style={card}>
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E2DE', overflowX: 'auto' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                border: 'none', borderBottom: `2px solid ${tab === id ? '#C13B2A' : 'transparent'}`,
                marginBottom: -1, whiteSpace: 'nowrap', background: 'none',
                color: tab === id ? '#C13B2A' : '#7A7875',
              }}>
                <Icon size={14} stroke={1.5} />{label}
              </button>
            ))}
          </div>
          <div style={{ padding: '18px 20px' }}>
            {tab === 'timeline' && <TimelineTab ticketId={ticket.id} tr={tr} />}
            {tab === 'photos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7875', marginBottom: 8 }}>{tr.reportPhoto}</p>
                  <PhotoViewer photos={[ticket.photos?.report].filter(Boolean)} labels={[tr.reportPhoto]} />
                </div>
                {ticket.photos?.resolution && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7A7875', marginBottom: 8 }}>{tr.resolutionPhoto}</p>
                    <PhotoViewer photos={[ticket.photos.resolution]} labels={[tr.resolutionPhoto]} />
                  </div>
                )}
              </div>
            )}
            {tab === 'ask'      && <QueryBot ticketPublicId={ticket.publicId} tr={tr} />}
            {tab === 'evidence' && <EvidenceReportCard evidenceReport={ticket.evidenceReport} tr={tr} />}
            {tab === 'ghost'    && <GhostReportCard ghostReport={ticket.ghostReport} tr={tr} />}
          </div>
        </div>

        {/* AI classification */}
        {ticket.aiSuggested && (
          <div style={{ background: '#EDE9F8', borderLeft: '3px solid #6B50B8', borderRadius: 4, padding: '12px 16px' }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: '#6B50B8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconSparkles size={13} stroke={2} /> ◆ {tr.aiClassification}
            </p>
            <p style={{ fontSize: 13, color: '#4A4A48', margin: 0 }}>
              {tr.aiConf}: <strong>{ticket.aiSuggested.confidence}%</strong>
              {ticket.aiSuggested.reasoning && <span style={{ color: '#7A7875' }}> — {ticket.aiSuggested.reasoning}</span>}
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#B8B5B0', paddingBottom: 8 }}>
          {tr.footerNote}{' '}
          <Link to="/" style={{ color: '#C13B2A', textDecoration: 'none' }}>{tr.reportYours}</Link>
        </p>
      </div>
    </div>
  );
}
