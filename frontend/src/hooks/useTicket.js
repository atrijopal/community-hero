import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

export const useTicket = (publicId) => {
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!publicId) { setLoading(false); return; }

    const q = query(collection(db, 'tickets'), where('publicId', '==', publicId), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const doc  = snap.docs[0];
        const data = doc.data();
        const { internalNotes, citizenPhone, citizenEmail, ...pub } = data;
        setTicket({ id: doc.id, ...pub });
      } else {
        setError('Ticket not found');
      }
      setLoading(false);
    }, (err) => { setError(err.message); setLoading(false); });

    return unsub;
  }, [publicId]);

  return { ticket, loading, error };
};

export const useMyTickets = (citizenId) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citizenId) { setLoading(false); return; }
    // No orderBy here — avoids composite index requirement; sort client-side
    const q = query(
      collection(db, 'tickets'),
      where('citizenId', '==', citizenId),
      limit(50)
    );
    const unsub = onSnapshot(q,
      (snap) => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setTickets(sorted);
        setLoading(false);
      },
      () => setLoading(false)   // on error: stop spinner, show empty state
    );
    return unsub;
  }, [citizenId]);

  return { tickets, loading };
};

export const useOfficerQueue = (officerId) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!officerId) { setLoading(false); return; }
    const q = query(
      collection(db, 'tickets'),
      where('assignedOfficerId', '==', officerId),
      where('status', 'in', ['ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'GHOST_FLAGGED', 'CLOSED_OVERRIDE']),
      orderBy('slaDeadline', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(d => {
        const { internalNotes, citizenPhone, citizenEmail, ...pub } = d.data();
        return { id: d.id, ...pub };
      }));
      setLoading(false);
    });
    return unsub;
  }, [officerId]);

  return { tickets, loading };
};

export const useUnassignedTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'UNASSIGNED'),
      orderBy('severity', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { tickets, loading };
};

export const useAllTickets = (filters = {}) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      let all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filters.status)       all = all.filter(t => t.status === filters.status);
      if (filters.departmentId) all = all.filter(t => t.departmentId === filters.departmentId);
      if (filters.ward)         all = all.filter(t => t.location?.ward === filters.ward);
      setTickets(all);
      setLoading(false);
    });
    return unsub;
  }, [filters.status, filters.departmentId, filters.ward]);

  return { tickets, loading };
};
