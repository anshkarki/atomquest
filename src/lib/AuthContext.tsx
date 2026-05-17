import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  mockLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock session first
    const mockSession = localStorage.getItem('atomquest_mock_user');
    if (mockSession) {
      setUser(JSON.parse(mockSession));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const mockLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      // Find the template user in Firestore
      const q = query(collection(db, 'users'), where('role', '==', role));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userData = { uid: snap.docs[0].id, ...snap.docs[0].data() } as User;
        setUser(userData);
        localStorage.setItem('atomquest_mock_user', JSON.stringify(userData));
        toast.success(`Mock Login: Logged in as ${userData.name}`);
      } else {
        toast.error('Could not find template user. Please initialize demo data first.');
      }
    } catch (err: any) {
      toast.error('Mock login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('atomquest_mock_user');
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
