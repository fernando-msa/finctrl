import {
  auth,
  googleProvider,
  db,
  app,
  firebaseConfig
} from './firebase.js';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
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
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit
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
  goals: [],
  method: 'avalanche'
};

const ADMIN_EMAILS = []; // Ex: ['admin@seudominio.com']
const ADMIN_ACCESS_MODE = 'allowlist'; // 'allowlist' | 'all-authenticated'
const MAX_TEXT = 180;

export const fmt = (v = 0) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const getAvatarDataUrl = (name = 'U') => {
  const safe = normText(String(name || 'U').replace(/[^\p{L}\p{N}\s]/gu, ''), 24) || 'U';
  const first = safe.trim().charAt(0).toUpperCase() || 'U';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23242a35'/><text x='50%' y='56%' dominant-baseline='middle' text-anchor='middle' fill='%23f5f5f5' font-family='Inter,Arial,sans-serif' font-size='30' font-weight='700'>${first}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
};

export const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const pct = (a = 0, b = 1) => {
  const denom = Number(b || 0);
  if (denom <= 0) return 0;
  return Math.round((Number(a || 0) / denom) * 100);
};

const uidPath = () => doc(db, 'users', state.user.uid);
const collPath = (name) => collection(db, 'users', state.user.uid, name);
const itemPath = (name, id) => doc(db, 'users', state.user.uid, name, id);

