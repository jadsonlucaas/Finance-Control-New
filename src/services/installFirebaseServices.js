import { createAuthService, persistAuthSession, subscribeAuthState } from './auth.js';
import { createAuditService, installAuditGlobals } from './audit.js';
import { createDataSdkService } from './dataSdk.js';
import { createFirebaseService, FIREBASE_CONFIG } from './firebase.js';
import { createUserAdminService } from './userAdmin.js';

export function installFirebaseServices({ target = window, config = FIREBASE_CONFIG } = {}) {
  const { auth, db } = createFirebaseService(config);
  const auditService = createAuditService({ auth, db, target });
  const dataServices = createDataSdkService({ auth, db, target, auditService });

  target.__financeRawDataSdk = dataServices.dataSdk;
  target.dataSdk = dataServices.dataSdk;
  target.authSdk = createAuthService(auth, auditService);
  target.userAdminSdk = createUserAdminService(db, auditService);
  installAuditGlobals(target, auditService);
  target.cloudLocalStorageSync = dataServices.cloudLocalStorageSync;
  target.firebaseBatchDeleteRecords = dataServices.batchDeleteRecords;

  persistAuthSession(auth).catch((error) => {
    console.error('Erro ao persistir sessão', error);
  });

  subscribeAuthState(auth, (user) => {
    if (!user) dataServices.cleanupOnSignOut();

    target.dispatchEvent(new CustomEvent('authStateChanged', {
      detail: user ? { uid: user.uid, email: user.email || '' } : null
    }));
  });

  target.dispatchEvent(new Event('firebasePronto'));

  return {
    auth,
    db,
    auditService,
    dataServices
  };
}
