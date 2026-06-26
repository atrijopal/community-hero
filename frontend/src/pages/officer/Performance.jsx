import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { timeAgo } from '../../utils/formatters';

function ScoreMeter({ score }) {
  const color = score >= 90 ? '#1A7A4A' : score >= 70 ? '#D4730A' : '#C13B2A';
  const angle = (score / 100) * 180 - 90;
  return (
    <div className="relative flex items-center justify-center my-4">
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#E5E2DE" strokeWidth="16" strokeLinecap="round" />
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 251} 251`} />
        <line x1="90" y1="90" x2={90 + 60 * Math.cos((angle * Math.PI) / 180)} y2={90 + 60 * Math.sin((angle * Math.PI) / 180)}
          stroke="#4A4A48" strokeWidth="3" strokeLinecap="round" />
        <circle cx="90" cy="90" r="5" fill="#4A4A48" />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className="text-3xl font-bold" style={{ color }}>{score}</p>
        <p className="text-xs" style={{ color: '#B8B5B0' }}>/ 100</p>
      </div>
    </div>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const [officer, setOfficer] = useState(null);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'officers', user.uid), snap => {
      if (snap.exists()) setOfficer({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'officer_logs'), where('officerId', '==', user.uid), limit(20));
    return onSnapshot(q, snap => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setLogs(sorted);
    });
  }, [user?.uid]);

  if (loading) return <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}><Navbar /><LoadingSpinner text="Loading performance…" /></div>;

  const score = officer?.accountabilityScore ?? 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>My Performance</h1>

        {/* Score meter */}
        <div className="bg-white border p-6 text-center" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <h3 className="font-semibold mb-1" style={{ color: '#4A4A48' }}>Accountability Score</h3>
          <p className="text-sm mb-2" style={{ color: '#7A7875' }}>Ghost closures and overrides reduce this score</p>
          <ScoreMeter score={score} />
          {score < 90 && (
            <div className="border p-3 mt-3 text-sm" style={{ backgroundColor: '#FFF8E0', borderColor: '#F5D56A', borderRadius: '6px', color: '#8B6600' }}>
              Score below 90 — ghost detections have been flagged on your tickets
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Resolved',    value: officer?.resolvedCount || 0,     color: '#1A7A4A' },
            { label: 'Active Cases',      value: officer?.activeCaseCount || 0,   color: '#4A4A48' },
            { label: 'Ghost Flags',       value: officer?.ghostClosureCount || 0, color: '#C13B2A' },
            { label: 'Avg Rating',        value: `${(officer?.avgRating||0).toFixed(1)}★`, color: '#D4730A' },
            { label: 'Escalations',       value: officer?.escalationCount || 0,   color: '#D4730A' },
            { label: 'Override Closures', value: officer?.overrideCloseCount || 0, color: '#6B50B8' },
          ].map(s => (
            <div key={s.label} className="bg-white border p-4 text-center" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scoring rules — purple AI surface */}
        <div className="border p-5" style={{ backgroundColor: '#EDE9F8', borderColor: '#B8A9E5', borderRadius: '8px' }}>
          <h3 className="font-semibold mb-3" style={{ color: '#4A3870' }}>How Scoring Works</h3>
          <div className="space-y-2 text-sm" style={{ color: '#4A3870' }}>
            <div className="flex items-center gap-2"><span style={{ color: '#C13B2A', fontWeight: 700 }}>-10</span> Ghost closure detected by AI</div>
            <div className="flex items-center gap-2"><span style={{ color: '#C13B2A', fontWeight: 700 }}>-20</span> Ghost closure with admin override used</div>
            <div className="flex items-center gap-2"><span style={{ color: '#1A7A4A', fontWeight: 700 }}>+0</span> Score recovers over time with good closures</div>
          </div>
        </div>

        {/* Activity log */}
        {logs.length > 0 && (
          <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#4A4A48' }}>Recent Activity</h3>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b pb-3 last:border-0" style={{ borderColor: '#E5E2DE' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: log.type === 'ghost_detected' ? '#FDF1EF' : log.type === 'ticket_resolved' ? '#E8F5EE' : '#F5F3F0' }}>
                    {log.type === 'ghost_detected' ? '👻' : log.type === 'ticket_resolved' ? '✓' : '·'}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#4A4A48' }}>{log.message || log.type?.replace(/_/g,' ')}</p>
                    {log.ticketId && <p className="text-xs font-mono" style={{ color: '#B8B5B0' }}>{log.publicId}</p>}
                    <p className="text-xs" style={{ color: '#B8B5B0' }}>{timeAgo(log.createdAt)}</p>
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
