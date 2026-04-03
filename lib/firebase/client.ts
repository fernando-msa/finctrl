import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

let cachedAuth: ReturnType<typeof getAuth> | null = null;

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      "Firebase client não configurado. Defina NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN e NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }

  return { apiKey, authDomain, projectId };
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
