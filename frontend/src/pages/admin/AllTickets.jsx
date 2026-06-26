import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAllTickets } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';

const STATUSES = ['','UNASSIGNED','ASSIGNED','IN_PROGRESS','RESOLVED','ESCALATED','RTI_FILED','GHOST_FLAGGED','CLOSED_OVERRIDE'];
const inputStyle = { border: '1px solid #E5E2DE', borderRadius: '6px', padding: '8px 12px', fontSize: 13, outline: 'none' };

export default function AllTickets() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
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
          <div className="bg-white border overflow-hidden" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: '#FAFAF9', borderColor: '#E5E2DE' }}>
                <tr>
                  {['Ticket ID','Issue','Location','Status','Severity','Officer','Reported'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A7875' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b transition-colors hover:bg-gray-50" style={{ borderColor: '#E5E2DE' }}>
                    <td className="px-4 py-3">
                      <Link to={`/track/${t.publicId}`} className="font-mono text-xs transition-opacity hover:opacity-70"
                        style={{ color: '#C13B2A' }}>
                        {t.publicId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#4A4A48' }}>{issueTypeLabel(t.issueType)}</td>
                    <td className="px-4 py-3 text-xs max-w-48 truncate" style={{ color: '#7A7875' }}>{t.location?.ward}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-5 rounded-full" style={{
                          backgroundColor: t.severity >= 9 ? '#C13B2A' : t.severity >= 7 ? '#D4730A' : t.severity >= 4 ? '#D4730A' : '#1A7A4A'
                        }} />
                        <span style={{ color: '#4A4A48' }}>{t.severity}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#7A7875' }}>{t.assignedOfficerName || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#B8B5B0' }}>{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: '#7A7875' }}>No tickets found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
