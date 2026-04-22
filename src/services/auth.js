import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { normalizeAuthError } from './authErrors.js';

export { normalizeAuthError };

export function createAuthService(auth, auditService = null) {
  return {
    signIn: async (email, password) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      auditService?.logLater?.('auth.login', { email });
      return credential;
    },
    signUp: async (email, password) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      auditService?.logLater?.('auth.signup', { email });
      return credential;
    },
    signOut: async () => {
      auditService?.logLater?.('auth.logout', { email: auth.currentUser?.email || '' });
      return signOut(auth);
    },
    getCurrentUser: () => auth.currentUser,
    normalizeError: normalizeAuthError
  };
}

export function persistAuthSession(auth) {
  return setPersistence(auth, browserSessionPersistence);
}

export function subscribeAuthState(auth, callback) {
  return onAuthStateChanged(auth, callback);
}