async function logEvent(level, message, payload = {}) {
  const data = {
    level,
    message,
    payload,
    uid: state.user?.uid || null,
    email: state.user?.email || null,
    createdAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    appId: firebaseConfig.appId,
    projectId: firebaseConfig.projectId
  };

  const dbData = {
    ...data,
    createdAt: serverTimestamp()
  };

  try {
    const tasks = [addDoc(collection(db, 'logs'), dbData)];
    if (state.user?.uid) {
      tasks.push(addDoc(collection(db, 'users', state.user.uid, 'logs'), dbData));
    }
    tasks.push(fetch('/api/slack-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }));

    await Promise.allSettled(tasks);
  } catch (err) {
    console.warn('Falha ao gravar log no Firestore:', err?.message || err);
  }
}

export async function actionSendFeedback(message = '', payload = {}) {
  const msg = normText(message, 240);
  if (!msg) throw new Error('Escreva um feedback antes de enviar.');
  await logEvent('feedback', msg, payload);
}

async function loadCollection(name) {
  const snap = await getDocs(collPath(name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function loadRecentLogs(max = 60) {
  if (!state.user?.uid) throw new Error('Usuário não autenticado.');
  const logsRef = collection(db, 'users', state.user.uid, 'logs');
  const q = query(logsRef, orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function isAdminUser(user = state.user) {
  if (!user) return false;
  if (ADMIN_ACCESS_MODE === 'all-authenticated') return true;
  const email = (user?.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email);
}

function applyAdminNavVisibility() {
  const isAdmin = isAdminUser();
  document.querySelectorAll('.admin-only').forEach((link) => {
    link.style.display = isAdmin ? '' : 'none';
  });
}

function initSidebarLayout() {
  const header = document.getElementById('app-header');
  const nav = header?.querySelector('.nav-tabs');
  if (!header || !nav || header.dataset.sidebarReady === '1') return;
  header.dataset.sidebarReady = '1';
  document.body.classList.add('layout-sidebar');

  nav.querySelectorAll('.nav-tab').forEach((tab) => {
    if (!tab.title) tab.title = tab.textContent?.trim() || 'Guia';
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sidebar-toggle';
  toggle.id = 'sidebar-toggle';
  const apply = (collapsed) => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    toggle.textContent = collapsed ? '☰' : 'Ocultar menu';
    toggle.title = collapsed ? 'Mostrar menu lateral' : 'Ocultar menu lateral';
  };

  const stored = localStorage.getItem('fincrtl.sidebarCollapsed') === '1';
  apply(stored);
  toggle.addEventListener('click', () => {
    const collapsed = !document.body.classList.contains('sidebar-collapsed');
    apply(collapsed);
    localStorage.setItem('fincrtl.sidebarCollapsed', collapsed ? '1' : '0');
  });

  header.insertBefore(toggle, nav);
}

const normText = (value, max = MAX_TEXT) => String(value || '').trim().slice(0, max);
const normMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
};
const normInt = (value, fallback = 0) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
};

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
    state.method = state.profile?.method || state.method;
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
  state.method = state.profile?.method || state.method;

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

export const CAT_LABELS = {
  moradia: '🏠 Moradia',
  educacao_filho: '🎒 Ed. Filho',
  educacao_propria: '🎓 Ed. Própria',
  saude: '🏥 Saúde',
  transporte: '🚗 Transporte',
  alimentacao: '🛒 Alimentação',
  utilidades: '💡 Utilidades',
  outro: '📋 Outro'
};

export const income = () => Number(state.profile?.income || 0);
export const emergency = () => Number(state.profile?.emergency || 0);
export const getActiveDebts = () => state.debts.filter((d) => !d.paid);
export const getTotalDebt = () => getActiveDebts().reduce((s, d) => s + Number(d.total || 0), 0);
export const getTotalMonthly = () => getActiveDebts().reduce((s, d) => s + Number(d.monthly || 0), 0);
export const getTotalExp = () => state.expenses.reduce((s, e) => s + Number(e.val || 0), 0);
export const getFreeAmount = () => income() - getTotalMonthly() - getTotalExp() - emergency();
export const getCommitPct = () => pct(getTotalMonthly() + getTotalExp(), income());
export const getSortedDebts = () => {
  const active = getActiveDebts();
  const atrasadas = active.filter((d) => d.status === 'atrasada');
  const normal = active.filter((d) => d.status !== 'atrasada');
  const sortedNormal = (state.method || 'avalanche') === 'snowball'
    ? normal.sort((a, b) => Number(a.total || 0) - Number(b.total || 0))
    : normal.sort((a, b) => Number(b.rate || 0) - Number(a.rate || 0));
  return [...atrasadas, ...sortedNormal];
};

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

export async function actionAddDebt(data = {}) {
  const name = normText(data.name, 120);
  if (!name) throw new Error('Informe o credor.');
  const payload = {
    name,
    paid: Boolean(data.paid),
    type: normText(data.type, 60) || 'Outro',
    total: normMoney(data.total),
    monthly: normMoney(data.monthly),
    rate: normMoney(data.rate),
    parcels: normInt(data.parcels, 0),
    status: ['em_dia', 'atrasada', 'negociando'].includes(data.status) ? data.status : 'em_dia',
    delay: normInt(data.delay, 0),
    obs: normText(data.obs, 240),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collPath('debts'), payload);
  state.debts.push({ id: ref.id, ...payload });
}

export async function actionUpdateDebt(id, data = {}) {
  const debt = state.debts.find((d) => d.id === id);
  if (!debt) throw new Error('Dívida não encontrada.');

  const name = normText(data.name, 120);
  if (!name) throw new Error('Informe o credor.');

  const payload = {
    name,
    type: normText(data.type, 60) || 'Outro',
    total: normMoney(data.total),
    monthly: normMoney(data.monthly),
    rate: normMoney(data.rate),
    parcels: normInt(data.parcels, 0),
    status: ['em_dia', 'atrasada', 'negociando'].includes(data.status) ? data.status : 'em_dia',
    delay: normInt(data.delay, 0),
    obs: normText(data.obs, 240),
    paid: Boolean(data.paid),
    updatedAt: serverTimestamp()
  };

  await updateDoc(itemPath('debts', id), payload);
  Object.assign(debt, payload);
}

export async function actionDeleteDebt(id) {
  await deleteDoc(itemPath('debts', id));
  state.debts = state.debts.filter((d) => d.id !== id);
}

export async function actionTogglePaid(id) {
  const debt = state.debts.find((d) => d.id === id);
  if (!debt) return;
  const paid = !Boolean(debt.paid);
  await updateDoc(itemPath('debts', id), { paid, updatedAt: serverTimestamp() });
  debt.paid = paid;
}

export async function actionAddExpense(data = {}) {
  const name = normText(data.name, 120);
  if (!name) throw new Error('Informe a descrição.');
  const payload = {
    name,
    cat: normText(data.cat, 40) || 'outro',
    val: normMoney(data.val),
    person: normText(data.person, 80),
    obs: normText(data.obs, 240),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collPath('expenses'), payload);
  state.expenses.push({ id: ref.id, ...payload });
}

export async function actionUpdateExpense(id, data = {}) {
  const expense = state.expenses.find((e) => e.id === id);
  if (!expense) throw new Error('Gasto não encontrado.');

  const name = normText(data.name, 120);
  if (!name) throw new Error('Informe a descrição.');

  const payload = {
    name,
    cat: normText(data.cat, 40) || 'outro',
    val: normMoney(data.val),
    person: normText(data.person, 80),
    obs: normText(data.obs, 240),
    updatedAt: serverTimestamp()
  };

  await updateDoc(itemPath('expenses', id), payload);
  Object.assign(expense, payload);
}

export async function actionDeleteExpense(id) {
  await deleteDoc(itemPath('expenses', id));
  state.expenses = state.expenses.filter((e) => e.id !== id);
}

export async function actionAddFGTS(data = {}) {
  const bank = normText(data.bank, 100);
  if (!bank) throw new Error('Informe a instituição.');
  const yearNow = new Date().getFullYear();
  const payload = {
    bank,
    val: normMoney(data.val),
    fgts: normMoney(data.fgts),
    rate: normMoney(data.rate),
    year: normInt(data.year, yearNow),
    years: Math.max(1, normInt(data.years, 5)),
    obs: normText(data.obs, 240),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collPath('fgts'), payload);
  state.fgts.push({ id: ref.id, ...payload });
}

export async function actionDeleteFGTS(id) {
  await deleteDoc(itemPath('fgts', id));
  state.fgts = state.fgts.filter((f) => f.id !== id);
}

export async function actionAddGoal(data = {}) {
  const name = normText(data.name, 120);
  if (!name) throw new Error('Informe o nome da meta.');
  const target = normMoney(data.target);
  if (target <= 0) throw new Error('Valor alvo da meta deve ser maior que zero.');
  const payload = {
    name,
    icon: normText(data.icon, 10) || '🎯',
    target,
    saved: normMoney(data.saved),
    monthly: normMoney(data.monthly),
    prio: ['alta', 'media', 'baixa'].includes(data.prio) ? data.prio : 'media',
    desc: normText(data.desc, 280),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collPath('goals'), payload);
  state.goals.push({ id: ref.id, ...payload });
}

export async function actionDeleteGoal(id) {
  await deleteDoc(itemPath('goals', id));
  state.goals = state.goals.filter((g) => g.id !== id);
}

export async function handleLogin() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    toast('Erro no login. Tente novamente.', 'err');
    await logEvent('error', 'Falha no login', { code: err?.code, message: err?.message });
  }
}

export async function handleEmailLogin(email = '', password = '') {
  const cleanEmail = normText(email, 120).toLowerCase();
  if (!cleanEmail || !password) throw new Error('Informe e-mail e senha.');
  try {
    await signInWithEmailAndPassword(auth, cleanEmail, password);
  } catch (err) {
    await logEvent('error', 'Falha no login por e-mail', { code: err?.code, message: err?.message });
    throw new Error('Não foi possível entrar com e-mail e senha. Verifique os dados.');
  }
}

export async function handleEmailRegister(email = '', password = '') {
  const cleanEmail = normText(email, 120).toLowerCase();
  if (!cleanEmail || !password) throw new Error('Informe e-mail e senha.');
  if (String(password).length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
  try {
    await createUserWithEmailAndPassword(auth, cleanEmail, password);
  } catch (err) {
    await logEvent('error', 'Falha no cadastro por e-mail', { code: err?.code, message: err?.message });
    throw new Error('Não foi possível cadastrar com e-mail e senha.');
  }
}

export async function handlePasswordReset(email = '') {
  const cleanEmail = normText(email, 120).toLowerCase();
  if (!cleanEmail) throw new Error('Informe o e-mail para recuperação.');
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err) {
    await logEvent('error', 'Falha no reset de senha', { code: err?.code, message: err?.message });
    throw new Error('Não foi possível enviar e-mail de recuperação.');
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
      applyAdminNavVisibility();
      onOut?.();
      return;
    }

    try {
      await loadUserData(user);
      applyAdminNavVisibility();
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebarLayout);
} else {
  initSidebarLayout();
}
