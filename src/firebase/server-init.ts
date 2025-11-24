// This file is for server-side Firebase initialization only.
// It does not and should not have 'use client' directive.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Initializes and returns Firebase services for server-side usage.
 * It ensures that Firebase is initialized only once.
 */
export function initializeServerFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return {
      firebaseApp,
      firestore: getFirestore(firebaseApp),
    };
  } else {
    const firebaseApp = getApp();
    return {
      firebaseApp,
      firestore: getFirestore(firebaseApp),
    };
  }
}
