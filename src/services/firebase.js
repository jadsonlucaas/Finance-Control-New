import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD-iblMouoFYi8t7GM2pn7Ec3TcJD-hKGI',
  authDomain: 'finance-control-cce4f.firebaseapp.com',
  projectId: 'finance-control-cce4f',
  storageBucket: 'finance-control-cce4f.firebasestorage.app',
  messagingSenderId: '1050867234579',
  appId: '1:1050867234579:web:616463d41775696dfc4ce6',
  measurementId: 'G-7ZMJQ7CEH1'
};

export function createFirebaseService(config = FIREBASE_CONFIG) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  return { app, auth, db };
}
