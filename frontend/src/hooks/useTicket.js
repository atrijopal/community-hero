import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';

const sortByDate = (arr, field = 'createdAt', desc = true) =>
  [...arr].sort((a, b) => {
    const ta = a[field]?.seconds ?? (typeof a[field] === 'string' ? new Date(a[field]).getTime() / 1000 : 0);
    const tb = b[field]?.seconds ?? (typeof b[field] === 'string' ? new Date(b[field]).getTime() / 1000 : 0);
    return desc ? tb - ta : ta - tb;
  });

export const useTicket = (publicId) => {
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!publicId) { setLoading(false); return; }
    const q = query(collection(db, 'tickets'), where('publicId', '==', publicId), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const { internalNotes, citizenPhone, citizenEmail, ...pub } = d.data();
        setTicket({ id: d.id, ...pub });
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
    const q = query(collection(db, 'tickets'), where('citizenId', '==', citizenId), limit(50));
    const unsub = onSnapshot(q,
      (snap) => {
        setTickets(sortByDate(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [citizenId]);

  return { tickets, loading };
};

export const useOfficerQueue = (officerId) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const ACTIVE = new Set(['ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'GHOST_FLAGGED', 'CLOSED_OVERRIDE']);

  useEffect(() => {
    if (!officerId) { setLoading(false); return; }
    // Only filter by assignedOfficerId — no status+orderBy combo that needs an index
    const q = query(collection(db, 'tickets'), where('assignedOfficerId', '==', officerId), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => {
        const { internalNotes, citizenPhone, citizenEmail, ...pub } = d.data();
        return { id: d.id, ...pub };
      }).filter(t => ACTIVE.has(t.status));
      // Sort by slaDeadline ascending in JS
      all.sort((a, b) => {
        const ta = a.slaDeadline ? new Date(a.slaDeadline).getTime() : Infinity;
        const tb = b.slaDeadline ? new Date(b.slaDeadline).getTime() : Infinity;
        return ta - tb;
      });
      setTickets(all);
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
    // Only filter by status — no orderBy to avoid index requirement; sort by severity in JS
    const q = query(collection(db, 'tickets'), where('status', '==', 'UNASSIGNED'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));
      setTickets(sorted);
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
    // No orderBy in query — sort client-side to avoid needing a composite index
    const q = query(collection(db, 'tickets'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      let all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (filters.status)       all = all.filter(t => t.status === filters.status);
      if (filters.departmentId) all = all.filter(t => t.departmentId === filters.departmentId);
      if (filters.ward)         all = all.filter(t => t.location?.ward === filters.ward);
      setTickets(sortByDate(all));
      setLoading(false);
    });
    return unsub;
  }, [filters.status, filters.departmentId, filters.ward]);

  return { tickets, loading };
};
