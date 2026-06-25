import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useUnassignedTickets } from '../../hooks/useTicket';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';
import { SEVERITY_COLOR } from '../../utils/constants';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function AssignmentDropdown({ ticket, onAssigned }) {
  const [officers, setOfficers]   = useState([]);
  const [selected, setSelected]   = useState('');
  const [note, setNote]           = useState('');
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);

  const fetchOfficers = async () => {
    if (open) { setOpen(false); return; }
    setFetching(true);
    try {
      const res = await api.get('/staff/officers/assignable', {
        params: { departmentId: ticket.departmentId }
      });
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={fetchOfficers}
        disabled={fetching}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
      >
        {fetching ? 'Loading...' : '👮 Assign Officer'}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-80">
          <p className="text-sm font-bold text-gray-800 mb-3">Assign: {ticket.publicId}</p>
          {officers.length === 0 ? (
            <p className="text-sm text-gray-500">No active officers available for {ticket.departmentId}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {officers.map(o => (
                <label
                  key={o.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border-2 transition ${
                    selected === o.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input type="radio" value={o.id} checked={selected === o.id} onChange={() => setSelected(o.id)} className="sr-only" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{o.name}</p>
                    <p className="text-xs text-gray-500">{o.designation} · {o.activeCaseCount} active</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${o.accountabilityScore >= 90 ? 'bg-green-50 text-green-700' : o.accountabilityScore >= 70 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    {o.accountabilityScore}%
                  </span>
                </label>
              ))}
            </div>
          )}
          <input
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Internal note (optional)..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs mb-3 focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button onClick={handleAssign} disabled={loading || !selected}
              className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition">
              {loading ? 'Assigning...' : 'Confirm'}
            </button>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📥 Unassigned Queue</h1>
            <p className="text-sm text-gray-500 mt-1">{visible.length} tickets awaiting assignment · sorted by severity</p>
          </div>
        </div>

        {loading ? <LoadingSpinner text="Loading unassigned tickets..." /> : visible.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-gray-600 font-medium">All tickets assigned!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(ticket => (
              <div key={ticket.id} className={`bg-white rounded-2xl border-2 p-5 ${ticket.severity >= 9 ? 'border-red-300' : 'border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-1.5 h-16 rounded-full shrink-0 ${SEVERITY_COLOR(ticket.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-gray-400">{ticket.publicId}</span>
                      <StatusBadge status={ticket.status} />
                      {ticket.severity >= 9 && (
                        <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">🚨 CRITICAL</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-lg">{issueTypeLabel(ticket.issueType)}</p>
                    <p className="text-gray-600 text-sm">{ticket.description}</p>
                    <p className="text-gray-400 text-xs mt-1">📍 {ticket.location?.address} · Ward: {ticket.location?.ward}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>⚡ Severity {ticket.severity}/10</span>
                      <span>👍 {ticket.upvoteCount || 0} upvotes</span>
                      <span>🕐 {timeAgo(ticket.createdAt)}</span>
                      <span>🏢 {ticket.departmentId?.replace(/_/g,' ')}</span>
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
