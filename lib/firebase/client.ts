import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

let cachedAuth: ReturnType<typeof getAuth> | null = null;

const defaultFirebaseConfig = {
  apiKey: "AIzaSyDnqqfvrAJdEJFzDNjt4gohg6h63unL8g4",
  authDomain: "fincrtl-3e976.firebaseapp.com",
  projectId: "fincrtl-3e976",
  databaseURL: "https://fincrtl-3e976-default-rtdb.firebaseio.com",
  storageBucket: "fincrtl-3e976.firebasestorage.app",
  messagingSenderId: "1052094135775",
  appId: "1:1052094135775:web:d25f0dd40c5d992437186a",
  measurementId: "G-BLK1Q2494Z"
};

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (apiKey && authDomain && projectId) {
    return {
      ...defaultFirebaseConfig,
      apiKey,
      authDomain,
      projectId
    };
  }

  if (typeof window !== "undefined") {
    console.warn(
      "[FinCtrl] Config NEXT_PUBLIC_FIREBASE_* ausente. Usando configuração padrão embutida do Firebase Web."
    );
  }

  return defaultFirebaseConfig;
}

export function getClientAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  if (typeof window === "undefined") {
    throw new Error("getClientAuth() deve ser chamado apenas no navegador.");
  }

  const firebaseConfig = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}
