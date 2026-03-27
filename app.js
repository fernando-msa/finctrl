// ============================================================
// app.js — Estado global, helpers e motor de renderização
// ============================================================

import {
  loginGoogle, logout, onAuth, currentUser,
  getProfile, saveProfile,
  getDebts, addDebt, updateDebt, deleteDebt,
  getExpenses, addExpense, deleteExpense,
  getFGTS, addFGTS, deleteFGTS,
  getGoals, addGoal, deleteGoal
} from './firebase.js';

// ── STATE ────────────────────────────────────────────────────
export const state = {
  user:     null,
  profile:  null,
  debts:    [],
  expenses: [],
  fgts:     [],
  goals:    [],
  method:   'avalanche',
  loading:  false,
};

// ── FORMAT HELPERS ───────────────────────────────────────────
export function fmt(v) {
  return 'R$ ' + Number(v||0).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
export function pct(part, total) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
export function uid() { return state.user?.uid; }
export function income()    { return parseFloat(state.profile?.income  || 0); }
export function emergency() { return parseFloat(state.profile?.emergency || 0); }

// ── LOADING UI ───────────────────────────────────────────────
export function setLoading(on) {
  state.loading = on;
  const el = document.getElementById('loading-screen');
  if (el) el.style.display = on ? 'flex' : 'none';
}

// ── TOAST ────────────────────────────────────────────────────
export function toast(msg, type='ok') {
  const t = document.createElement('div');
  t.className = `alert ${type}`;
  t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;min-width:220px;max-width:360px;animation:slideUp 0.25s ease;';
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── AUTH FLOW ────────────────────────────────────────────────
export async function handleLogin() {
  try {
    setLoading(true);
    await loginGoogle();
  } catch(e) {
    toast('Erro ao fazer login: ' + e.message, 'danger');
    setLoading(false);
  }
}

export async function handleLogout() {
  if (!confirm('Sair da conta?')) return;
  await logout();
}

// ── LOAD USER DATA ───────────────────────────────────────────
export async function loadUserData(user) {
  state.user = user;
  setLoading(true);
  try {
    const [profile, debts, expenses, fgts, goals] = await Promise.all([
      getProfile(user.uid),
      getDebts(user.uid),
      getExpenses(user.uid),
      getFGTS(user.uid),
      getGoals(user.uid),
    ]);
    state.profile  = profile || {};
    state.debts    = debts;
    state.expenses = expenses;
    state.fgts     = fgts;
    state.goals    = goals;
  } catch(e) {
    toast('Erro ao carregar dados: ' + e.message, 'danger');
  } finally {
    setLoading(false);
  }
}

// ── DEBT ACTIONS ─────────────────────────────────────────────
export async function actionAddDebt(data) {
  const ref = await addDebt(uid(), data);
  state.debts.push({ id: ref.id, ...data });
}
export async function actionDeleteDebt(id) {
  await deleteDebt(uid(), id);
  state.debts = state.debts.filter(d => d.id !== id);
}
export async function actionTogglePaid(id) {
  const d = state.debts.find(x => x.id === id);
  if (!d) return;
  d.paid = !d.paid;
  await updateDebt(uid(), id, { paid: d.paid });
}

// ── EXPENSE ACTIONS ──────────────────────────────────────────
export async function actionAddExpense(data) {
  const ref = await addExpense(uid(), data);
  state.expenses.push({ id: ref.id, ...data });
}
export async function actionDeleteExpense(id) {
  await deleteExpense(uid(), id);
  state.expenses = state.expenses.filter(e => e.id !== id);
}

// ── FGTS ACTIONS ─────────────────────────────────────────────
export async function actionAddFGTS(data) {
  const ref = await addFGTS(uid(), data);
  state.fgts.push({ id: ref.id, ...data });
}
export async function actionDeleteFGTS(id) {
  await deleteFGTS(uid(), id);
  state.fgts = state.fgts.filter(f => f.id !== id);
}

// ── GOAL ACTIONS ─────────────────────────────────────────────
export async function actionAddGoal(data) {
  const ref = await addGoal(uid(), data);
  state.goals.push({ id: ref.id, ...data });
}
export async function actionDeleteGoal(id) {
  await deleteGoal(uid(), id);
  state.goals = state.goals.filter(g => g.id !== id);
}

// ── PROFILE SAVE ─────────────────────────────────────────────
export async function actionSaveProfile(data) {
  Object.assign(state.profile, data);
  await saveProfile(uid(), data);
}

// ── COMPUTED HELPERS ─────────────────────────────────────────
export function getActiveDebts() { return state.debts.filter(d => !d.paid); }
export function getTotalDebt()   { return getActiveDebts().reduce((s,d) => s+d.total, 0); }
export function getTotalMonthly(){ return getActiveDebts().reduce((s,d) => s+d.monthly, 0); }
export function getTotalExp()    { return state.expenses.reduce((s,e) => s+e.val, 0); }
export function getFreeAmount()  { return income() - emergency() - getTotalMonthly() - getTotalExp(); }
export function getCommitPct()   { return pct(getTotalMonthly() + getTotalExp(), income()); }

export function getSortedDebts() {
  const active    = getActiveDebts();
  const atrasadas = active.filter(d => d.status === 'atrasada');
  const normal    = active.filter(d => d.status !== 'atrasada');
  const sorted    = state.method === 'avalanche'
    ? normal.sort((a,b) => b.rate - a.rate)
    : normal.sort((a,b) => a.total - b.total);
  return [...atrasadas, ...sorted];
}

// ── PRIORITY ─────────────────────────────────────────────────
export function priority(d) {
  if (d.status === 'atrasada') return 'high';
  if (d.rate >= 8 || d.type === 'Cartão de crédito' || d.type === 'Cheque especial') return 'high';
  if (d.rate >= 3) return 'mid';
  return 'low';
}

// ── PEOPLE MAP ───────────────────────────────────────────────
export function getPeopleMap() {
  const map = {};
  state.expenses.forEach(e => {
    if (e.person) {
      if (!map[e.person]) map[e.person] = [];
      map[e.person].push(e);
    }
  });
  // Also include dependents from profile
  (state.profile?.dependents || []).forEach(name => {
    if (!map[name]) map[name] = [];
  });
  return map;
}

// ── CATEGORY LABELS ──────────────────────────────────────────
export const CAT_LABELS = {
  moradia:          '🏠 Moradia',
  educacao_filho:   '🎒 Ed. Filho',
  educacao_propria: '🎓 Ed. Própria',
  saude:            '🏥 Saúde',
  transporte:       '🚗 Transporte',
  alimentacao:      '🛒 Alimentação',
  utilidades:       '💡 Utilidades',
  outro:            '📋 Outro',
};

// ── INIT AUTH LISTENER ───────────────────────────────────────
export function initAuth(onLoggedIn, onLoggedOut) {
  onAuth(async (user) => {
    if (user) {
      await loadUserData(user);
      onLoggedIn(user);
    } else {
      state.user    = null;
      state.profile = null;
      state.debts   = [];
      onLoggedOut();
    }
  });
}
