import {
  initAuth,
  state,
  fmt,
  getActiveDebts,
  getTotalDebt,
  getTotalMonthly,
  getTotalExp,
  getFreeAmount,
  getCommitPct,
  loadRecentLogs,
  actionSendFeedback,
  esc,
  toast,
  handleLogout as _out
} from '../app.js';

window.handleLogout = _out;

let logs = [];
let filter = 'all';

function normalizeDate(ts) {
  if (!ts) return '—';
  if (typeof ts?.toDate === 'function') return ts.toDate().toLocaleString('pt-BR');
  if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString('pt-BR');
  return '—';
}

function levelTag(level) {
  const lv = (level || '').toLowerCase();
  if (lv === 'error') return '<span class="tag tag-red">error</span>';
  if (lv === 'warn' || lv === 'warning') return '<span class="tag tag-yellow">warn</span>';
  return '<span class="tag tag-green">info</span>';
}

function safeJson(payload) {
  try {
    return JSON.stringify(payload || {});
  } catch {
    return '{}';
  }
}

function computeHealthScore() {
  const commitment = Math.max(0, Math.min(100, 100 - getCommitPct()));
  const freeAmount = getFreeAmount();
  const incomeBase = Number(state.profile?.income || 0);
  const freeRatio = incomeBase > 0 ? Math.max(0, Math.min(100, Math.round((Math.max(freeAmount, 0) / incomeBase) * 100 * 2.5))) : 0;
  const overdue = getActiveDebts().filter((d) => d.status === 'atrasada').length;
  const debtQuality = Math.max(0, 100 - (overdue * 25));
  const reserveRatio = incomeBase > 0 ? Math.max(0, Math.min(100, Math.round((Number(state.profile?.emergency || 0) / incomeBase) * 100 * 4))) : 0;

  const score = Math.round(
    (commitment * 0.35) +
    (freeRatio * 0.25) +
    (debtQuality * 0.25) +
    (reserveRatio * 0.15)
  );

  const nextSteps = [];
  if (freeAmount <= 0) nextSteps.push('Ajuste gastos fixos para recuperar sobra mensal positiva.');
  if (overdue > 0) nextSteps.push('Priorize regularização das dívidas atrasadas nesta semana.');
  if (getCommitPct() > 70) nextSteps.push('Negocie taxa/prazo para reduzir comprometimento de renda.');
  if (nextSteps.length < 3) nextSteps.push('Mantenha aportes mensais em meta prioritária para consistência.');
  if (nextSteps.length < 3) nextSteps.push('Revise o plano 2x por semana para não perder tração.');

  const label = score >= 70 ? 'Saudável' : score >= 40 ? 'Atenção' : 'Crítico';
  return { score, label, nextSteps: nextSteps.slice(0, 3) };
}

function renderHealthScore(health) {
  document.getElementById('health-score-box').innerHTML = `
    <div class="plan-item">
      <div class="plan-body">
        <h3>📈 Score de Saúde Financeira: <span class="go">${health.score}/100</span> · ${health.label}</h3>
        <p style="margin:.4rem 0 .6rem 0;">Próximos 3 passos recomendados:</p>
        <ol style="margin:.1rem 0 .3rem 1rem;line-height:1.6;">
          ${health.nextSteps.map((step) => `<li>${esc(step)}</li>`).join('')}
        </ol>
      </div>
    </div>
  `;
}

