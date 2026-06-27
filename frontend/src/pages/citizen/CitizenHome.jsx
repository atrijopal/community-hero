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
import { useTranslateMap } from '../../hooks/useTranslate';
import { levelName, timeAgo } from '../../utils/formatters';
import {
  IconPlus, IconMapPin, IconArrowUp, IconUser, IconSparkles,
  IconClipboard, IconMap, IconTrophy, IconUserCircle, IconTicket,
} from '@tabler/icons-react';

const STRINGS = {
  reportFirst: 'File your first report',
  CRITICAL:    'CRITICAL',
  HIGH:        'HIGH',
  MEDIUM:      'MEDIUM',
  LOW:         'LOW',
  aiConf:      'AI',
};

const STATUS_STYLE = {
  UNASSIGNED:      { bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
  ASSIGNED:        { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  IN_PROGRESS:     { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  RESOLVED:        { bg: '#EBF5EF', text: '#1A7A4A', dot: '#1A7A4A' },
  ESCALATED:       { bg: '#FEF3E7', text: '#D4730A', dot: '#D4730A' },
  GHOST_FLAGGED:   { bg: '#F5EAEA', text: '#8B1A1A', dot: '#8B1A1A' },
  RTI_FILED:       { bg: '#FDF1EF', text: '#C13B2A', dot: '#C13B2A' },
  CLOSED_OVERRIDE: { bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
};

function sevMeta(severity = 5) {
  if (severity >= 9) return { color: '#C13B2A', key: 'CRITICAL' };
  if (severity >= 7) return { color: '#D4730A', key: 'HIGH' };
  if (severity >= 4) return { color: '#D4730A', key: 'MEDIUM' };
  return { color: '#1A7A4A', key: 'LOW' };
}

function StatusChip({ status, tr }) {
  const s     = STATUS_STYLE[status] || STATUS_STYLE.UNASSIGNED;
  const label = tr[status] || status?.replace(/_/g, ' ') || '—';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 4, fontSize: 10,
      fontWeight: 700, letterSpacing: '0.05em',
      backgroundColor: s.bg, color: s.text, flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: s.dot }} />
      {label}
    </span>
  );
}

function TicketCard({ ticket, tr, xs, compact = false }) {
  const t     = ticket;
  const sev   = sevMeta(t.severity);
  const ago   = timeAgo(t.createdAt);
  const title = t.issueType?.replace(/_/g, ' ') || t.category?.replace(/_/g, ' ') || '—';
  const loc   = t.location?.address
    || [t.location?.ward, t.location?.city].filter(Boolean).join(', ');

  return (
    <Link
      to={`/track/${t.publicId}`}
      style={{
        display: 'block', background: 'white', borderRadius: 8,
        border: '1px solid #E5E2DE', marginBottom: 8, textDecoration: 'none',
        borderLeft: `3px solid ${sev.color}`,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ padding: '13px 16px 11px 13px' }}>

        {/* Row 1: mono ID + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#7A7875', letterSpacing: '0.08em', fontWeight: 600 }}>
            {t.publicId}
          </span>
          <StatusChip status={t.status} tr={tr} />
        </div>

        {/* Title */}
        <p style={{ fontSize: 13, fontWeight: 600, color: '#2A2A28', margin: '0 0 5px', lineHeight: 1.35 }}>
          {title}
        </p>

        {/* Location */}
        {loc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 9 }}>
            <IconMapPin size={11} stroke={1.5} style={{ color: '#B8B5B0', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#7A7875' }}>{loc}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#7A7875' }}>
            <IconArrowUp size={11} stroke={1.5} />
            {t.upvoteCount || 0}
          </span>

          {t.assignedOfficerName && !compact && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#7A7875' }}>
              <IconUser size={11} stroke={1.5} />
              <span style={{ color: '#4A4A48', fontWeight: 500 }}>{t.assignedOfficerName}</span>
            </span>
          )}

          {t.aiSuggested?.confidence && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6B50B8', fontWeight: 600 }}>
              <IconSparkles size={10} stroke={1.5} />
              {t.aiSuggested.confidence}% {xs.aiConf}
            </span>
          )}

          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#B8B5B0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: sev.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: sev.color }}>{t.severity}/10 {xs[sev.key]}</span>
            </span>
            <span>·</span>
            <span>{ago}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function Spinner() {
  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E2DE', padding: 32, textAlign: 'center' }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid #E5E2DE', borderTopColor: '#C13B2A',
        animation: 'spin 0.8s linear infinite', margin: '0 auto',
      }} />
    </div>
  );
}

