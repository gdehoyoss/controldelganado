import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
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

const AUTO_ANON_KEY = 'pecuario_firebase_auto_anon';

const app = initializeApp(firebaseConfig);
window.firebaseApp = app;

const auth = getAuth(app);
auth.languageCode = 'es';
window.firebaseAuth = auth;
const googleProvider = new GoogleAuthProvider();

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

function isAutoAnonymousEnabled(){
  const flag = localStorage.getItem(AUTO_ANON_KEY);
  return flag !== '0';
}

function setAutoAnonymousEnabled(enabled){
  localStorage.setItem(AUTO_ANON_KEY, enabled ? '1' : '0');
}

function updateAuthState(user){
  syncState.authUid = user?.uid || '';
  syncState.authProvider = user?.isAnonymous
    ? 'anonymous'
    : (user?.providerData?.[0]?.providerId || (user ? 'unknown' : ''));
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

function getAuthSetupInstructions(){
  return 'Firebase Auth no está configurado para este proyecto. Debes activarlo en Firebase Console > Authentication > Comenzar y habilitar al menos un proveedor (Email/Password, Google o Anonymous).';
}

function humanizeAuthError(err){
  const code = String(err?.code || '');
  if (isAuthConfigurationMissing(err)) return getAuthSetupInstructions();
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) return 'Correo o contraseña incorrectos.';
  if (code.includes('auth/user-not-found')) return 'No existe una cuenta con ese correo.';
  if (code.includes('auth/popup-closed-by-user')) return 'Se cerró la ventana de Google antes de completar el acceso.';
  if (code.includes('auth/network-request-failed')) return 'Error de red al contactar Firebase Auth. Revisa tu conexión.';
  return String(err?.message || err || 'Error de autenticación.');
}

function disableAuthSync(reason){
  syncState.authDisabled = true;
  syncState.authDisabledReason = reason || 'Autenticación Firebase no disponible.';
  syncState.authError = syncState.authDisabledReason;
  resolveAuthReadyOnce();
  window.dispatchEvent(new CustomEvent('pecuario:auth-disabled', {
    detail: { reason: syncState.authDisabledReason }
  }));
}

function canSyncWithoutAuth(){
  return false;
}

function resetAuthAfterConfigurationFix(){
  resetAuthDisabledState();
  updateAuthState(null);
}

function resetAuthDisabledState(){
  syncState.authDisabled = false;
  syncState.authDisabledReason = '';
  syncState.authError = '';
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

async function ensureAuthSession({ allowAnonymousFallback = true } = {}){
  if (syncState.authDisabled) return null;

  if (auth.currentUser) {
    updateAuthState(auth.currentUser);
    syncState.authError = '';
    resolveAuthReadyOnce();
    return auth.currentUser;
  }

  const canUseAnon = allowAnonymousFallback && isAutoAnonymousEnabled();
  if (!canUseAnon) {
    updateAuthState(null);
    resolveAuthReadyOnce();
    return null;
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

async function loginWithEmailPassword(email, password){
  const result = await signInWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''));
  syncState.authError = '';
  setAutoAnonymousEnabled(false);
  updateAuthState(result.user);
  resolveAuthReadyOnce();
  return result.user;
}

async function registerWithEmailPassword(email, password){
  const result = await createUserWithEmailAndPassword(auth, String(email || '').trim(), String(password || ''));
  syncState.authError = '';
  setAutoAnonymousEnabled(false);
  updateAuthState(result.user);
  resolveAuthReadyOnce();
  return result.user;
}

async function loginWithGoogle(){
  const result = await signInWithPopup(auth, googleProvider);
  syncState.authError = '';
  setAutoAnonymousEnabled(false);
  updateAuthState(result.user);
  resolveAuthReadyOnce();
  return result.user;
}

async function useAnonymousMode(){
  setAutoAnonymousEnabled(true);
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    return ensureAuthSession({ allowAnonymousFallback: true });
  }
  await signOut(auth);
  return ensureAuthSession({ allowAnonymousFallback: true });
}

async function logoutFirebase(){
  setAutoAnonymousEnabled(false);
  await signOut(auth);
  updateAuthState(null);
}

function describeFirebaseUser(user){
  if (!user) return 'Sin sesión';
  if (user.isAnonymous) return 'Invitado';
  return user.email || user.displayName || user.uid;
}

