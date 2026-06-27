import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconClipboardList, IconAlertTriangle, IconClock, IconCircleCheck, IconInbox, IconMessage } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/shared/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useOfficerQueue } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

function MetricCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="bg-white border p-4" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} stroke={1.5} style={{ color }} />
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#7A7875' }}>{label}</p>
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>{sub}</p>}
    </div>
  );
}

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [officer, setOfficer] = useState(null);
  const { tickets, loading } = useOfficerQueue(user?.uid);

  useEffect(() => {
    if (!user?.uid) return;
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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>
              Welcome, {officer?.name || user?.displayName || 'Officer'}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#7A7875' }}>{officer?.designation} · {officer?.departmentId?.replace(/_/g,' ')}</p>
          </div>
          <div className="px-3 py-1.5 text-sm font-bold border" style={{
            borderRadius: '6px',
            backgroundColor: score >= 90 ? '#E8F5EE' : score >= 70 ? '#FFF8E0' : '#FDF1EF',
            color: score >= 90 ? '#1A7A4A' : score >= 70 ? '#8B6600' : '#C13B2A',
            borderColor: score >= 90 ? '#A7D5B9' : score >= 70 ? '#F5D56A' : '#E5C5BF',
          }}>
            Accountability: {score}%
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Cases"   value={active.length}            color="#4A4A48" icon={IconClipboardList} />
          <MetricCard label="Critical"       value={critical.length}          color="#C13B2A" icon={IconAlertTriangle} />
          <MetricCard label="SLA Overdue"    value={overdue.length}           color="#D4730A" icon={IconClock} />
          <MetricCard label="Resolved Total" value={officer?.resolvedCount||0} color="#1A7A4A" icon={IconCircleCheck}
            sub={officer?.ghostClosureCount > 0 ? `${officer.ghostClosureCount} ghost flags` : undefined} />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/officer/queue" className="bg-white border p-4 text-center transition-colors hover:bg-white"
            style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <IconInbox size={24} stroke={1.5} style={{ color: '#C13B2A', margin: '0 auto 8px' }} />
            <p className="font-semibold" style={{ color: '#4A4A48' }}>My Queue</p>
            <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{active.length} active issues</p>
          </Link>
          <Link to="/officer/queries" className="bg-white border p-4 text-center transition-colors hover:bg-white"
            style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <IconMessage size={24} stroke={1.5} style={{ color: '#6B50B8', margin: '0 auto 8px' }} />
            <p className="font-semibold" style={{ color: '#4A4A48' }}>Citizen Queries</p>
            <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>Via AI QueryBot</p>
          </Link>
        </div>

        {/* Critical tickets */}
        {critical.length > 0 && (
          <div className="border p-5" style={{ backgroundColor: '#FDF1EF', borderColor: '#E5C5BF', borderRadius: '8px' }}>
            <h3 className="font-bold mb-3" style={{ color: '#C13B2A' }}>Critical Issues Requiring Immediate Attention</h3>
            <div className="space-y-2">
              {critical.slice(0, 3).map(t => (
                <Link key={t.id} to={`/officer/ticket/${t.publicId}`}
                  className="flex items-center gap-3 bg-white p-3 transition-opacity hover:opacity-80"
                  style={{ borderRadius: '6px' }}>
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: '#C13B2A' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: '#4A4A48' }}>{issueTypeLabel(t.issueType)}</p>
                    <p className="text-xs truncate" style={{ color: '#7A7875' }}>{t.location?.address}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Queue preview */}
        {loading ? <LoadingSpinner /> : active.length > 0 && (
          <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ color: '#4A4A48' }}>Recent Assignments</h3>
              <Link to="/officer/queue" className="text-sm transition-opacity hover:opacity-70" style={{ color: '#C13B2A' }}>View all →</Link>
            </div>
            <div className="space-y-0">
              {active.slice(0, 5).map(t => (
                <Link key={t.id} to={`/officer/ticket/${t.publicId}`}
                  className="flex items-center gap-3 py-2.5 border-b last:border-0 hover:bg-surface-raised px-2 transition"
                  style={{ borderColor: '#E5E2DE' }}>
                  <span className="font-mono text-xs" style={{ color: '#B8B5B0' }}>{t.publicId}</span>
                  <StatusBadge status={t.status} />
                  <p className="flex-1 text-sm font-medium truncate" style={{ color: '#4A4A48' }}>{issueTypeLabel(t.issueType)}</p>
                  <span className="text-xs shrink-0" style={{ color: '#B8B5B0' }}>{timeAgo(t.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