export default function CitizenHome() {
  const { user }    = useAuth();
  const { lang }    = useLanguage();
  const tr          = useT(lang);
  const xs          = useTranslateMap(STRINGS);
  const { tickets: myTickets, loading: myLoading } = useMyTickets(user?.uid);
  const { gamification } = useGamification(user?.uid);
  const [feed, setFeed]  = useState([]);

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

  const active    = myTickets.filter(t => !['RESOLVED', 'CLOSED_OVERRIDE', 'REJECTED'].includes(t.status));
  const resolved  = myTickets.filter(t => ['RESOLVED', 'CLOSED_OVERRIDE'].includes(t.status));
  const xp        = gamification?.xp || 0;
  const xpInLevel = xp % 500;
  const xpPct     = (xpInLevel / 500) * 100;
  const firstName = user?.displayName?.split(' ')[0] || 'Citizen';

  const reportBtnLabel = (tr.reportIssue || 'Report Issue').replace(/^\+\s*/, '');

  const metrics = [
    { label: tr.myActive, value: active.length,            color: '#2A2A28' },
    { label: tr.resolved, value: resolved.length,           color: '#1A7A4A' },
    { label: tr.totalXp,  value: xp,                        color: '#2A2A28' },
    { label: tr.level,    value: gamification?.level || 1,  color: '#D4730A' },
  ];

  const quickLinks = [
    { to: '/citizen/map',         Icon: IconMap,        label: tr.communityMap },
    { to: '/citizen/leaderboard', Icon: IconTrophy,     label: tr.leaderboard },
    { to: '/citizen/profile',     Icon: IconUserCircle, label: tr.myProfile },
    { to: '/citizen/tickets',     Icon: IconTicket,     label: tr.allMyTickets },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F3F0' }}>
      <Navbar />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 56px' }}>

        {/* ── Header row ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2A2A28', margin: 0, letterSpacing: '-0.3px' }}>
              {firstName}'s {tr.dashboard}
            </h1>
            <p style={{ fontSize: 10, marginTop: 3, letterSpacing: '0.09em', fontWeight: 600, color: '#B8B5B0', textTransform: 'uppercase' }}>
              {tr.ward}
            </p>
          </div>
          <Link
            to="/citizen/report"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 7, backgroundColor: '#C13B2A',
              color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <IconPlus size={15} stroke={2.5} />
            {reportBtnLabel}
          </Link>
        </div>

        {/* ── Metric cards ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E2DE', padding: '16px 18px' }}>
              <p style={{ fontSize: 34, fontWeight: 800, color: m.color, margin: 0, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {m.value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.09em', color: '#B8B5B0', margin: '6px 0 0', textTransform: 'uppercase' }}>
                {m.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── XP progress bar ─────────────────────────────────── */}
        {xp > 0 && (
          <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E2DE', padding: '11px 18px', marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: '#4A4A48', textTransform: 'uppercase' }}>
                {levelName(xp)}
              </span>
              <span style={{ fontSize: 11, color: '#B8B5B0' }}>{xpInLevel} / 500 XP</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: '#F5F3F0', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${xpPct}%`, backgroundColor: '#C13B2A', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* ── Two-column body ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '62fr 38fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT — My Reports */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#7A7875', textTransform: 'uppercase', margin: 0 }}>
                {tr.myReports} ({myTickets.length})
              </h2>
              <Link to="/citizen/tickets" style={{ fontSize: 11, fontWeight: 600, color: '#C13B2A', textDecoration: 'none' }}>
                {tr.viewAll}
              </Link>
            </div>

            {myLoading ? (
              <Spinner />
            ) : myTickets.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E2DE', padding: '32px 24px', textAlign: 'center' }}>
                <IconClipboard size={30} stroke={1} style={{ color: '#D4CFC8', marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#4A4A48', margin: '0 0 4px' }}>{tr.noReports}</p>
                <p style={{ fontSize: 11, color: '#7A7875', margin: '0 0 18px' }}>{tr.seeIssue}</p>
                <Link to="/citizen/report" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 6, backgroundColor: '#C13B2A',
                  color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none',
                }}>
                  <IconPlus size={12} stroke={2.5} />
                  {xs.reportFirst}
                </Link>
              </div>
            ) : (
              myTickets.slice(0, 5).map(t => (
                <TicketCard key={t.id} ticket={t} tr={tr} xs={xs} />
              ))
            )}
          </div>

          {/* RIGHT — Community Feed */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#7A7875', textTransform: 'uppercase', margin: 0 }}>
                {tr.communityFeed}
              </h2>
              <Link to="/citizen/map" style={{ fontSize: 11, fontWeight: 600, color: '#C13B2A', textDecoration: 'none' }}>
                {tr.mapView}
              </Link>
            </div>

            {feed.length === 0 ? (
              <Spinner />
            ) : (
              feed.map(t => (
                <TicketCard key={t.id} ticket={t} tr={tr} xs={xs} compact />
              ))
            )}
          </div>
        </div>

        {/* ── Quick nav strip ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 28 }}>
          {quickLinks.map(({ to, Icon, label }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'white', border: '1px solid #E5E2DE', borderRadius: 8,
              padding: '11px 14px', textDecoration: 'none', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C13B2A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E2DE'; }}
            >
              <Icon size={15} stroke={1.5} style={{ color: '#7A7875', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#4A4A48' }}>{label}</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
