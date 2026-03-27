// ============================================================
// firebase.js — Inicialização e autenticação
// Substitua os valores abaixo com os do seu projeto Firebase
// Console: https://console.firebase.google.com
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── CONFIGURAÇÃO ─────────────────────────────────────────
// Copie do Firebase Console → Configurações do projeto → Seus apps
const firebaseConfig = {
  apiKey:            "SUA_API_KEY",
  authDomain:        "SEU_PROJECT.firebaseapp.com",
  projectId:         "SEU_PROJECT_ID",
  storageBucket:     "SEU_PROJECT.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId:             "SEU_APP_ID"
};
// ──────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const provider = new GoogleAuthProvider();

// ─── AUTH ─────────────────────────────────────────────────
export async function loginGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    console.error("Login error:", e);
    throw e;
  }
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/index.html";
}

export function onAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  return auth.currentUser;
}

// ─── FIRESTORE HELPERS ────────────────────────────────────

// Perfil do usuário
export async function getProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveProfile(uid, data) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Subcoleção genérica por usuário
function userCol(uid, col) {
  return collection(db, "users", uid, col);
}
function userDocRef(uid, col, id) {
  return doc(db, "users", uid, col, id);
}

// Dívidas
export async function getDebts(uid) {
  const snap = await getDocs(userCol(uid, "debts"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addDebt(uid, data) {
  return await addDoc(userCol(uid, "debts"), { ...data, createdAt: serverTimestamp() });
}
export async function updateDebt(uid, id, data) {
  await updateDoc(userDocRef(uid, "debts", id), data);
}
export async function deleteDebt(uid, id) {
  await deleteDoc(userDocRef(uid, "debts", id));
}

// Gastos fixos
export async function getExpenses(uid) {
  const snap = await getDocs(userCol(uid, "expenses"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addExpense(uid, data) {
  return await addDoc(userCol(uid, "expenses"), { ...data, createdAt: serverTimestamp() });
}
export async function deleteExpense(uid, id) {
  await deleteDoc(userDocRef(uid, "expenses", id));
}

// FGTS
export async function getFGTS(uid) {
  const snap = await getDocs(userCol(uid, "fgts"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addFGTS(uid, data) {
  return await addDoc(userCol(uid, "fgts"), { ...data, createdAt: serverTimestamp() });
}
export async function deleteFGTS(uid, id) {
  await deleteDoc(userDocRef(uid, "fgts", id));
}

// Metas
export async function getGoals(uid) {
  const snap = await getDocs(userCol(uid, "goals"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function addGoal(uid, data) {
  return await addDoc(userCol(uid, "goals"), { ...data, createdAt: serverTimestamp() });
}
export async function deleteGoal(uid, id) {
  await deleteDoc(userDocRef(uid, "goals", id));
}

export { db, auth };
