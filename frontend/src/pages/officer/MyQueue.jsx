import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import SLACountdown from '../../components/shared/SLACountdown';
import { useAuth } from '../../hooks/useAuth';
import { useOfficerQueue } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import { SEVERITY_COLOR } from '../../utils/constants';

const FILTERS = ['All', 'Critical', 'SLA Overdue', 'In Progress', 'Assigned', 'Resolved'];

function filterTickets(tickets, filter) {
  switch (filter) {
    case 'Critical':    return tickets.filter(t => t.severity >= 9);
    case 'SLA Overdue': return tickets.filter(t => t.slaBreached);
    case 'In Progress': return tickets.filter(t => t.status === 'IN_PROGRESS');
    case 'Assigned':    return tickets.filter(t => t.status === 'ASSIGNED');
    case 'Resolved':    return tickets.filter(t => t.status === 'RESOLVED');
    default:            return tickets;
  }
}

export default function MyQueue() {
  const { user } = useAuth();
  const { tickets, loading } = useOfficerQueue(user?.uid);
  const [filter, setFilter] = useState('All');

  const filtered = filterTickets(tickets, filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">📥 My Queue</h1>
          <span className="text-sm text-gray-500">{filtered.length} tickets</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map(f => {
            const count = filterTickets(tickets, f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-200'}`}>
                {f} {count > 0 && <span className={`ml-1 ${filter === f ? 'text-blue-100' : 'text-gray-400'}`}>({count})</span>}
              </button>
            );
          })}
        </div>

        {loading ? <LoadingSpinner text="Loading your queue..." /> : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No tickets in this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => (
              <Link key={ticket.id} to={`/track/${ticket.publicId}`} className="block">
                <div className={`bg-white rounded-2xl border-2 p-5 hover:shadow-md transition ${
                  ticket.severity >= 9 ? 'border-red-200' : ticket.slaBreached ? 'border-orange-200' : 'border-gray-200'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-1.5 h-16 rounded-full shrink-0 mt-1 ${SEVERITY_COLOR(ticket.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">{ticket.publicId}</span>
                        <StatusBadge status={ticket.status} />
                        {ticket.slaBreached && (
                          <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">⏰ SLA BREACHED</span>
                        )}
                        {ticket.severity >= 9 && (
                          <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">🚨 CRITICAL</span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900">{issueTypeLabel(ticket.issueType)}</p>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{ticket.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span>📍 {ticket.location?.ward}</span>
                        <span>⚡ Severity {ticket.severity}/10</span>
                        <span>👍 {ticket.upvoteCount || 0}</span>
                        <span>🕐 {timeAgo(ticket.createdAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {ticket.slaDeadline && (
                        <SLACountdown slaDeadline={ticket.slaDeadline} slaBreached={ticket.slaBreached} />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
