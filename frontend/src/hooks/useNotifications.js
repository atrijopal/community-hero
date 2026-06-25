import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

export const useNotifications = (uid) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [uid]);

  const markRead = async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, unreadCount, markRead };
};
