import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import CommunityMap from '../../components/shared/CommunityMap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function WardMap() {
  const [tickets, setTickets]     = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [filter, setFilter]       = useState('all');
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-4 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">🗺️ Ward Map</h1>
          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: '⚠️ Unassigned', value: 'unassigned' },
              { label: '🔴 Critical', value: 'critical' },
              { label: '👻 Ghost', value: 'ghost' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <CommunityMap
          tickets={filtered}
          predictions={predictions}
          height="calc(100vh - 200px)"
          onTicketClick={t => navigate(`/track/${t.publicId}`)}
        />
        <div className="text-xs text-gray-500 text-center">
          Showing {filtered.length} tickets · {predictions.length} AI predictions
        </div>
      </div>
    </div>
  );
}