function renderStats() {
  const health = computeHealthScore();
  const cards = [
    { label: 'Usuário', val: esc(state.user?.email || '—'), sub: esc(state.user?.uid || '—'), cls: 'c-blue' },
    { label: 'Dívidas ativas', val: String(getActiveDebts().length), sub: fmt(getTotalDebt()), cls: 'c-red' },
    { label: 'Parcelas/mês', val: fmt(getTotalMonthly()), sub: `${getCommitPct()}% comprometimento`, cls: 'c-orange' },
    { label: 'Gastos fixos/mês', val: fmt(getTotalExp()), sub: `${state.expenses.length} gasto(s)`, cls: 'c-yellow' },
    { label: 'Sobra mensal', val: fmt(Math.max(getFreeAmount(), 0)), sub: getFreeAmount() < 0 ? 'Caixa negativo' : 'Situação atual', cls: getFreeAmount() < 0 ? 'c-red' : 'c-green' },
    { label: 'Logs carregados', val: String(logs.length), sub: 'Últimos registros', cls: 'c-purple' },
    { label: 'Score financeiro', val: `${health.score}/100`, sub: health.label, cls: health.score >= 70 ? 'c-green' : health.score >= 40 ? 'c-orange' : 'c-red' }
  ];

  document.getElementById('diag-cards').innerHTML = cards.map((c) => `
    <div class="s-card ${c.cls}">
      <div class="s-label">${c.label}</div>
      <div class="s-val" style="font-size:1.2rem;word-break:break-word;">${c.val}</div>
      <div class="s-sub">${c.sub}</div>
    </div>
  `).join('');

  renderHealthScore(health);
}

function renderLogs() {
  const rows = filter === 'all'
    ? logs
    : logs.filter((l) => (l.level || '').toLowerCase() === filter);

  const tbody = document.getElementById('logs-tbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">Nenhum log para esse filtro.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((l) => `
    <tr>
      <td>${normalizeDate(l.createdAt)}</td>
      <td>${levelTag(l.level)}</td>
      <td>${esc(l.message || '—')}</td>
      <td style="max-width:380px;white-space:pre-wrap;word-break:break-word;font-size:0.68rem;">${esc(safeJson(l.payload))}</td>
    </tr>
  `).join('');
}

function refreshFilterButtons() {
  ['all', 'error', 'info', 'warn'].forEach((id) => {
    const btn = document.getElementById(`f-${id}`);
    btn.className = `btn ${filter === id ? 'btn-dark' : 'btn-outline'}`;
  });
}

window.setFilter = (next) => {
  filter = next;
  refreshFilterButtons();
  renderLogs();
};

window.refreshLogs = async () => {
  try {
    logs = await loadRecentLogs(120);
    renderStats();
    renderLogs();
  } catch (err) {
    toast(`Erro ao carregar logs: ${err?.message || err}`, 'danger');
  }
};

window.testSlackHealth = async () => {
  const out = document.getElementById('slack-test-result');
  out.textContent = 'Testando /api/slack-log...';
  try {
    const resp = await fetch('/api/slack-log');
    const body = await resp.json();
    out.textContent = `Healthcheck: HTTP ${resp.status} · ${safeJson(body)}`;
    if (!resp.ok) toast('API Slack indisponível.', 'err');
  } catch (err) {
    out.textContent = `Falha no healthcheck: ${err?.message || err}`;
    toast('Falha ao testar API Slack.', 'err');
  }
};

window.testSlackSend = async () => {
  const out = document.getElementById('slack-test-result');
  out.textContent = 'Enviando mensagem de teste para Slack...';
  try {
    const result = await actionSendFeedback('teste manual via diagnóstico', {
      type: 'feedback',
      page: window.location.pathname,
      from: 'diagnostico'
    });
    out.textContent = `Envio: ${safeJson(result?.slack || {})}`;
    if (result?.slack?.ok) {
      toast('✅ Teste enviado ao Slack.', 'ok');
    } else {
      toast('⚠ Teste registrado, mas Slack não confirmou entrega.', 'err');
    }
    await window.refreshLogs();
  } catch (err) {
    out.textContent = `Falha no envio: ${err?.message || err}`;
    toast('Falha ao enviar teste para Slack.', 'err');
  }
};

initAuth(async (user) => {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'block';
  document.getElementById('user-name').textContent = state.profile?.name || user.displayName || '';
  document.getElementById('user-photo').src = user.photoURL || '';

  await window.refreshLogs();
  refreshFilterButtons();
}, () => {
  window.location.href = '../index.html';
});
