import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import TicketCard from '../../components/shared/TicketCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useMyTickets } from '../../hooks/useTicket';

const FILTERS = [
  { label: 'All',        value: '' },
  { label: 'Active',     value: 'active' },
  { label: 'Resolved',   value: 'resolved' },
  { label: 'Escalated',  value: 'ESCALATED' },
  { label: 'RTI Filed',  value: 'RTI_FILED' },
];

export default function MyTickets() {
  const { user }             = useAuth();
  const { tickets, loading } = useMyTickets(user?.uid);
  const [filter, setFilter]  = useState('');
  const navigate             = useNavigate();

  const filtered = tickets.filter(t => {
    if (!filter)            return true;
    if (filter === 'active')   return !['RESOLVED','CLOSED_OVERRIDE','REJECTED'].includes(t.status);
    if (filter === 'resolved') return ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status);
    return t.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <button
            onClick={() => navigate('/citizen/report')}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            + Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-200'
              }`}
            >
              {f.label} {f.value === '' && `(${tickets.length})`}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner text="Loading your tickets..." /> : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-gray-600 font-medium">No tickets found</p>
            <button onClick={() => navigate('/citizen/report')} className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition">
              Report Your First Issue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => <TicketCard key={t.id} ticket={t} showOfficer />)}
          </div>
        )}
      </div>
    </div>
  );
}
