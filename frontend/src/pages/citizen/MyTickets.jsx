import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import TicketCard from '../../components/shared/TicketCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useMyTickets } from '../../hooks/useTicket';
import { useTranslateMap } from '../../hooks/useTranslate';

const STRINGS = {
  title:        'My Tickets',
  report:       'Report',
  all:          'All',
  active:       'Active',
  resolved:     'Resolved',
  escalated:    'Escalated',
  rtiFiled:     'RTI Filed',
  noTickets:    'No tickets found',
  reportFirst:  'Report Your First Issue',
  loading:      'Loading your tickets…',
};

const btn = { backgroundColor: '#C13B2A', borderRadius: '6px', color: 'white' };

export default function MyTickets() {
  const { user }             = useAuth();
  const { tickets, loading } = useMyTickets(user?.uid);
  const [filter, setFilter]  = useState('');
  const navigate             = useNavigate();
  const tr                   = useTranslateMap(STRINGS);

  const FILTERS = [
    { label: tr.all,       value: '' },
    { label: tr.active,    value: 'active' },
    { label: tr.resolved,  value: 'resolved' },
    { label: tr.escalated, value: 'ESCALATED' },
    { label: tr.rtiFiled,  value: 'RTI_FILED' },
  ];

  const filtered = tickets.filter(t => {
    if (!filter)               return true;
    if (filter === 'active')   return !['RESOLVED','CLOSED_OVERRIDE','REJECTED'].includes(t.status);
    if (filter === 'resolved') return ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status);
    return t.status === filter;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>{tr.title}</h1>
          <button onClick={() => navigate('/citizen/report')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
            style={btn}>
            <IconPlus size={14} stroke={2} /> {tr.report}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {FILTERS.map(f => {
            const active = filter === f.value;
            return (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className="px-3 py-1.5 text-sm font-medium whitespace-nowrap border transition-colors"
                style={{
                  backgroundColor: active ? '#C13B2A' : 'white',
                  color: active ? 'white' : '#7A7875',
                  borderColor: active ? '#C13B2A' : '#E5E2DE',
                  borderRadius: '6px',
                }}>
                {f.label} {f.value === '' && `(${tickets.length})`}
              </button>
            );
          })}
        </div>

        {loading ? <LoadingSpinner text={tr.loading} /> : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <p className="text-4xl mb-3 font-serif" style={{ color: '#B8B5B0' }}>—</p>
            <p className="font-medium mb-4" style={{ color: '#4A4A48' }}>{tr.noTickets}</p>
            <button onClick={() => navigate('/citizen/report')}
              className="px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={btn}>
              {tr.reportFirst}
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
