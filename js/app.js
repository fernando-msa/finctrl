import {
  auth,
  googleProvider,
  db,
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
const APP_VERSION = 'v1.5.0';
const RELEASE_NOTES = [
  {
    version: 'v1.5.0',
    date: '2026-03-29',
    notes: [
      'Canal de suporte com envio de feedback/erro para o Slack.',
      'Modal de novidades e correções por versão.',
      'Ajustes de UX na navegação lateral.'
    ]
  },
  {
    version: 'v1.4.0',
    date: '2026-03-28',
    notes: [
      'Login com e-mail/senha e recuperação de senha.',
      'Edição de dívidas e gastos.',
      'Recomendações personalizadas no painel.'
    ]
  }
];

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

  const slackResult = { ok: false, status: 0, skipped: 'not-called' };
  try {
    const tasks = [addDoc(collection(db, 'logs'), dbData)];
    if (state.user?.uid) {
      tasks.push(addDoc(collection(db, 'users', state.user.uid, 'logs'), dbData));
    }
    const slackTask = fetch('/api/slack-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    });
    await Promise.allSettled(tasks);
    const resp = await slackTask;
    slackResult.ok = resp.ok;
    slackResult.status = resp.status;
    try {
      slackResult.body = await resp.json();
      if (slackResult.body?.skipped) slackResult.skipped = slackResult.body.skipped;
    } catch {
      slackResult.body = null;
    }
    if (!resp.ok) {
      console.warn('[FinCtrl] Falha ao enviar log para Slack:', slackResult);
    }
  } catch (err) {
    slackResult.error = err?.message || String(err);
    console.warn('Falha ao gravar log no Firestore/Slack:', err?.message || err);
  }
  return { ok: true, slack: slackResult };
}

export async function actionSendFeedback(message = '', payload = {}) {
  const msg = normText(message, 240);
  if (!msg) throw new Error('Escreva um feedback antes de enviar.');
  return logEvent('feedback', msg, payload);
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

  const mobileQuery = window.matchMedia('(max-width: 860px)');

  nav.querySelectorAll('.nav-tab').forEach((tab) => {
    if (!tab.title) tab.title = tab.textContent?.trim() || 'Guia';
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sidebar-toggle';
  toggle.id = 'sidebar-toggle';
  const setToggleLabel = () => {
    if (mobileQuery.matches) {
      const isOpen = document.body.classList.contains('sidebar-mobile-open');
      toggle.textContent = isOpen ? '✕ Fechar menu' : '☰ Menu';
      toggle.title = isOpen ? 'Fechar menu' : 'Abrir menu';
      return;
    }
    const isCollapsed = document.body.classList.contains('sidebar-collapsed');
    toggle.textContent = isCollapsed ? '☰' : 'Ocultar menu';
    toggle.title = isCollapsed ? 'Mostrar menu lateral' : 'Ocultar menu lateral';
  };
  const applyDesktop = (collapsed) => {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    setToggleLabel();
  };
  const applyMobile = (open) => {
    document.body.classList.toggle('sidebar-mobile-open', open);
    setToggleLabel();
  };

  const storedDesktop = localStorage.getItem('fincrtl.sidebarCollapsed') === '1';
  const storedMobile = localStorage.getItem('fincrtl.sidebarMobileOpen') === '1';
  const syncLayout = () => {
    if (mobileQuery.matches) {
      document.body.classList.remove('sidebar-collapsed');
      applyMobile(storedMobile);
    } else {
      document.body.classList.remove('sidebar-mobile-open');
      applyDesktop(storedDesktop);
    }
  };

  syncLayout();
  mobileQuery.addEventListener('change', syncLayout);

  toggle.addEventListener('click', () => {
    if (mobileQuery.matches) {
      const open = !document.body.classList.contains('sidebar-mobile-open');
      applyMobile(open);
      localStorage.setItem('fincrtl.sidebarMobileOpen', open ? '1' : '0');
      return;
    }

    const collapsed = !document.body.classList.contains('sidebar-collapsed');
    applyDesktop(collapsed);
    localStorage.setItem('fincrtl.sidebarCollapsed', collapsed ? '1' : '0');
  });

  header.insertBefore(toggle, nav);
}

function renderSupportModal() {
  let modal = document.getElementById('support-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'support-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <h3 style="margin:.1rem 0;">Suporte · Feedback e Erros</h3>
          <div class="mini-note">Envie diretamente para o canal de suporte no Slack.</div>
        </div>
        <button class="icon-action" id="support-close" title="Fechar">✕</button>
      </div>
      <div class="fgrid" style="margin-top:.8rem;">
        <div class="fg">
          <label>Tipo</label>
          <select id="support-type">
            <option value="feedback">Sugestão / feedback</option>
            <option value="error">Erro / problema</option>
          </select>
        </div>
        <div class="fg">
          <label>Contato (opcional)</label>
          <input id="support-contact" type="text" placeholder="Seu e-mail ou @usuario">
        </div>
      </div>
      <div class="fg">
        <label>Mensagem</label>
        <textarea id="support-message" rows="4" placeholder="Descreva o problema ou sugestão..." style="resize:vertical;"></textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:.8rem;">
        <button class="btn btn-outline" id="support-cancel">Cancelar</button>
        <button class="btn btn-dark" id="support-send">Enviar ao suporte</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => { modal.style.display = 'none'; };
  modal.querySelector('#support-close').addEventListener('click', close);
  modal.querySelector('#support-cancel').addEventListener('click', close);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
  modal.querySelector('#support-send').addEventListener('click', async () => {
    const type = modal.querySelector('#support-type').value;
    const contact = normText(modal.querySelector('#support-contact').value, 120);
    const message = normText(modal.querySelector('#support-message').value, 240);
    if (!message) {
      toast('Escreva uma mensagem antes de enviar.', 'err');
      return;
    }
    try {
      const result = await actionSendFeedback(message, {
        type,
        contact,
        page: window.location.pathname,
        version: APP_VERSION
      });
      if (result?.slack?.ok) {
        toast('✅ Mensagem enviada ao suporte (Slack).', 'ok');
      } else if (['missing_webhook', 'missing_slack_config'].includes(result?.slack?.skipped)) {
        toast('⚠ Feedback salvo, mas configuração do Slack está ausente.', 'err');
      } else {
        toast('⚠ Feedback salvo no app, mas houve falha ao enviar ao Slack.', 'err');
      }
      modal.querySelector('#support-message').value = '';
      close();
    } catch (err) {
      toast(`Erro ao enviar: ${err?.message || err}`, 'err');
    }
  });

  return modal;
}

function renderReleaseModal() {
  let modal = document.getElementById('release-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'release-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <div>
          <h3 style="margin:.1rem 0;">Novidades e correções</h3>
          <div class="mini-note">Versão atual: ${APP_VERSION}</div>
        </div>
        <button class="icon-action" id="release-close" title="Fechar">✕</button>
      </div>
      <div id="release-list" style="margin-top:.85rem;display:grid;gap:.75rem;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#release-list').innerHTML = RELEASE_NOTES.map((item) => `
    <div style="border:1px solid #2f3340;border-radius:10px;padding:.65rem .75rem;">
      <div style="font-weight:700;">${item.version} <span class="mini-note">· ${item.date}</span></div>
      <ul style="margin:.5rem 0 .2rem;padding-left:1.1rem;">
        ${item.notes.map((n) => `<li style="margin:.2rem 0;">${esc(n)}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  const close = () => { modal.style.display = 'none'; };
  modal.querySelector('#release-close').addEventListener('click', close);
  modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
  return modal;
}

function initSupportWidgets() {
  const header = document.getElementById('app-header');
  const chip = header?.querySelector('.user-chip');
  if (!header || !chip || header.dataset.supportReady === '1') return;
  header.dataset.supportReady = '1';

  const supportBtn = document.createElement('button');
  supportBtn.type = 'button';
  supportBtn.className = 'icon-action';
  supportBtn.title = 'Reportar feedback/erro ao suporte';
  supportBtn.textContent = '🆘';
  supportBtn.addEventListener('click', () => {
    const modal = renderSupportModal();
    modal.style.display = 'flex';
  });

  const releaseBtn = document.createElement('button');
  releaseBtn.type = 'button';
  releaseBtn.className = 'icon-action';
  releaseBtn.title = 'Novidades e correções por versão';
  releaseBtn.textContent = '🆕';
  releaseBtn.addEventListener('click', () => {
    const modal = renderReleaseModal();
    modal.style.display = 'flex';
  });

  chip.insertBefore(releaseBtn, chip.firstChild);
  chip.insertBefore(supportBtn, chip.firstChild);
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
  document.addEventListener('DOMContentLoaded', () => {
    initSidebarLayout();
    initSupportWidgets();
  });
} else {
  initSidebarLayout();
  initSupportWidgets();
}
