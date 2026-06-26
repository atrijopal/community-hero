import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import CommunityMap from '../../components/shared/CommunityMap';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';

const FILTERS = [
  { label: 'All',        value: 'all' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'Critical',   value: 'critical' },
  { label: 'Ghost',      value: 'ghost' },
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
    if (filter === 'unassigned') return t.status === 'UNASSIGNED';
    if (filter === 'critical')   return t.severity >= 9;
    if (filter === 'ghost')      return t.status === 'GHOST_FLAGGED';
    return true;
  });

  const NAVBAR_H = 56; // px — matches h-14

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1A1A18' }}>
      <Navbar />

      {/* Full-remaining-height map area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <CommunityMap
          tickets={filtered}
          predictions={predictions}
          height="100%"
          onTicketClick={t => navigate(`/track/${t.publicId}`)}
        />

        {/* Floating filter pill bar — top-left */}
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 20,
          display: 'flex', gap: 6, flexWrap: 'wrap',
        }}>
          {FILTERS.map(f => {
            const count = f.value === 'all'        ? tickets.length
                        : f.value === 'unassigned' ? tickets.filter(t => t.status === 'UNASSIGNED').length
                        : f.value === 'critical'   ? tickets.filter(t => t.severity >= 9).length
                        : tickets.filter(t => t.status === 'GHOST_FLAGGED').length;
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${active ? '#C13B2A' : 'rgba(255,255,255,0.3)'}`,
                  background: active ? '#C13B2A' : 'rgba(255,255,255,0.92)',
                  color: active ? 'white' : '#4A4A48',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                  background: active ? 'rgba(255,255,255,0.25)' : '#F0EDE9',
                  color: active ? 'white' : '#7A7875',
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Floating stats pill — bottom-left */}
        <div style={{
          position: 'absolute', bottom: 44, left: 14, zIndex: 20,
          background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(4px)',
          border: '1px solid #E5E2DE', borderRadius: 10,
          padding: '8px 16px', display: 'flex', gap: 20, fontSize: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        }}>
          <Stat label="Showing" value={filtered.length} color="#4A4A48" />
          <Stat label="Critical" value={tickets.filter(t => t.severity >= 9).length} color="#C13B2A" />
          <Stat label="Resolved" value={tickets.filter(t => t.status === 'RESOLVED').length} color="#1A7A4A" />
          <Stat label="AI Predictions" value={predictions.length} color="#6B50B8" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 800, fontSize: 15, color }}>{value}</div>
      <div style={{ color: '#7A7875', fontSize: 10, marginTop: 1 }}>{label}</div>
    </div>
  );
}
