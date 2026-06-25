import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

export const useGamification = (uid) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const unsub = onSnapshot(doc(db, 'gamification', uid), (snap) => {
      setData(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { gamification: data, loading };
};

export const useLeaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'gamification'), orderBy('xp', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setLeaders(snap.docs.map((d, i) => ({ uid: d.id, rank: i + 1, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { leaders, loading };
};
