import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAllTickets } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo, formatDate } from '../../utils/formatters';
import {
  IconX, IconMapPin, IconUser, IconBrain, IconClock, IconArrowUpRight,
  IconAlertTriangle, IconPhoto, IconCalendar, IconThumbUp,
} from '@tabler/icons-react';

const STATUSES = ['', 'UNASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'RTI_FILED', 'GHOST_FLAGGED', 'CLOSED_OVERRIDE'];

const SEV_COLOR = s => s >= 9 ? '#C13B2A' : s >= 7 ? '#D4730A' : s >= 4 ? '#D4730A' : '#1A7A4A';
const SEV_LABEL = s => s >= 9 ? 'CRITICAL' : s >= 7 ? 'HIGH' : s >= 4 ? 'MEDIUM' : 'LOW';

const inputStyle = { border: '1px solid #E5E2DE', borderRadius: 6, padding: '8px 12px', fontSize: 13, outline: 'none', background: 'white' };

// ─── Detail drawer ────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', color: '#B8B5B0', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
      {Icon && <Icon size={13} stroke={1.5} style={{ color: '#B8B5B0', flexShrink: 0, marginTop: 1 }} />}
      <span style={{ fontSize: 13, color: '#4A4A48', lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function TicketDrawer({ ticket, onClose }) {
  if (!ticket) return null;
  const sevColor = SEV_COLOR(ticket.severity);
  const sevLabel = SEV_LABEL(ticket.severity);
  const photos   = ticket.photoUrls || (ticket.photoUrl ? [ticket.photoUrl] : []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(42,42,40,0.25)',
          zIndex: 150,
          backdropFilter: 'blur(1px)',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 420, maxWidth: '95vw',
        background: '#FFFFFF',
        borderLeft: '1px solid #E5E2DE',
        zIndex: 200,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        animation: 'slideInRight 0.2s ease',
      }}>

        {/* ── Drawer header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E5E2DE',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#C13B2A', letterSpacing: '0.06em' }}>
              {ticket.publicId}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer', padding: 4,
            borderRadius: 4, color: '#7A7875', display: 'flex',
          }}>
            <IconX size={18} stroke={1.5} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Issue title + severity */}
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#2A2A28', margin: '0 0 8px', lineHeight: 1.3 }}>
              {issueTypeLabel(ticket.issueType)}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 220 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#F0EDE9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(ticket.severity / 10) * 100}%`, background: sevColor, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: sevColor, whiteSpace: 'nowrap' }}>
                  {ticket.severity}/10 {sevLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Photo */}
          {photos.length > 0 && (
            <Section label="Photo">
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E2DE', marginBottom: 4 }}>
                <img
                  src={photos[0]}
                  alt="Issue"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            </Section>
          )}
          {photos.length === 0 && (
            <div style={{
              borderRadius: 8, border: '1px dashed #E5E2DE',
              padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, marginBottom: 20, background: '#FAFAF9',
            }}>
              <IconPhoto size={22} stroke={1} style={{ color: '#D4CFC8' }} />
              <span style={{ fontSize: 11, color: '#B8B5B0' }}>No photo attached</span>
            </div>
          )}

          {/* Location */}
          <Section label="Location">
            <InfoRow icon={IconMapPin}>
              {ticket.location?.address || [ticket.location?.ward, ticket.location?.city].filter(Boolean).join(', ') || '—'}
            </InfoRow>
          </Section>

          {/* Officer */}
          <Section label="Assigned Officer">
            <InfoRow icon={IconUser}>
              {ticket.assignedOfficerName
                ? <><span style={{ fontWeight: 600, color: '#2A2A28' }}>{ticket.assignedOfficerName}</span></>
                : <span style={{ color: '#B8B5B0' }}>Unassigned</span>
              }
            </InfoRow>
          </Section>

          {/* Timeline */}
          <Section label="Dates">
            <InfoRow icon={IconCalendar}>
              <span style={{ color: '#7A7875' }}>Reported: </span>
              {formatDate(ticket.createdAt)}
            </InfoRow>
            {ticket.slaDeadline && (
              <InfoRow icon={IconClock}>
                <span style={{ color: '#7A7875' }}>SLA deadline: </span>
                <span style={{ color: ticket.slaBreached ? '#C13B2A' : '#4A4A48', fontWeight: ticket.slaBreached ? 600 : 400 }}>
                  {formatDate(ticket.slaDeadline)}
                  {ticket.slaBreached && ' — BREACHED'}
                </span>
              </InfoRow>
            )}
            <InfoRow icon={IconThumbUp}>
              <span style={{ color: '#7A7875' }}>Upvotes: </span>
              {ticket.upvoteCount || 0}
            </InfoRow>
          </Section>

          {/* AI classification */}
          {ticket.aiSuggested && (
            <Section label="AI Classification">
              <div style={{
                background: '#F8F6FF', border: '1px solid #DDD8F5',
                borderRadius: 7, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <IconBrain size={14} stroke={1.5} style={{ color: '#6B50B8' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B50B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Gemini · {ticket.aiSuggested.confidence}% confidence
                  </span>
                </div>
                {ticket.aiSuggested.issueType && (
                  <InfoRow icon={null}>
                    <span style={{ color: '#7A7875' }}>Issue: </span>
                    <span style={{ fontWeight: 600, color: '#4A4A48' }}>{issueTypeLabel(ticket.aiSuggested.issueType)}</span>
                  </InfoRow>
                )}
                {ticket.aiSuggested.category && (
                  <InfoRow icon={null}>
                    <span style={{ color: '#7A7875' }}>Category: </span>
                    <span style={{ fontWeight: 600, color: '#4A4A48' }}>{ticket.aiSuggested.category?.replace(/_/g, ' ')}</span>
                  </InfoRow>
                )}
                {ticket.aiSuggested.severity && (
                  <InfoRow icon={null}>
                    <span style={{ color: '#7A7875' }}>AI severity: </span>
                    <span style={{ fontWeight: 600, color: sevColor }}>{ticket.aiSuggested.severity}/10</span>
                  </InfoRow>
                )}
              </div>
            </Section>
          )}

          {/* Duplicate notice */}
          {ticket.probableDuplicateOf && (
            <Section label="Duplicate">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 6, background: '#FEF3E7', border: '1px solid #F0D4A0' }}>
                <IconAlertTriangle size={13} stroke={1.5} style={{ color: '#D4730A', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#D4730A' }}>
                  Likely duplicate of{' '}
                  <Link to={`/track/${ticket.probableDuplicateOf}`}
                    style={{ fontWeight: 700, color: '#D4730A', textDecoration: 'underline' }}>
                    {ticket.probableDuplicateOf}
                  </Link>
                </span>
              </div>
            </Section>
          )}
        </div>

        {/* ── Footer action ── */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E2DE', flexShrink: 0, background: '#FAFAF9' }}>
          <Link
            to={`/track/${ticket.publicId}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 7, background: '#C13B2A',
              color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <IconArrowUpRight size={15} stroke={2} />
            Open full ticket page
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function AllTickets() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const { tickets, loading } = useAllTickets({ status: statusFilter || undefined });

  const filtered = tickets.filter(t =>
    !search || t.publicId?.includes(search.toUpperCase()) || t.issueType?.includes(search)
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-6" style={{ color: '#4A4A48' }}>All Tickets</h1>

        <div className="flex gap-3 mb-5 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ticket ID…"
            style={{ ...inputStyle, width: 256 }}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <span className="text-sm self-center" style={{ color: '#7A7875' }}>{filtered.length} tickets</span>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white border overflow-hidden" style={{ borderColor: '#E5E2DE', borderRadius: 8 }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: '#FAFAF9', borderColor: '#E5E2DE' }}>
                <tr>
                  {['Ticket ID', 'Issue', 'Location', 'Status', 'Severity', 'Officer', 'Reported'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A7875' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const isSelected = selected?.id === t.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelected(isSelected ? null : t)}
                      className="border-b transition-colors cursor-pointer"
                      style={{
                        borderColor: '#E5E2DE',
                        backgroundColor: isSelected ? '#FDF1EF' : undefined,
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#FAFAF9'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = ''; }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs font-bold"
                          style={{ color: isSelected ? '#C13B2A' : '#C13B2A' }}
                          onClick={e => e.stopPropagation()}
                        >
                          {/* clicking ID still opens drawer; link opens public page */}
                          <Link
                            to={`/track/${t.publicId}`}
                            onClick={e => e.stopPropagation()}
                            className="hover:underline"
                            style={{ color: '#C13B2A' }}
                          >
                            {t.publicId}
                          </Link>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: '#2A2A28' }}>{issueTypeLabel(t.issueType)}</td>
                      <td className="px-4 py-3 text-xs max-w-48 truncate" style={{ color: '#7A7875' }}>
                        {t.location?.ward || t.location?.address || '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: SEV_COLOR(t.severity) }} />
                          <span style={{ color: '#4A4A48', fontSize: 13 }}>{t.severity}/10</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#7A7875' }}>{t.assignedOfficerName || '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#B8B5B0' }}>{timeAgo(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: '#7A7875' }}>No tickets found</div>
            )}
          </div>
        )}
      </div>

      {/* Slide-out detail drawer */}
      <TicketDrawer ticket={selected} onClose={() => setSelected(null)} />

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
