import { useState } from 'react';
import { IconUser } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useUnassignedTickets } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function AssignmentDropdown({ ticket, onAssigned }) {
  const [officers, setOfficers] = useState([]);
  const [selected, setSelected] = useState('');
  const [note, setNote]         = useState('');
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchOfficers = async () => {
    if (open) { setOpen(false); return; }
    setFetching(true);
    try {
      const res = await api.get('/staff/officers/assignable', { params: { departmentId: ticket.departmentId } });
      setOfficers(res.data.officers || []);
    } catch { toast.error('Could not load officers'); }
    finally { setFetching(false); setOpen(true); }
  };

  const handleAssign = async () => {
    if (!selected) return toast.error('Select an officer first');
    setLoading(true);
    try {
      await api.patch(`/tickets/${ticket.id}/assign`, { officerId: selected, internalNote: note });
      toast.success('Officer assigned!');
      setOpen(false);
      onAssigned();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assignment failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative">
      <button
        onClick={fetchOfficers}
        disabled={fetching}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        <IconUser size={14} stroke={1.5} />
        {fetching ? 'Loading…' : 'Assign Officer'}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 bg-white border p-4 w-80"
          style={{ borderColor: '#E5E2DE', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#4A4A48' }}>Assign: {ticket.publicId}</p>
          {officers.length === 0 ? (
            <p className="text-sm" style={{ color: '#7A7875' }}>No active officers available for {ticket.departmentId}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {officers.map(o => (
                <label
                  key={o.id}
                  className="flex items-center gap-3 p-2.5 cursor-pointer border-2 transition-colors"
                  style={{
                    borderColor: selected === o.id ? '#C13B2A' : '#E5E2DE',
                    backgroundColor: selected === o.id ? '#FDF1EF' : 'white',
                    borderRadius: '6px',
                  }}
                >
                  <input type="radio" value={o.id} checked={selected === o.id} onChange={() => setSelected(o.id)} className="sr-only" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#4A4A48' }}>{o.name}</p>
                    <p className="text-xs" style={{ color: '#7A7875' }}>{o.designation} · {o.activeCaseCount} active</p>
                  </div>
                  <span className="text-xs px-2 py-0.5" style={{
                    borderRadius: '4px',
                    backgroundColor: o.accountabilityScore >= 90 ? '#E8F5EE' : o.accountabilityScore >= 70 ? '#FFF8E0' : '#FDF1EF',
                    color: o.accountabilityScore >= 90 ? '#1A7A4A' : o.accountabilityScore >= 70 ? '#8B6600' : '#C13B2A',
                  }}>
                    {o.accountabilityScore}%
                  </span>
                </label>
              ))}
            </div>
          )}
          <input
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Internal note (optional)…"
            className="w-full px-3 py-2 text-xs mb-3"
            style={{ border: '1px solid #E5E2DE', borderRadius: '6px', outline: 'none' }}
          />
          <div className="flex gap-2">
            <button onClick={handleAssign} disabled={loading || !selected}
              className="flex-1 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
              {loading ? 'Assigning…' : 'Confirm'}
            </button>
            <button onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm border transition-colors"
              style={{ borderColor: '#E5E2DE', color: '#7A7875', borderRadius: '6px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnassignedQueue() {
  const { tickets, loading } = useUnassignedTickets();
  const [assigned, setAssigned] = useState(new Set());
  const visible = tickets.filter(t => !assigned.has(t.id));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Unassigned Queue</h1>
            <p className="text-sm mt-1" style={{ color: '#7A7875' }}>{visible.length} tickets awaiting assignment · sorted by severity</p>
          </div>
        </div>

        {loading ? <LoadingSpinner text="Loading unassigned tickets…" /> : visible.length === 0 ? (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <p className="font-medium" style={{ color: '#1A7A4A' }}>All tickets assigned!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(ticket => (
              <div key={ticket.id} className="bg-white border-2 p-5"
                style={{
                  borderColor: ticket.severity >= 9 ? '#E5C5BF' : '#E5E2DE',
                  borderRadius: '8px',
                }}>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-16 rounded-full shrink-0"
                    style={{ backgroundColor: ticket.severity >= 9 ? '#C13B2A' : ticket.severity >= 7 ? '#D4730A' : ticket.severity >= 4 ? '#D4730A' : '#1A7A4A' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs" style={{ color: '#B8B5B0' }}>{ticket.publicId}</span>
                      <StatusBadge status={ticket.status} />
                      {ticket.severity >= 9 && (
                        <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: '#FDF1EF', color: '#C13B2A', borderRadius: '4px' }}>CRITICAL</span>
                      )}
                    </div>
                    <p className="font-bold text-lg" style={{ color: '#4A4A48' }}>{issueTypeLabel(ticket.issueType)}</p>
                    <p className="text-sm" style={{ color: '#7A7875' }}>{ticket.description}</p>
                    <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>{ticket.location?.address} · Ward: {ticket.location?.ward}</p>
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: '#7A7875' }}>
                      <span>Severity {ticket.severity}/10</span>
                      <span>{ticket.upvoteCount || 0} upvotes</span>
                      <span>{timeAgo(ticket.createdAt)}</span>
                      <span>{ticket.departmentId?.replace(/_/g,' ')}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <AssignmentDropdown
                      ticket={ticket}
                      onAssigned={() => setAssigned(s => new Set([...s, ticket.id]))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
