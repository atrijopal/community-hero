import { useEffect, useState } from 'react';
import Navbar from '../../components/shared/Navbar';
import CommunityMap from '../../components/shared/CommunityMap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslateMap } from '../../hooks/useTranslate';

const STRINGS = {
  title:          'Community Map',
  critical:       'Critical',
  high:           'High',
  resolved:       'Resolved',
  ai:             'AI',
  totalIssues:    'Total Issues',
  aiPredictions:  'AI Predictions',
};

export default function MapPage() {
  const [tickets, setTickets]         = useState([]);
  const [predictions, setPredictions] = useState([]);
  const navigate                       = useNavigate();
  const tr                             = useTranslateMap(STRINGS);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), limit(200));
    return onSnapshot(q, snap => setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'predictions'), where('active', '==', true), limit(20));
    return onSnapshot(q, snap => setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>{tr.title}</h1>
          <div className="flex gap-3 text-xs" style={{ color: '#7A7875' }}>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#C13B2A' }} />{tr.critical}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#D4730A' }} />{tr.high}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#1A7A4A' }} />{tr.resolved}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#6B50B8' }} />◆ {tr.ai}
            </span>
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
            { labelKey: 'totalIssues',   value: tickets.length,                                        color: '#4A4A48' },
            { labelKey: 'resolved',      value: tickets.filter(t => t.status === 'RESOLVED').length,   color: '#1A7A4A' },
            { labelKey: 'aiPredictions', value: predictions.length,                                    color: '#6B50B8' },
          ].map(s => (
            <div key={s.labelKey} className="bg-white border p-3" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{tr[s.labelKey]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
