import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js';

// Config padrão público do app (Firebase Web Config não é segredo).
// Pode ser sobrescrito por `window.__FINCTRL_FIREBASE_CONFIG__`
// para ambientes locais/staging sem alterar o código versionado.
const defaultFirebaseConfig = {
  apiKey: 'AIzaSyDnqqfvrAJdEJFzDNjt4gohg6h63unL8g4',
  authDomain: 'fincrtl-3e976.firebaseapp.com',
  projectId: 'fincrtl-3e976',
  storageBucket: 'fincrtl-3e976.firebasestorage.app',
  messagingSenderId: '1052094135775',
  appId: '1:1052094135775:web:d25f0dd40c5d992437186a',
  measurementId: 'G-BLK1Q2494Z',
  databaseURL: 'https://fincrtl-3e976-default-rtdb.firebaseio.com'
};

if (!globalThis.__FINCTRL_FIREBASE_CONFIG__) {
  globalThis.__FINCTRL_FIREBASE_CONFIG__ = { ...defaultFirebaseConfig };
  console.info('[FinCtrl] window.__FINCTRL_FIREBASE_CONFIG__ não encontrado. Config padrão aplicada.');
} else {
  console.info('[FinCtrl] Firebase config carregado via window.__FINCTRL_FIREBASE_CONFIG__.');
}

const firebaseConfig = globalThis.__FINCTRL_FIREBASE_CONFIG__;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, firebaseConfig };
