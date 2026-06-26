import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import CommunityMap from '../../components/shared/CommunityMap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const FILTERS = [
  { label: 'All',         value: 'all' },
  { label: 'Unassigned',  value: 'unassigned' },
  { label: 'Critical',    value: 'critical' },
  { label: 'Ghost',       value: 'ghost' },
];

export default function WardMap() {
  const [tickets, setTickets]         = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [filter, setFilter]           = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'tickets'), limit(500));
    return onSnapshot(q, snap => setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'predictions'), where('active', '==', true), limit(20));
    return onSnapshot(q, snap => setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const filtered = tickets.filter(t => {
    if (filter === 'all')        return true;
    if (filter === 'unassigned') return t.status === 'UNASSIGNED';
    if (filter === 'critical')   return t.severity >= 9;
    if (filter === 'ghost')      return t.status === 'GHOST_FLAGGED';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-4 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Ward Map</h1>
          <div className="flex gap-2">
            {FILTERS.map(f => {
              const count = f.value === 'all'        ? tickets.length
                          : f.value === 'unassigned' ? tickets.filter(t => t.status === 'UNASSIGNED').length
                          : f.value === 'critical'   ? tickets.filter(t => t.severity >= 9).length
                          : f.value === 'ghost'      ? tickets.filter(t => t.status === 'GHOST_FLAGGED').length
                          : 0;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="px-3 py-1.5 text-sm font-medium border transition-colors flex items-center gap-1.5"
                  style={{
                    backgroundColor: filter === f.value ? '#C13B2A' : 'white',
                    color: filter === f.value ? 'white' : '#7A7875',
                    borderColor: filter === f.value ? '#C13B2A' : '#E5E2DE',
                    borderRadius: '6px',
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: '10px',
                    backgroundColor: filter === f.value ? 'rgba(255,255,255,0.25)' : '#F5F3F0',
                    color: filter === f.value ? 'white' : '#7A7875',
                  }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <CommunityMap
          tickets={filtered}
          predictions={predictions}
          height="calc(100vh - 200px)"
          onTicketClick={t => navigate(`/track/${t.publicId}`)}
        />
        <div className="text-xs text-center" style={{ color: '#B8B5B0' }}>
          Showing {filtered.length} tickets · {predictions.length} AI predictions
        </div>
      </div>
    </div>
  );
}
