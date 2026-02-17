import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
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
  lastErrorAt: 0
};

function reportSyncError(source, key, err){
  const msg = String(err?.message || err || 'Error desconocido');
  syncState.lastError = `[${source}] ${key || '-'}: ${msg}`;
  syncState.lastErrorAt = Date.now();
  console.error('Firebase sync error:', { source, key, err });
  window.dispatchEvent(new CustomEvent('pecuario:sync-error', {
    detail: { source, key, message: msg }
  }));
}

function markSyncOk(key){
  syncState.lastPushOkAt = Date.now();
  syncState.lastPushKey = key || '';
}

function getRanchoId(){
  return (localStorage.getItem('pecuario_rancho_id') || 'rancho-demo').trim();
}

function getSnapshotRef(key){
  return doc(db, 'ranchos', getRanchoId(), 'snapshots', key);
}

async function pushSnapshot(key, payload){
  if (!key) return;
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
  keys: FIRESTORE_KEYS_SYNC
};

isSupported().then((supported) => {
  if (!supported) return;
  const analytics = getAnalytics(app);
  window.firebaseAnalytics = analytics;
});
