import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconSparkles } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useOfficerQueue } from '../../hooks/useTicket';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';

export default function QueriesInbox() {
  const { user } = useAuth();
  const { tickets } = useOfficerQueue(user?.uid);
  const [queries, setQueries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tickets.length) { setLoading(false); return; }
    const ticketIds = tickets.map(t => t.id).slice(0, 10);
    if (!ticketIds.length) { setLoading(false); return; }
    const unsub = onSnapshot(
      query(collection(db, 'ticket_logs'), where('ticketId', 'in', ticketIds)),
      snap => {
        const byTicket = {};
        snap.docs
          .filter(d => d.data().action === 'QUERY_SUBMITTED')
          .forEach(d => {
            const log = { id: d.id, ...d.data() };
            if (!byTicket[log.ticketId]) byTicket[log.ticketId] = [];
            byTicket[log.ticketId].push(log);
          });
        setQueries(byTicket);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [tickets.length]);

  const allQueries = Object.values(queries).flat().sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
    const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
    return tb - ta;
  });

  const ticketMap = tickets.reduce((m, t) => { m[t.id] = t; return m; }, {});

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#4A4A48' }}>Citizen Queries</h1>
        <p className="text-sm mb-6" style={{ color: '#7A7875' }}>Questions citizens asked the AI about your assigned tickets</p>

        {loading ? <LoadingSpinner text="Loading queries…" /> : allQueries.length === 0 ? (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <IconSparkles size={32} stroke={1.5} style={{ color: '#B8B5B0', margin: '0 auto 12px' }} />
            <p style={{ color: '#4A4A48' }}>No citizen queries yet</p>
            <p className="text-sm mt-1" style={{ color: '#7A7875' }}>Citizens can use the AI QueryBot on any ticket page to ask questions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allQueries.map(q => {
              const ticket = ticketMap[q.ticketId];
              return (
                <div key={q.id} className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <Link to={`/track/${ticket?.publicId}`}
                      className="font-mono text-xs transition-opacity hover:opacity-70"
                      style={{ color: '#C13B2A' }}>
                      {ticket?.publicId} · {issueTypeLabel(ticket?.issueType)}
                    </Link>
                    <span className="text-xs" style={{ color: '#B8B5B0' }}>{timeAgo(q.createdAt)}</span>
                  </div>
                  <div className="p-3 mb-3" style={{ backgroundColor: '#F5F3F0', borderRadius: '6px' }}>
                    <p className="text-xs font-medium mb-1" style={{ color: '#7A7875' }}>Citizen asked:</p>
                    <p className="text-sm" style={{ color: '#4A4A48' }}>{q.metadata?.question || q.question || '—'}</p>
                  </div>
                  {q.metadata?.answer && (
                    <div className="p-3" style={{ backgroundColor: '#EDE9F8', borderRadius: '6px' }}>
                      <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#6B50B8' }}>
                        <IconSparkles size={11} stroke={1.5} /> ◆ AI responded:
                      </p>
                      <p className="text-sm" style={{ color: '#4A3870' }}>{q.metadata.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
