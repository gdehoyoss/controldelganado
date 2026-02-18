import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjJ1tP-otajTNwmTqHSpzAAVlo6oBO-Ww",
  authDomain: "control-del-ganado.firebaseapp.com",
  projectId: "control-del-ganado",
  storageBucket: "control-del-ganado.firebasestorage.app",
  messagingSenderId: "569541346292",
  appId: "1:569541346292:web:2d78295dfb37b87203afa1",
  measurementId: "G-S77NHDHZKY"
};

const app = initializeApp(firebaseConfig);
window.firebaseApp = app;

const auth = getAuth(app);
window.firebaseAuth = auth;

initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const db = getFirestore(app);
window.firebaseDb = db;

const FIRESTORE_KEYS_SYNC = [
  'pecuario_cabezas',
  'pecuario_cabezas_cambios_grupo',
  'pecuario_animales_bajas',
  'pecuario_pesaje_ind',
  'pecuario_pesaje_grupo',
  'pecuario_sanidad',
  'pecuario_reproduccion',
  'pecuario_contabilidad',
  'pecuario_actividades',
  'pecuario_seguridad',
  'pecuario_maquinaria',
  'pecuario_potreros',
  'pecuario_corrales'
];

const syncState = {
  lastPushOkAt: 0,
  lastPushKey: '',
  lastError: '',
  lastErrorAt: 0,
  authReady: false,
  authUid: '',
  authProvider: '',
  authError: '',
  authDisabled: false,
  authDisabledReason: ''
};

let resolveAuthReady;
const authReadyPromise = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

function resolveAuthReadyOnce(){
  if (!syncState.authReady) {
    syncState.authReady = true;
    resolveAuthReady();
  }
}

function updateAuthState(user){
  syncState.authUid = user?.uid || '';
  syncState.authProvider = user?.isAnonymous
    ? 'anonymous'
    : (user?.providerData?.[0]?.providerId || 'unknown');
}

function reportSyncError(source, key, err){
  const msg = String(err?.message || err || 'Error desconocido');
  syncState.lastError = `[${source}] ${key || '-'}: ${msg}`;
  syncState.lastErrorAt = Date.now();
  console.error('Firebase sync error:', { source, key, err });
  window.dispatchEvent(new CustomEvent('pecuario:sync-error', {
    detail: { source, key, message: msg }
  }));
}

function isAuthConfigurationMissing(err){
  const code = String(err?.code || '');
  const msg = String(err?.message || '');
  return code.includes('configuration-not-found') || msg.includes('configuration-not-found');
}

function disableAuthSync(reason){
  syncState.authDisabled = true;
  syncState.authDisabledReason = reason || 'Autenticación Firebase no disponible.';
  syncState.authError = syncState.authDisabledReason;
  resolveAuthReadyOnce();
}

function markSyncOk(key){
  syncState.lastPushOkAt = Date.now();
  syncState.lastPushKey = key || '';
}

function getRanchoId(){
  return (localStorage.getItem('pecuario_rancho_id') || 'Rancho1').trim();
}

function getSnapshotRef(key){
  return doc(db, 'ranchos', getRanchoId(), 'snapshots', key);
}

async function ensureAuthSession(){
  if (syncState.authDisabled) return null;

  if (auth.currentUser) {
    updateAuthState(auth.currentUser);
    resolveAuthReadyOnce();
    return auth.currentUser;
  }
  try {
    const result = await signInAnonymously(auth);
    syncState.authError = '';
    updateAuthState(result.user);
    resolveAuthReadyOnce();
    return result.user;
  } catch (err) {
    const msg = String(err?.message || err || 'Error auth desconocido');
    if (isAuthConfigurationMissing(err)) {
      disableAuthSync('Firebase Auth no está configurado en este proyecto (auth/configuration-not-found). La app seguirá en modo local sin sincronizar.');
      console.warn(syncState.authDisabledReason);
      return null;
    }
    syncState.authError = msg;
    reportSyncError('auth', '-', err);
    throw err;
  }
}

onAuthStateChanged(auth, (user) => {
  if (!user) return;
  syncState.authError = '';
  updateAuthState(user);
  resolveAuthReadyOnce();
});

async function pushSnapshot(key, payload){
  if (!key) return;
  await ensureAuthSession();
  await authReadyPromise;

  if (syncState.authDisabled) return;

  const clientUpdatedAt = Date.now();
  try {
    await setDoc(getSnapshotRef(key), {
      key,
      ranchoId: getRanchoId(),
      payload,
      clientUpdatedAt,
      updatedAt: serverTimestamp(),
      updatedBy: localStorage.getItem('pecuario_usuario_actual') || 'sin-usuario'
    }, { merge: true });
    markSyncOk(key);
  } catch (err) {
    reportSyncError('push', key, err);
    throw err;
  }
}

function subscribeSnapshot(key, onRemoteData){
  if (!key || typeof onRemoteData !== 'function') return () => {};
  if (syncState.authDisabled) return () => {};
  return onSnapshot(
    getSnapshotRef(key),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() || {};
      onRemoteData(data.payload, data);
    },
    (err) => reportSyncError('subscribe', key, err)
  );
}

function startLegacySync(){
  const unsubscribers = [];
  FIRESTORE_KEYS_SYNC.forEach((key) => {
    const unsub = subscribeSnapshot(key, (payload, meta) => {
      const remoteTs = Number(meta.clientUpdatedAt || 0);
      const localTs = Number(localStorage.getItem(`_sync_ts_${key}`) || 0);
      if (remoteTs <= localTs) return;
      localStorage.setItem(key, JSON.stringify(payload ?? []));
      localStorage.setItem(`_sync_ts_${key}`, String(remoteTs));
      window.dispatchEvent(new CustomEvent('pecuario:sync-updated', { detail: { key } }));
    });
    unsubscribers.push(unsub);
  });
  return () => unsubscribers.forEach((unsub) => unsub());
}

function getStatus(){
  return {
    projectId: firebaseConfig.projectId,
    ranchoId: getRanchoId(),
    keys: FIRESTORE_KEYS_SYNC.slice(),
    ...syncState
  };
}

window.firebaseSync = {
  pushSnapshot,
  subscribeSnapshot,
  startLegacySync,
  getStatus,
  ensureAuthSession,
  keys: FIRESTORE_KEYS_SYNC
};

ensureAuthSession().catch(() => {});

isSupported().then((supported) => {
  if (!supported) return;
  const analytics = getAnalytics(app);
  window.firebaseAnalytics = analytics;
});
