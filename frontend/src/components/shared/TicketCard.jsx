import { Link } from 'react-router-dom';
import { IconMapPin, IconThumbUp, IconUser, IconAlertTriangle } from '@tabler/icons-react';
import StatusBadge from './StatusBadge';
import { timeAgo } from '../../utils/formatters';

// SLA progress bar: green → amber → red based on % elapsed
function SLABar({ slaDeadline, slaBreached }) {
  if (!slaDeadline) return null;
  const now = Date.now();
  const end = new Date(slaDeadline).getTime();
  const start = end - 7 * 24 * 60 * 60 * 1000; // assume 7d SLA window
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const color = slaBreached ? '#C13B2A' : pct >= 80 ? '#D4730A' : '#1A7A4A';
  return (
    <div className="h-1 rounded-full mt-2" style={{ backgroundColor: '#E5E2DE' }}>
      <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// Severity color: red ≥9, amber ≥7/≥4, green <4
function severityColor(s) {
  if (s >= 9) return '#C13B2A';
  if (s >= 4) return '#D4730A';
  return '#1A7A4A';
}

export default function TicketCard({ ticket, linkBase = '/citizen/tickets', showOfficer = false }) {
  if (!ticket) return null;
  const t = ticket;
  const sevColor = severityColor(t.severity || 5);

  return (
    <Link
      to={`${linkBase}/${t.publicId}`}
      className="block bg-white border transition-colors"
      style={{
        borderColor: '#E5E2DE',
        borderRadius: '8px',
        borderWidth: '1px',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#B8B5B0'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E2DE'}
    >
      {/* Top: ID + Status */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: '1px solid #E5E2DE' }}>
        <span className="font-mono text-xs tracking-wider" style={{ color: '#B8B5B0' }}>{t.publicId}</span>
        <StatusBadge status={t.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold mb-1 truncate" style={{ color: '#4A4A48' }}>
          {t.issueType?.replace(/_/g, ' ')} — {t.category?.replace(/_/g, ' ')}
        </p>
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#7A7875' }}>
          <IconMapPin size={12} stroke={1.5} />
          <span className="truncate">{t.location?.address || `${t.location?.ward || ''}, ${t.location?.city || 'Kolkata'}`}</span>
        </div>

        {/* Severity bar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#E5E2DE' }}>
            <div className="h-1 rounded-full" style={{ width: `${(t.severity / 10) * 100}%`, backgroundColor: sevColor }} />
          </div>
          <span className="text-xs font-semibold" style={{ color: sevColor }}>
            {t.severity}/10
          </span>
          {t.severity >= 9 && <IconAlertTriangle size={12} className="text-danger animate-pulse" style={{ color: '#C13B2A' }} />}
        </div>

        {/* SLA bar */}
        <SLABar slaDeadline={t.slaDeadline} slaBreached={t.slaBreached} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-3 text-xs" style={{ color: '#B8B5B0' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <IconThumbUp size={12} stroke={1.5} />
            {t.upvoteCount || 0}
          </span>
          {showOfficer && t.assignedOfficerName && (
            <span className="flex items-center gap-1">
              <IconUser size={12} stroke={1.5} />
              {t.assignedOfficerName}
            </span>
          )}
          {t.ghostCount > 0 && (
            <span className="font-medium" style={{ color: '#8B1A1A' }}>Ghost ×{t.ghostCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {t.aiSuggested?.confidence && (
            <span className="font-medium" style={{ color: '#6B50B8' }}>◆ {t.aiSuggested.confidence}%</span>
          )}
          <span>{timeAgo(t.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
