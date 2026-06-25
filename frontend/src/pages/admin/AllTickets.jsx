import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAllTickets } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import { SEVERITY_COLOR } from '../../utils/constants';

const STATUSES = ['','UNASSIGNED','ASSIGNED','IN_PROGRESS','RESOLVED','ESCALATED','RTI_FILED','GHOST_FLAGGED','CLOSED_OVERRIDE'];

export default function AllTickets() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const { tickets, loading } = useAllTickets({ status: statusFilter || undefined });

  const filtered = tickets.filter(t =>
    !search || t.publicId?.includes(search.toUpperCase()) || t.issueType?.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 All Tickets</h1>

        <div className="flex gap-3 mb-5 flex-wrap">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by ticket ID..."
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <span className="text-sm text-gray-500 self-center">{filtered.length} tickets</span>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Ticket ID','Issue','Location','Status','Severity','Officer','Reported'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/track/${t.publicId}`} className="font-mono text-blue-600 hover:underline text-xs">
                        {t.publicId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{issueTypeLabel(t.issueType)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate">{t.location?.ward}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-5 rounded-full ${SEVERITY_COLOR(t.severity)}`} />
                        <span>{t.severity}/10</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.assignedOfficerName || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">No tickets found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