function initFirebaseAuthUi(){
  const chip = document.getElementById('authStatusChip');
  const panel = document.getElementById('firebaseAuthPanel');
  const msg = document.getElementById('firebaseAuthMsg');
  const emailInput = document.getElementById('firebaseAuthEmail');
  const passInput = document.getElementById('firebaseAuthPassword');
  const btnToggle = document.getElementById('btnToggleAuthPanel');
  const btnSignOut = document.getElementById('btnFirebaseSignOut');
  const btnSignIn = document.getElementById('btnFirebaseSignIn');
  const btnRegister = document.getElementById('btnFirebaseRegister');
  const btnGoogle = document.getElementById('btnFirebaseGoogle');
  const btnAnon = document.getElementById('btnFirebaseAnon');
  const btnRetry = document.getElementById('btnFirebaseRetry');

  if (!chip || !panel || !msg || !btnToggle || !btnSignOut || !btnSignIn || !btnRegister || !btnGoogle || !btnAnon || !btnRetry) return;

  const setMessage = (text, isError = false) => {
    msg.textContent = text;
    msg.style.color = isError ? '#b91c1c' : '';
  };

  const setBusy = (busy) => {
    [btnSignIn, btnRegister, btnGoogle, btnAnon, btnSignOut, btnRetry].forEach((btn) => {
      if (btn) btn.disabled = busy;
    });
  };

  const setAuthControlsDisabled = (disabled) => {
    [btnSignIn, btnRegister, btnGoogle, btnAnon].forEach((btn) => {
      if (btn) btn.disabled = disabled;
    });
  };

  const refreshUi = (user) => {
    chip.textContent = `Auth: ${describeFirebaseUser(user)}`;
    chip.style.background = user?.isAnonymous ? '#92400e' : (user ? '#166534' : '#334155');
    btnToggle.textContent = panel.style.display === 'none' ? 'Iniciar sesión Firebase' : 'Ocultar acceso Firebase';
    btnSignOut.hidden = !user;
    btnAnon.textContent = isAutoAnonymousEnabled() ? 'Modo invitado activo' : 'Usar modo invitado';

    if (syncState.authDisabled) {
      chip.textContent = 'Auth: no configurado';
      chip.style.background = '#7f1d1d';
      setAuthControlsDisabled(true);
      btnSignOut.hidden = true;
      btnRetry.hidden = false;
      if (!msg.textContent || msg.textContent.includes('Firestore')) {
        setMessage(`${getAuthSetupInstructions()} Luego presiona "Reintentar conexión Auth".`, true);
      }
      return;
    }

    setAuthControlsDisabled(false);
    btnRetry.hidden = true;
  };

  btnToggle.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    refreshUi(auth.currentUser);
  });

  btnSignOut.addEventListener('click', async () => {
    try {
      setBusy(true);
      await logoutFirebase();
      setMessage('Sesión cerrada. Permaneces sin sesión hasta elegir un método de acceso.');
    } catch (err) {
      setMessage(`No se pudo cerrar sesión: ${String(err?.message || err)}`, true);
    } finally {
      setBusy(false);
      refreshUi(auth.currentUser);
    }
  });

  btnSignIn.addEventListener('click', async () => {
    try {
      setBusy(true);
      await loginWithEmailPassword(emailInput?.value, passInput?.value);
      setMessage('Sesión iniciada correctamente.');
    } catch (err) {
      setMessage(`No se pudo iniciar sesión: ${humanizeAuthError(err)}`, true);
    } finally {
      setBusy(false);
      refreshUi(auth.currentUser);
    }
  });

  btnRegister.addEventListener('click', async () => {
    try {
      setBusy(true);
      await registerWithEmailPassword(emailInput?.value, passInput?.value);
      setMessage('Cuenta creada y sesión iniciada.');
    } catch (err) {
      setMessage(`No se pudo crear la cuenta: ${humanizeAuthError(err)}`, true);
    } finally {
      setBusy(false);
      refreshUi(auth.currentUser);
    }
  });

  btnGoogle.addEventListener('click', async () => {
    try {
      setBusy(true);
      await loginWithGoogle();
      setMessage('Sesión iniciada con Google.');
    } catch (err) {
      setMessage(`No se pudo iniciar con Google: ${humanizeAuthError(err)}`, true);
    } finally {
      setBusy(false);
      refreshUi(auth.currentUser);
    }
  });

  window.addEventListener('pecuario:auth-state', (ev) => {
    refreshUi(ev?.detail?.user || auth.currentUser || null);
  });

  btnAnon.addEventListener('click', async () => {
    try {
      setBusy(true);
      await useAnonymousMode();
      setMessage('Sesión invitado activa.');
    } catch (err) {
      setMessage(`No se pudo activar modo invitado: ${String(err?.message || err)}`, true);
    } finally {
      setBusy(false);
      refreshUi(auth.currentUser);
    }
  });

  btnRetry.addEventListener('click', async () => {
    try {
      setBusy(true);
      resetAuthAfterConfigurationFix();
      await ensureAuthSession();
      if (syncState.authDisabled) {
        setMessage(`${getAuthSetupInstructions()} Si ya lo activaste, recarga la página en unos segundos.`, true);
      } else {
        setMessage('Conexión con Firebase Auth restablecida.');
      }
    } catch (err) {
      setMessage(`No se pudo restablecer Firebase Auth: ${humanizeAuthError(err)}`, true);
    } finally {
      setBusy(false);
      refreshUi(auth.currentUser);
    }
  });

  refreshUi(auth.currentUser);
}

onAuthStateChanged(auth, (user) => {
  syncState.authError = '';
  updateAuthState(user || null);
  resolveAuthReadyOnce();
  window.dispatchEvent(new CustomEvent('pecuario:auth-state', { detail: { user } }));
});

async function pushSnapshot(key, payload){
  if (!key) return;
  await ensureAuthSession();
  await authReadyPromise;

  if (syncState.authDisabled) return;
  if (!auth.currentUser) return;

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
  if (syncState.authDisabled && !canSyncWithoutAuth()) return () => {};
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
    autoAnonymous: isAutoAnonymousEnabled(),
    ...syncState
  };
}

window.firebaseSync = {
  pushSnapshot,
  subscribeSnapshot,
  startLegacySync,
  getStatus,
  ensureAuthSession,
  loginWithEmailPassword,
  registerWithEmailPassword,
  loginWithGoogle,
  logoutFirebase,
  useAnonymousMode,
  keys: FIRESTORE_KEYS_SYNC
};


ensureAuthSession().catch(() => {});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebaseAuthUi, { once: true });
} else {
  initFirebaseAuthUi();
}

isSupported().then((supported) => {
  if (!supported) return;
  const analytics = getAnalytics(app);
  window.firebaseAnalytics = analytics;
});
