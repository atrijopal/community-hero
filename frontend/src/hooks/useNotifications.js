import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, limit, doc, updateDoc } from 'firebase/firestore';

export const useNotifications = (uid) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!uid) return;
    // No orderBy — avoids composite index; sort client-side
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.createdAt?.seconds ?? 0;
          const tb = b.createdAt?.seconds ?? 0;
          return tb - ta;
        });
      setNotifications(sorted);
    });
    return unsub;
  }, [uid]);

  const markRead = async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, unreadCount, markRead };
};
