'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Client tərəfdə Firebase-i bir dəfə initialize edib
 * bütün app-ə context kimi verən provider.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

/**
 * Firestore query / ref-ləri üçün xüsusi memo helper.
 * Burada object-ə __memo = true flag-i əlavə edilir ki,
 * useCollectionOptimized bunu yoxlaya bilsin.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const value = useMemo(() => {
    const v: any = factory();
    // useCollectionOptimized / yeni useCollection bunu yoxlayır
    v.__memo = true;
    return v;
  }, deps);

  return value as T;
}
