import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';

export function createUserAdminService(db, auditService = null) {
  async function ensureProfile(user) {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);
    const now = new Date().toISOString();

    if (!snapshot.exists()) {
      const profile = {
        uid: user.uid,
        email: user.email || '',
        role: 'user',
        status: 'active',
        created_at: now,
        updated_at: now,
        last_login_at: now
      };
      await setDoc(userRef, profile, { merge: true });
      auditService?.logLater?.('admin.profile_create', {
        target_uid: user.uid,
        role: profile.role,
        status: profile.status
      }, { user });
      return profile;
    }

    const profile = { uid: user.uid, ...snapshot.data() };
    const updates = {
      email: user.email || profile.email || '',
      updated_at: now,
      last_login_at: now
    };
    setDoc(userRef, updates, { merge: true }).catch((error) => console.error('Erro ao atualizar perfil', error));
    return { ...profile, ...updates };
  }

  async function getProfile(uid) {
    const snapshot = await getDoc(doc(db, 'users', uid));
    return snapshot.exists() ? { uid, ...snapshot.data() } : null;
  }

  async function listUsers() {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs
      .map((item) => ({ uid: item.id, ...item.data() }))
      .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
  }

  async function updateUser(uid, payload) {
    await updateDoc(doc(db, 'users', uid), {
      ...payload,
      updated_at: new Date().toISOString()
    });
    auditService?.logLater?.('admin.user_update', {
      target_uid: uid,
      updated_fields: Object.keys(payload || {}),
      role: payload?.role || '',
      status: payload?.status || ''
    });
  }

  return {
    ensureProfile,
    getProfile,
    listUsers,
    updateUser
  };
}
