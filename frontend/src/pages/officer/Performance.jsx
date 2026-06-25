import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit, onSnapshot as onSnap } from 'firebase/firestore';
import { timeAgo, formatDate } from '../../utils/formatters';

function ScoreMeter({ score }) {
  const color = score >= 90 ? '#34A853' : score >= 70 ? '#FBBC04' : '#EA4335';
  const angle = (score / 100) * 180 - 90;

  return (
    <div className="relative flex items-center justify-center my-4">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background arc */}
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#f0f0f0" strokeWidth="16" strokeLinecap="round" />
        {/* Score arc */}
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251} 251`} />
        {/* Needle */}
        <line x1="90" y1="90" x2={90 + 60 * Math.cos((angle * Math.PI) / 180)} y2={90 + 60 * Math.sin((angle * Math.PI) / 180)}
          stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        <circle cx="90" cy="90" r="5" fill="#374151" />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className="text-3xl font-bold" style={{ color }}>{score}</p>
        <p className="text-xs text-gray-500">/ 100</p>
      </div>
    </div>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const [officer, setOfficer]   = useState(null);
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'officers', user.uid), snap => {
      if (snap.exists()) { setOfficer({ id: snap.id, ...snap.data() }); }
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'officer_logs'),
      where('officerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    return onSnapshot(q, snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user?.uid]);

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner text="Loading performance..." /></div>;

  const score = officer?.accountabilityScore ?? 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 My Performance</h1>

        {/* Accountability score */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <h3 className="font-bold text-gray-800 mb-1">Accountability Score</h3>
          <p className="text-sm text-gray-500 mb-2">Ghost closures and overrides reduce this score</p>
          <ScoreMeter score={score} />
          {score < 90 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-3 text-sm text-yellow-800">
              ⚠️ Score below 90 — ghost detections have been flagged on your tickets
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Resolved',   value: officer?.resolvedCount || 0,      icon: '✅', color: 'text-green-600' },
            { label: 'Active Cases',     value: officer?.activeCaseCount || 0,    icon: '📋', color: 'text-blue-600' },
            { label: 'Ghost Flags',      value: officer?.ghostClosureCount || 0,  icon: '👻', color: 'text-red-600' },
            { label: 'Avg Rating',       value: `${(officer?.avgRating||0).toFixed(1)}⭐`, icon: '⭐', color: 'text-yellow-600' },
            { label: 'Escalations',      value: officer?.escalationCount || 0,    icon: '🚨', color: 'text-orange-600' },
            { label: 'Override Closures',value: officer?.overrideCloseCount || 0, icon: '🔓', color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scoring rules */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5">
          <h3 className="font-bold text-blue-900 mb-3">📋 How Scoring Works</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2"><span className="text-red-500">-10</span> Ghost closure detected by AI</div>
            <div className="flex items-center gap-2"><span className="text-red-500">-20</span> Ghost closure with admin override used</div>
            <div className="flex items-center gap-2"><span className="text-green-600">+0</span> Score recovers over time with good closures</div>
          </div>
        </div>

        {/* Activity log */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">📅 Recent Activity</h3>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                    log.type === 'ghost_detected' ? 'bg-red-100' :
                    log.type === 'ticket_resolved' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {log.type === 'ghost_detected' ? '👻' : log.type === 'ticket_resolved' ? '✅' : '📋'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{log.message || log.type?.replace(/_/g,' ')}</p>
                    {log.ticketId && <p className="text-xs text-gray-400 font-mono">{log.publicId}</p>}
                    <p className="text-xs text-gray-400">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
