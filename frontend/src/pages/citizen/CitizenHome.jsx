import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useMyTickets } from '../../hooks/useTicket';
import { useGamification } from '../../hooks/useGamification';
import { useLanguage } from '../../context/LanguageContext';
import { useT } from '../../utils/translations';
import { levelName } from '../../utils/formatters';

const STATUS_STYLE = {
  UNASSIGNED:     { bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
  ASSIGNED:       { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  IN_PROGRESS:    { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  RESOLVED:       { bg: '#EBF5EF', text: '#1A7A4A', dot: '#1A7A4A' },
  ESCALATED:      { bg: '#FEF3E7', text: '#D4730A', dot: '#D4730A' },
  GHOST_FLAGGED:  { bg: '#F5EAEA', text: '#8B1A1A', dot: '#8B1A1A' },
  RTI_FILED:      { bg: '#FDF1EF', text: '#C13B2A', dot: '#C13B2A' },
  CLOSED_OVERRIDE:{ bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
};

function StatusBadge({ status, tr }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.UNASSIGNED;
  const label = tr[status] || status?.replace(/_/g, ' ') || 'UNKNOWN';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold tracking-wide"
      style={{ backgroundColor: style.bg, color: style.text }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: style.dot }} />
      {label}
    </span>
  );
}

function SeverityBar({ severity = 5, tr }) {
  const pct = (severity / 10) * 100;
  const color = severity >= 9 ? '#C13B2A' : severity >= 7 ? '#D4730A' : severity >= 4 ? '#D4730A' : '#1A7A4A';
  const label = severity >= 9 ? tr.CRITICAL : severity >= 7 ? tr.HIGH : severity >= 4 ? tr.MEDIUM : tr.LOW;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#E5E2DE' }}>
        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tracking-wide" style={{ color, minWidth: 52 }}>{severity}/10 {label}</span>
      {severity >= 9 && <span className="text-red-600 animate-pulse text-xs">⚠</span>}
    </div>
  );
}

function TicketRow({ ticket, tr }) {
  const t = ticket;
  return (
    <Link to={`/track/${t.publicId}`}
      className="block bg-white border border-gray-200 rounded-lg hover:border-concrete-light hover:shadow-sm transition mb-2">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-xs text-concrete-mid tracking-wider">{t.publicId}</span>
          <StatusBadge status={t.status} tr={tr} />
        </div>
        <div className="text-sm font-semibold mb-0.5" style={{ color: '#4A4A48' }}>
          {t.issueType?.replace(/_/g, ' ')} — {t.category?.replace(/_/g, ' ')}
        </div>
        <div className="text-xs mb-2" style={{ color: '#7A7875' }}>📍 {t.location?.address || `${t.location?.ward}, ${t.location?.city}`}</div>
        <SeverityBar severity={t.severity} tr={tr} />
        <div className="flex items-center justify-between mt-2 text-xs" style={{ color: '#B8B5B0' }}>
          <span>👍 {t.upvoteCount || 0}</span>
          {t.assignedOfficerName && <span>{tr.officer}: <span className="font-medium" style={{ color: '#4A4A48' }}>{t.assignedOfficerName}</span></span>}
          {t.aiSuggested?.confidence && <span className="text-predicted">◆ {t.aiSuggested.confidence}% {tr.aiConfidence}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function CitizenHome() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const tr = useT(lang);
  const { tickets: myTickets, loading: myLoading } = useMyTickets(user?.uid);
  const { gamification } = useGamification(user?.uid);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), limit(8));
    return onSnapshot(q,
      snap => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
          .slice(0, 6);
        setFeed(sorted);
      },
      () => setFeed([])
    );
  }, []);

  const active   = myTickets.filter(t => !['RESOLVED','CLOSED_OVERRIDE','REJECTED'].includes(t.status));
  const resolved = myTickets.filter(t => ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status));
  const xp = gamification?.xp || 0;
  const xpInLevel = xp % 500;
  const xpPct = (xpInLevel / 500) * 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#4A4A48', letterSpacing: '-0.3px' }}>
              {user?.displayName?.split(' ')[0] || 'Citizen'}'s {tr.dashboard}
            </h1>
            <p className="text-xs mt-0.5 uppercase tracking-wider font-medium" style={{ color: '#7A7875' }}>
              {tr.ward}
            </p>
          </div>
          <Link to="/citizen/report"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#C13B2A' }}>
            {tr.reportIssueBtn}
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: tr.myActive,  value: active.length,             color: '#2D6A9F' },
            { label: tr.resolved,  value: resolved.length,           color: '#1A7A4A' },
            { label: tr.totalXp,   value: xp,                        color: '#6B50B8' },
            { label: tr.level,     value: gamification?.level || 1,  color: '#D4730A' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg px-3 py-3 border border-gray-200">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium uppercase tracking-wider mt-0.5" style={{ color: '#B8B5B0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {xp > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A7875' }}>
                {levelName(xp)}
              </span>
              <span className="text-xs" style={{ color: '#B8B5B0' }}>{xpInLevel}/500 XP</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: '#F5F3F0' }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${xpPct}%`, backgroundColor: '#6B50B8' }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A7875' }}>
                {tr.myReports} ({myTickets.length})
              </h2>
              <Link to="/citizen/tickets" className="text-xs font-medium hover:underline" style={{ color: '#C13B2A' }}>{tr.viewAll}</Link>
            </div>
            {myLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#C13B2A', borderTopColor: 'transparent' }} />
              </div>
            ) : myTickets.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm font-medium" style={{ color: '#4A4A48' }}>{tr.noReports}</p>
                <p className="text-xs mt-1 mb-3" style={{ color: '#7A7875' }}>{tr.seeIssue}</p>
                <Link to="/citizen/report"
                  className="inline-block px-4 py-2 rounded text-white text-xs font-semibold"
                  style={{ backgroundColor: '#C13B2A' }}>
                  {tr.reportFirst}
                </Link>
              </div>
            ) : (
              myTickets.slice(0, 4).map(t => <TicketRow key={t.id} ticket={t} tr={tr} />)
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A7875' }}>
                {tr.communityFeed}
              </h2>
              <Link to="/citizen/map" className="text-xs font-medium hover:underline" style={{ color: '#C13B2A' }}>{tr.mapView}</Link>
            </div>
            {feed.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <div className="w-5 h-5 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#C13B2A', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              feed.map(t => <TicketRow key={t.id} ticket={t} tr={tr} />)
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { to: '/citizen/map',         icon: '🗺️', label: tr.communityMap },
            { to: '/citizen/leaderboard', icon: '🏆', label: tr.leaderboard },
            { to: '/citizen/profile',     icon: '👤', label: tr.myProfile },
            { to: '/citizen/tickets',     icon: '📋', label: tr.allMyTickets },
          ].map(l => (
            <Link key={l.to} to={l.to}
              className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 hover:border-gray-300 transition">
              <span className="text-lg">{l.icon}</span>
              <span className="text-xs font-medium" style={{ color: '#4A4A48' }}>{l.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
