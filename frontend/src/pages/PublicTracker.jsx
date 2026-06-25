import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTicket } from '../hooks/useTicket';
import StatusBadge from '../components/shared/StatusBadge';
import SLACountdown from '../components/shared/SLACountdown';
import PhotoViewer from '../components/shared/PhotoViewer';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { formatDate, timeAgo, issueTypeLabel, daysAgo } from '../utils/formatters';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import api from '../utils/api';
import toast from 'react-hot-toast';

function TimelineTab({ ticketId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!ticketId) return;
    const q = query(
      collection(db, 'ticket_logs'),
      where('ticketId', '==', ticketId),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [ticketId]);

  const ACTION_ICONS = {
    TICKET_CREATED: '📋', OFFICER_ASSIGNED: '👮', RESOLVED: '✅',
    GHOST_REOPEN: '👻', GHOST_CHECK: '🔍', AUTO_ESCALATED: '⬆️',
    RTI_GENERATED: '⚖️', STATUS_UPDATE_IN_PROGRESS: '🔄',
  };

  return (
    <div className="space-y-3">
      {logs.length === 0 ? (
        <p className="text-gray-500 text-sm">No timeline events yet.</p>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm shrink-0">
              {ACTION_ICONS[log.action] || '📌'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                {log.action?.replace(/_/g, ' ')}
                {log.newState && <span className="text-gray-500"> → {log.newState}</span>}
              </p>
              <p className="text-xs text-gray-400">{formatDate(log.timestamp)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function QueryBot({ ticketPublicId }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState('');
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
      const ans = res.data.answer;
      setAnswer(ans);
      setHistory(h => [...h, { role: 'bot', text: ans }]);
    } catch (err) {
      const msg = 'Sorry, I could not answer that right now.';
      setHistory(h => [...h, { role: 'bot', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
        <p className="text-sm text-blue-700 font-medium mb-3">🤖 Ask about your ticket</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => askQuestion(s)}
              className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); askQuestion(); }} className="flex gap-2">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? '...' : 'Ask'}
          </button>
        </form>
      </div>

      {history.length > 0 && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {history.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-xl px-4 py-2 max-w-xs text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                {msg.role === 'bot' && <span className="text-blue-600 font-medium">🤖 </span>}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-500">
                <span className="animate-pulse">Thinking...</span>
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
  const colors = {
    reject_resolution: 'border-red-200 bg-red-50',
    needs_review:      'border-yellow-200 bg-yellow-50',
    accept_resolution: 'border-green-200 bg-green-50',
  };
  return (
    <div className={`border-2 rounded-xl p-4 ${colors[ghostReport.decision] || 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">👻</span>
        <span className="font-bold text-gray-900">Ghost Detection Report</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          ghostReport.decision === 'reject_resolution' ? 'bg-red-100 text-red-700' :
          ghostReport.decision === 'needs_review'      ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {ghostReport.decision?.replace('_', ' ').toUpperCase()}
        </span>
        <span className="text-xs text-gray-500">({ghostReport.confidence}% confidence)</span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{ghostReport.reason}</p>
      {ghostReport.comparison && (
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 bg-white/60 rounded-lg p-3">
          <div><p className="font-medium text-gray-500 mb-1">New Report</p><p>{ghostReport.comparison.image1_shows}</p></div>
          <div><p className="font-medium text-gray-500 mb-1">Original</p><p>{ghostReport.comparison.image2_shows}</p></div>
          <div><p className="font-medium text-gray-500 mb-1">Resolution</p><p>{ghostReport.comparison.image3_shows}</p></div>
        </div>
      )}
    </div>
  );
}

function EvidenceReportCard({ evidenceReport }) {
  if (!evidenceReport) return null;
  return (
    <div className={`border-2 rounded-xl p-4 ${evidenceReport.approved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{evidenceReport.approved ? '✅' : '❌'}</span>
        <span className="font-bold text-gray-900">Resolution Evidence Report</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${evidenceReport.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {evidenceReport.approved ? 'APPROVED' : 'REJECTED'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div><span className="text-gray-500">AI Confidence</span><span className="float-right font-medium">{evidenceReport.geminiConfidence}%</span></div>
        <div><span className="text-gray-500">Same Location</span><span className="float-right">{evidenceReport.sameLocation ? '✓' : '✗'}</span></div>
        <div><span className="text-gray-500">Issue Resolved</span><span className="float-right">{evidenceReport.issueResolved ? '✓' : '✗'}</span></div>
      </div>
      {evidenceReport.rejectionReason && (
        <p className="text-sm text-red-600 bg-red-100 rounded-lg px-3 py-2">⚠ {evidenceReport.rejectionReason}</p>
      )}
    </div>
  );
}

export default function PublicTracker() {
  const { id }            = useParams();
  const { ticket, loading, error } = useTicket(id);
  const [tab, setTab]     = useState('timeline');
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);

  useEffect(() => {
    if (ticket) setUpvoteCount(ticket.upvoteCount || 0);
  }, [ticket]);

  const handleUpvote = async () => {
    if (upvoted) return;
    try {
      const res = await api.post(`/tickets/${ticket.publicId}/upvote`, { email: 'anonymous@track.app' });
      setUpvoted(true);
      setUpvoteCount(res.data.upvoteCount);
      toast.success('Upvoted! This brings the issue to attention.');
    } catch {
      toast.error('Could not upvote. Try signing in.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner text="Loading ticket..." />
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ticket not found</h2>
        <p className="text-gray-500 mb-6">Check the ticket ID and try again</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition">Go Home</Link>
      </div>
    </div>
  );

  const daysSinceCreated = daysAgo(ticket.createdAt);
  const canRTI = daysSinceCreated >= 30;
  const canReopen = ticket.status === 'RESOLVED' && ticket.ghostWindowOpen;
  const tabs = [
    { id: 'timeline', label: '📋 Timeline' },
    { id: 'photos',   label: '📷 Photos' },
    { id: 'ask',      label: '🤖 Ask AI' },
    ...(ticket.evidenceReport ? [{ id: 'evidence', label: '🔬 Evidence' }] : []),
    ...(ticket.ghostReport    ? [{ id: 'ghost',    label: '👻 Ghost' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 flex items-center h-14 gap-3">
          <Link to="/" className="text-blue-600 text-sm hover:underline">← Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-mono">{ticket.publicId}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Ticket header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={ticket.status} size="lg" />
                {ticket.slaBreached && (
                  <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                    ⚠️ SLA Breached
                  </span>
                )}
                {ticket.ghostCount > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                    👻 Ghost ×{ticket.ghostCount}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {ticket.issueType?.replace(/_/g, ' ')}
              </h1>
              <p className="text-gray-500 text-sm mt-1 font-mono">{ticket.publicId}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-gray-700">{ticket.severity}<span className="text-sm text-gray-400 font-normal">/10</span></p>
              <p className="text-xs text-gray-400">severity</p>
            </div>
          </div>

          <p className="text-gray-700 mb-4">{ticket.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">📍 Location</p>
              <p className="font-medium mt-0.5">{ticket.location?.address}</p>
              <p className="text-gray-400 text-xs">Ward: {ticket.location?.ward}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">👤 Assigned Officer</p>
              <p className="font-medium mt-0.5">{ticket.assignedOfficerName || 'Not yet assigned'}</p>
              <p className="text-gray-400 text-xs">{ticket.departmentId?.replace(/_/g, ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">📅 Reported</p>
              <p className="font-medium mt-0.5">{formatDate(ticket.createdAt)}</p>
              <p className="text-gray-400 text-xs">{daysSinceCreated} days ago</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs">⏱️ SLA Deadline</p>
              <SLACountdown slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleUpvote}
              disabled={upvoted}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                upvoted ? 'bg-blue-50 text-blue-600 border border-blue-200 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              👍 {upvoted ? 'Upvoted' : 'Me Too'} ({upvoteCount})
            </button>

            {canReopen && (
              <Link
                to={`/citizen/tickets/${ticket.publicId}?action=reopen`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition"
              >
                👻 Issue Not Fixed? Report Ghost
              </Link>
            )}

            {canRTI && ticket.rtiPdfUrl ? (
              <a
                href={ticket.rtiPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition"
              >
                ⚖️ Download RTI Document
              </a>
            ) : canRTI && (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 transition"
              >
                ⚖️ Generate RTI ({daysSinceCreated} days old)
              </Link>
            )}

            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-blue-300 transition"
            >
              🔔 Get Updates
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'timeline' && <TimelineTab ticketId={ticket.id} />}
            {tab === 'photos' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Report Photo</p>
                  <PhotoViewer
                    photos={[ticket.photos?.report].filter(Boolean)}
                    labels={['Report']}
                  />
                </div>
                {ticket.photos?.resolution && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Resolution Photo</p>
                    <PhotoViewer
                      photos={[ticket.photos.resolution]}
                      labels={['Resolution']}
                    />
                  </div>
                )}
                {ticket.photos?.reopen?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Ghost Re-Report Photos</p>
                    <PhotoViewer photos={ticket.photos.reopen} labels={ticket.photos.reopen.map((_,i) => `Ghost ${i+1}`)} />
                  </div>
                )}
              </div>
            )}
            {tab === 'ask' && <QueryBot ticketPublicId={ticket.publicId} />}
            {tab === 'evidence' && <EvidenceReportCard evidenceReport={ticket.evidenceReport} />}
            {tab === 'ghost' && <GhostReportCard ghostReport={ticket.ghostReport} />}
          </div>
        </div>

        {/* AI suggestion info */}
        {ticket.aiSuggested && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
            <p className="font-medium text-blue-700 mb-1">◆ AI Classification</p>
            <p className="text-blue-600">
              Confidence: <strong>{ticket.aiSuggested.confidence}%</strong>
              {ticket.aiSuggested.reasoning && <span className="text-blue-500 ml-2">— {ticket.aiSuggested.reasoning}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
