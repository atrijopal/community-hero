import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult();
          const role = token.claims.admin          ? 'admin'
                     : token.claims.senior_officer ? 'senior_officer'
                     : token.claims.officer        ? 'officer'
                     : 'citizen';
          setUser(firebaseUser);
          setUserRole(role);
        } catch {
          setUser(firebaseUser);
          setUserRole('citizen');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshRole = async () => {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdTokenResult(true);
    const role = token.claims.admin ? 'admin' : token.claims.officer ? 'officer' : 'citizen';
    setUserRole(role);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
