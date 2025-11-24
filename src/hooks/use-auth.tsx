'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { AppUser, Student, StudentOrganization, Admin } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (
    user: Omit<Student, 'id' | 'createdAt' | 'status'> | Omit<StudentOrganization, 'id' | 'createdAt'>,
    pass: string,
    skipRedirect?: boolean
  ) => Promise<boolean>;
  updateUser: (updatedData: Partial<AppUser>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_AUTH_DELAY = 10; 

const adminUserObject: Admin = {
    id: 'admin_user',
    role: 'admin',
    email: 'huseynimanov@ndu.edu.az',
    firstName: 'Hüseyn',
    lastName: 'Tahirov',
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (userId === adminUserObject.id) {
        setUser(adminUserObject);
      } else if (userId && firestore) {
        try {
          // Check students/admins in 'users' collection
          let userDocRef = doc(firestore, 'users', userId);
          let userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setUser(userSnap.data() as AppUser);
          } else {
            // Check student organizations in 'student-organizations' collection
            userDocRef = doc(firestore, 'student-organizations', userId);
            userSnap = await getDoc(userDocRef);
             if (userSnap.exists()) {
                setUser(userSnap.data() as AppUser);
             } else {
                localStorage.removeItem('userId');
                setUser(null);
             }
          }
        } catch (e) {
          console.error("Failed to restore session from Firestore", e);
          localStorage.removeItem('userId');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    
    if(firestore) {
      checkUserSession();
    }
  }, [firestore]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    await new Promise(res => setTimeout(res, FAKE_AUTH_DELAY));

    if (email === adminUserObject.email && pass === 'huseynimanov2009@thikndu') {
        setUser(adminUserObject);
        localStorage.setItem('userId', adminUserObject.id);
        setLoading(false);
        router.push('/admin/dashboard');
        return true;
    }

    if (!firestore) return false;

    try {
      // Search in 'users' collection (for students)
      const usersRef = collection(firestore, "users");
      const qUsers = query(usersRef, where("email", "==", email));
      const userSnapshot = await getDocs(qUsers);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data() as AppUser;
        
        setUser(userData);
        localStorage.setItem('userId', userData.id);
        
        if (userData.role === 'student') router.push('/student-dashboard');
        else router.push('/');

        setLoading(false);
        return true;
      }
      
      // Search in 'student-organizations' collection
      const orgsRef = collection(firestore, "student-organizations");
      const qOrgs = query(orgsRef, where("email", "==", email));
      const orgSnapshot = await getDocs(qOrgs);

      if (!orgSnapshot.empty) {
        const orgDoc = orgSnapshot.docs[0];
        const orgData = orgDoc.data() as AppUser;

        setUser(orgData);
        localStorage.setItem('userId', orgData.id);

        if (orgData.role === 'student-organization') router.push('/telebe-teskilati-paneli/dashboard');
        else router.push('/');

        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;

    } catch (error) {
      console.error("Login failed:", error);
    }
    
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const register = async (
    newUser: Omit<Student, 'id' | 'createdAt' | 'status'> | Omit<StudentOrganization, 'id' | 'createdAt'>,
    pass: string,
    skipRedirect = false
  ): Promise<boolean> => {
     setLoading(true);
     await new Promise(res => setTimeout(res, FAKE_AUTH_DELAY));

    if (!firestore) {
      console.error("Firestore is not initialized");
      setLoading(false);
      return false;
    }

    try {
      const collectionName = newUser.role === 'student' ? 'users' : 'student-organizations';
      const collectionRef = collection(firestore, collectionName);

      const q = query(collectionRef, where("email", "==", newUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`User with this email already exists in ${collectionName}.`);
        setLoading(false);
        return false;
      }

      const newUserId = uuidv4();
      const userDocRef = doc(firestore, collectionName, newUserId);
      
      const userWithId = {
          ...newUser,
          id: newUserId,
          createdAt: new Date().toISOString(),
          status: newUser.role === 'student' ? 'gözləyir' : newUser.status,
      };

      await setDoc(userDocRef, userWithId);
      setLoading(false);

      if (!skipRedirect) {
          router.push('/login');
      }
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setLoading(false);
      return false;
    }
  };

  const updateUser = (updatedData: Partial<AppUser>): boolean => {
    if (!user) return false;
    const newUserData = { ...user, ...updatedData };
    setUser(newUserData);
    
    if (firestore && user.id !== 'admin_user') {
        const collectionName = user.role === 'student' ? 'users' : 'student-organizations';
        const userDocRef = doc(firestore, collectionName, newUserData.id);
        setDoc(userDocRef, updatedData, { merge: true }).catch(err => {
            console.error("Failed to update user in Firestore:", err);
        });
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SessionProvider');
  }
  return context;
};
