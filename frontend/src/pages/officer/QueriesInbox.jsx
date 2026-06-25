import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useOfficerQueue } from '../../hooks/useTicket';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { issueTypeLabel, timeAgo } from '../../utils/formatters';

export default function QueriesInbox() {
  const { user } = useAuth();
  const { tickets } = useOfficerQueue(user?.uid);
  const [queries, setQueries] = useState({});
  const [loading, setLoading] = useState(true);

  // Load ticket_logs for bot queries across officer's tickets
  // ticket_logs is a root collection with ticketId field
  useEffect(() => {
    if (!tickets.length) { setLoading(false); return; }
    const ticketIds = tickets.map(t => t.id).slice(0, 10); // Firestore 'in' limit is 30, cap at 10 for safety
    if (!ticketIds.length) { setLoading(false); return; }
    const unsub = onSnapshot(
      query(
        collection(db, 'ticket_logs'),
        where('ticketId', 'in', ticketIds),
        orderBy('timestamp', 'desc')
      ),
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">💬 Citizen Queries</h1>
        <p className="text-gray-500 text-sm mb-6">Questions citizens asked the AI about your assigned tickets</p>

        {loading ? <LoadingSpinner text="Loading queries..." /> : allQueries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-gray-600">No citizen queries yet</p>
            <p className="text-gray-400 text-sm mt-1">Citizens can use the AI QueryBot on any ticket page to ask questions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allQueries.map(q => {
              const ticket = ticketMap[q.ticketId];
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Link to={`/track/${ticket?.publicId}`} className="font-mono text-xs text-blue-600 hover:underline">
                      {ticket?.publicId} · {issueTypeLabel(ticket?.issueType)}
                    </Link>
                    <span className="text-xs text-gray-400">{timeAgo(q.createdAt)}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Citizen asked:</p>
                    <p className="text-sm text-gray-800">{q.metadata?.question || q.question || '—'}</p>
                  </div>
                  {q.metadata?.answer && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-blue-600 mb-1">🤖 AI responded:</p>
                      <p className="text-sm text-gray-800">{q.metadata.answer}</p>
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
