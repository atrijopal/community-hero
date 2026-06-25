import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import CommunityMap from '../../components/shared/CommunityMap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function MapPage() {
  const [tickets, setTickets]     = useState([]);
  const [predictions, setPredictions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'tickets'), limit(200));
    const unsub = onSnapshot(q, snap => setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'predictions'), where('active', '==', true), limit(20));
    const unsub = onSnapshot(q, snap => setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">🗺️ Community Map</h1>
          <div className="flex gap-3 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1 align-middle"></span>Critical</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-1 align-middle"></span>High</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1 align-middle"></span>Medium</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1 align-middle"></span>Resolved</span>
            <span><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1 align-middle"></span>AI Predicted</span>
          </div>
        </div>
        <div className="flex-1" style={{ minHeight: 500 }}>
          <CommunityMap
            tickets={tickets}
            predictions={predictions}
            height="calc(100vh - 200px)"
            onTicketClick={t => navigate(`/track/${t.publicId}`)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Total Issues', value: tickets.length, color: 'text-blue-600' },
            { label: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED').length, color: 'text-green-600' },
            { label: 'AI Predictions', value: predictions.length, color: 'text-indigo-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
