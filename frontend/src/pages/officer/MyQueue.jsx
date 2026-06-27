import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import SLACountdown from '../../components/shared/SLACountdown';
import { useAuth } from '../../hooks/useAuth';
import { useOfficerQueue } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';

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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>My Queue</h1>
          <span className="text-sm" style={{ color: '#7A7875' }}>{filtered.length} tickets</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map(f => {
            const count  = filterTickets(tickets, f).length;
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 text-sm font-medium border transition-colors"
                style={{
                  backgroundColor: active ? '#C13B2A' : 'white',
                  color: active ? 'white' : '#7A7875',
                  borderColor: active ? '#C13B2A' : '#E5E2DE',
                  borderRadius: '6px',
                }}>
                {f} {count > 0 && <span style={{ color: active ? 'rgba(255,255,255,0.7)' : '#B8B5B0' }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {loading ? <LoadingSpinner text="Loading your queue…" /> : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <p className="font-medium" style={{ color: '#7A7875' }}>No tickets in this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => (
              <Link key={ticket.id} to={`/officer/ticket/${ticket.publicId}`} className="block">
                <div className="bg-white border-2 p-5 transition-colors hover:border-gray-300"
                  style={{
                    borderColor: ticket.severity >= 9 ? '#E5C5BF' : ticket.slaBreached ? '#F5D9A8' : '#E5E2DE',
                    borderRadius: '8px',
                  }}>
                  <div className="flex items-start gap-4">
                    <div className="w-1.5 h-16 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: ticket.severity >= 9 ? '#C13B2A' : ticket.severity >= 7 ? '#D4730A' : ticket.severity >= 4 ? '#D4730A' : '#1A7A4A' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs" style={{ color: '#B8B5B0' }}>{ticket.publicId}</span>
                        <StatusBadge status={ticket.status} />
                        {ticket.slaBreached && (
                          <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: '#FFF3E0', color: '#D4730A', borderRadius: '4px' }}>SLA BREACHED</span>
                        )}
                        {ticket.severity >= 9 && (
                          <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: '#FDF1EF', color: '#C13B2A', borderRadius: '4px' }}>CRITICAL</span>
                        )}
                      </div>
                      <p className="font-bold" style={{ color: '#4A4A48' }}>{issueTypeLabel(ticket.issueType)}</p>
                      <p className="text-sm line-clamp-2 mt-0.5" style={{ color: '#7A7875' }}>{ticket.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#7A7875' }}>
                        <span>Ward: {ticket.location?.ward}</span>
                        <span>Severity {ticket.severity}/10</span>
                        <span>{ticket.upvoteCount || 0} upvotes</span>
                        <span>{timeAgo(ticket.createdAt)}</span>
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
