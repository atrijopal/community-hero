import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useOfficerQueue } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import { SEVERITY_COLOR } from '../../utils/constants';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

function MetricCard({ icon, label, value, sub, color = 'text-blue-600', bg = 'bg-blue-50' }) {
  return (
    <div className={`${bg} rounded-2xl p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function OfficerDashboard() {
  const { user, role } = useAuth();
  const [officer, setOfficer] = useState(null);
  const { tickets, loading } = useOfficerQueue(user?.uid);

  useEffect(() => {
    if (!user?.uid) return;
    // Try to load officer profile from Firestore
    const unsub = onSnapshot(doc(db, 'officers', user.uid), snap => {
      if (snap.exists()) setOfficer({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [user?.uid]);

  const active   = tickets.filter(t => !['RESOLVED','GHOST_FLAGGED','CLOSED_OVERRIDE'].includes(t.status));
  const critical = tickets.filter(t => t.severity >= 9 && !['RESOLVED','GHOST_FLAGGED','CLOSED_OVERRIDE'].includes(t.status));
  const overdue  = tickets.filter(t => t.slaBreached && !['RESOLVED','GHOST_FLAGGED','CLOSED_OVERRIDE'].includes(t.status));
  const score    = officer?.accountabilityScore ?? 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {officer?.name || user?.displayName || 'Officer'} 👮
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{officer?.designation} · {officer?.departmentId?.replace(/_/g,' ')}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${score >= 90 ? 'bg-green-100 text-green-700' : score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            Accountability: {score}%
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon="📋" label="Active Cases"    value={active.length}            color="text-blue-600"   bg="bg-blue-50" />
          <MetricCard icon="🔴" label="Critical"        value={critical.length}           color="text-red-600"    bg="bg-red-50" />
          <MetricCard icon="⚠️" label="SLA Overdue"    value={overdue.length}            color="text-orange-600" bg="bg-orange-50" />
          <MetricCard icon="✅" label="Resolved Total"  value={officer?.resolvedCount||0} color="text-green-600"  bg="bg-green-50"
            sub={`${officer?.ghostClosureCount||0} ghost flags`} />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/officer/queue" className="bg-white border-2 border-blue-200 rounded-2xl p-4 text-center hover:border-blue-400 hover:shadow-sm transition">
            <span className="text-3xl block mb-1">📥</span>
            <p className="font-semibold text-gray-800">My Queue</p>
            <p className="text-xs text-gray-500 mt-0.5">{active.length} active issues</p>
          </Link>
          <Link to="/officer/queries" className="bg-white border-2 border-purple-200 rounded-2xl p-4 text-center hover:border-purple-400 hover:shadow-sm transition">
            <span className="text-3xl block mb-1">💬</span>
            <p className="font-semibold text-gray-800">Citizen Queries</p>
            <p className="text-xs text-gray-500 mt-0.5">Via AI QueryBot</p>
          </Link>
        </div>

        {/* Recent critical tickets */}
        {critical.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <h3 className="font-bold text-red-800 mb-3">🚨 Critical Issues Requiring Immediate Attention</h3>
            <div className="space-y-2">
              {critical.slice(0, 3).map(t => (
                <Link key={t.id} to={`/track/${t.publicId}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 hover:shadow-sm transition">
                  <div className={`w-1.5 h-10 rounded-full ${SEVERITY_COLOR(t.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{issueTypeLabel(t.issueType)}</p>
                    <p className="text-xs text-gray-500 truncate">{t.location?.address}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent queue preview */}
        {loading ? <LoadingSpinner /> : active.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Recent Assignments</h3>
              <Link to="/officer/queue" className="text-blue-600 text-sm hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {active.slice(0, 5).map(t => (
                <Link key={t.id} to={`/track/${t.publicId}`}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition">
                  <div className={`w-1 h-8 rounded-full ${SEVERITY_COLOR(t.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{t.publicId}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm font-medium text-gray-800">{issueTypeLabel(t.issueType)}</p>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(t.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
