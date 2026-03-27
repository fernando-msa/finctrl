import {
  auth,
  googleProvider,
  db,
  app,
  firebaseConfig
} from './firebase.js';

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  addDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const state = {
  user: null,
  profile: {
    name: '',
    income: 0,
    emergency: 0,
    onboardingDone: false
  },
  debts: [],
  expenses: [],
  fgts: [],
  goals: []
};

export const fmt = (v = 0) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const pct = (a = 0, b = 1) => {
  const denom = Number(b || 0);
  if (denom <= 0) return 0;
  return Math.round((Number(a || 0) / denom) * 100);
};

const uidPath = () => doc(db, 'users', state.user.uid);
const collPath = (name) => collection(db, 'users', state.user.uid, name);

async function logEvent(level, message, payload = {}) {
  try {
    const data = {
      level,
      message,
      payload,
      uid: state.user?.uid || null,
      email: state.user?.email || null,
      createdAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      appId: firebaseConfig.appId,
      projectId: firebaseConfig.projectId
    };

    await addDoc(collection(db, 'logs'), data);
    if (state.user?.uid) {
      await addDoc(collection(db, 'users', state.user.uid, 'logs'), data);
    }
  } catch (err) {
    console.warn('Falha ao gravar log no Firestore:', err?.message || err);
  }
}

async function loadCollection(name) {
  const snap = await getDocs(collPath(name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function loadUserData(user) {
  state.user = user;

  const profileRef = uidPath();
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    state.profile = {
      name: user.displayName || '',
      income: 0,
      emergency: 0,
      onboardingDone: false,
      ...profileSnap.data()
    };
  } else {
    state.profile = {
      name: user.displayName || '',
      income: 0,
      emergency: 0,
      onboardingDone: false
    };
    await setDoc(profileRef, {
      ...state.profile,
      email: user.email || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  const [debts, expenses, fgts, goals] = await Promise.all([
    loadCollection('debts'),
    loadCollection('expenses'),
    loadCollection('fgts'),
    loadCollection('goals')
  ]);

  state.debts = debts;
  state.expenses = expenses;
  state.fgts = fgts;
  state.goals = goals;
}

export async function actionSaveProfile(partial = {}) {
  if (!state.user) throw new Error('Usuário não autenticado.');

  state.profile = {
    ...state.profile,
    ...partial
  };

  await setDoc(uidPath(), {
    ...state.profile,
    updatedAt: serverTimestamp()
  }, { merge: true });

  await logEvent('info', 'Perfil atualizado', {
    income: state.profile.income,
    emergency: state.profile.emergency,
    onboardingDone: state.profile.onboardingDone
  });
}

export const income = () => Number(state.profile?.income || 0);
export const emergency = () => Number(state.profile?.emergency || 0);
export const getActiveDebts = () => state.debts.filter((d) => !d.paid);
export const getTotalDebt = () => getActiveDebts().reduce((s, d) => s + Number(d.total || 0), 0);
export const getTotalMonthly = () => getActiveDebts().reduce((s, d) => s + Number(d.monthly || 0), 0);
export const getTotalExp = () => state.expenses.reduce((s, e) => s + Number(e.val || 0), 0);
export const getFreeAmount = () => income() - getTotalMonthly() - getTotalExp() - emergency();
export const getCommitPct = () => pct(getTotalMonthly() + getTotalExp(), income());

export function getPeopleMap() {
  return state.expenses.reduce((acc, item) => {
    const person = (item.person || 'Sem pessoa').trim();
    if (!acc[person]) acc[person] = [];
    acc[person].push({
      name: item.name || 'Sem nome',
      val: Number(item.val || 0)
    });
    return acc;
  }, {});
}

export function toast(message, type = 'ok') {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.position = 'fixed';
  el.style.right = '16px';
  el.style.bottom = '16px';
  el.style.padding = '10px 12px';
  el.style.borderRadius = '10px';
  el.style.background = type === 'ok' ? '#1f9d55' : '#d64545';
  el.style.color = '#fff';
  el.style.fontSize = '12px';
  el.style.zIndex = '9999';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export async function handleLogin() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    toast('Erro no login. Tente novamente.', 'err');
    await logEvent('error', 'Falha no login', { code: err?.code, message: err?.message });
  }
}

export async function handleLogout() {
  try {
    await signOut(auth);
  } catch (err) {
    toast('Erro ao sair.', 'err');
    await logEvent('error', 'Falha no logout', { code: err?.code, message: err?.message });
  }
}

export function initAuth(onIn, onOut) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      state.user = null;
      onOut?.();
      return;
    }

    try {
      await loadUserData(user);
      await logEvent('info', 'Usuário autenticado', { email: user.email || null });
      onIn?.(user);
    } catch (err) {
      toast('Falha ao carregar dados do Firebase.', 'err');
      await logEvent('error', 'Erro ao carregar usuário', { message: err?.message });
      onOut?.();
    }
  });
}

console.info('[FinCtrl] Firebase inicializado:', {
  app: app.name,
  projectId: firebaseConfig.projectId
});
