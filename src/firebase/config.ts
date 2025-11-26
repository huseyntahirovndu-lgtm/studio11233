import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export const firebaseConfig = {
  "projectId": "studio-9440813352-3c037",
  "appId": "1:480800403588:web:07d389980c828f27c7d2d1",
  "apiKey": "AIzaSyDRZ2_RNfVfNxYJX65jC-vpv0mTHvZdmco",
  "authDomain": "studio-9440813352-3c037.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "480800403588"
};

let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

// Firebase initialize - yalnız bir dəfə
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  
  // ⚡ ƏSAS OPTIMALLAŞDIRMA - Offline cache və settings
  try {
    firestore = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true, 
      ignoreUndefinedProperties: true,
    });
  } catch (e) {
    console.error("Could not initialize offline cache: ", e)
    firestore = getFirestore(app);
  }
  
  auth = getAuth(app);
} else {
  app = getApps()[0];
  firestore = getFirestore(app);
  auth = getAuth(app);
}

export { app, firestore, auth };
