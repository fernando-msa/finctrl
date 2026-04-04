import { initAuth, state, fmt, pct, esc, renderHtml, getFreeAmount, getSortedDebts, handleLogout as _out } from '../app.js';

window.handleLogout = _out;

let method = 'avalanche';
const missionKey = () => `fincrtl.missions.${state.user?.uid || 'anon'}`;

function getMissions() {
  const extra = Math.max(getFreeAmount(), 0);
  const topDebt = getSortedDebts()[0];
  const topGoal = state.goals.find((g) => g.prio === 'alta') || state.goals[0];
  const missions = [
    {
      id: 'review_plan',
      title: 'Revisar plano da semana',
      impact: 'Mantém foco e reduz decisões impulsivas.'
    },
    {
      id: 'first_win_10m',
      title: 'Primeira vitória em 10 minutos',
      impact: 'Escolha 1 gasto para cortar hoje e registre no app para ganhar tração.'
    }
  ];

  if (topDebt) {
    missions.push({
      id: `debt_${topDebt.id}`,
      title: `Aplicar sobra na dívida "${topDebt.name}"`,
      impact: extra > 0 ? `Impacto estimado: até ${fmt(extra)}/mês na dívida prioritária.` : 'Defina ao menos um valor extra para amortização.'
    });
  }

  if (topGoal) {
    missions.push({
      id: `goal_${topGoal.id}`,
      title: `Aportar na meta "${topGoal.name}"`,
      impact: 'Mantém consistência e melhora retenção do plano.'
    });
  }

  if (!missions[2]) {
    missions.push({
      id: 'cut_expense',
      title: 'Reduzir 1 gasto variável esta semana',
      impact: 'Pequenas reduções recorrentes liberam caixa no mês.'
    });
  }

  return missions.slice(0, 3);
}

function readMissionState() {
  try {
    return JSON.parse(localStorage.getItem(missionKey()) || '{}');
  } catch {
    return {};
  }
}

function writeMissionState(data) {
  localStorage.setItem(missionKey(), JSON.stringify(data));
}

function renderMissions() {
  const missions = getMissions();
  const doneMap = readMissionState();
  const doneCount = missions.filter((m) => doneMap[m.id]).length;
  const progress = pct(doneCount, missions.length);
  const items = missions.map((m) => `
    <label class="plan-item" style="display:flex;align-items:flex-start;gap:.65rem;cursor:pointer;">
      <input type="checkbox" data-mission-id="${m.id}" ${doneMap[m.id] ? 'checked' : ''} style="margin-top:.25rem;">
      <div class="plan-body">
        <h3 style="margin-bottom:.2rem;">${esc(m.title)}</h3>
        <p>${esc(m.impact)}</p>
      </div>
    </label>
  `).join('');

  renderHtml(document.getElementById('missions-box'), `
    <div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem;">${doneCount}/${missions.length} concluídas (${progress}%)</div>
    <div class="prog-bar" style="height:10px;margin-bottom:.85rem;"><div class="prog-fill" style="width:${progress}%;"></div></div>
    ${items}
  `);

  document.querySelectorAll('[data-mission-id]').forEach((input) => {
    input.addEventListener('change', (ev) => {
      const map = readMissionState();
      map[ev.target.dataset.missionId] = ev.target.checked;
      writeMissionState(map);
      renderMissions();
    });
  });
}

window.setMethod = (m) => {
  method = m;
  state.method = m;
  document.getElementById('m-av').className = `btn ${m === 'avalanche' ? 'btn-dark' : 'btn-outline'}`;
  document.getElementById('m-sn').className = `btn ${m === 'snowball' ? 'btn-dark' : 'btn-outline'}`;
  render();
};

function render() {
  const me = document.getElementById('method-box');
  renderHtml(me, method === 'avalanche'
    ? '🔥 <strong>Avalanche</strong> — Pague o mínimo em todas e coloque qualquer sobra na dívida com <strong>maior juros</strong>. Economiza mais dinheiro no longo prazo.'
    : '⛄ <strong>Bola de Neve</strong> — Pague o mínimo em todas e coloque qualquer sobra na dívida com <strong>menor saldo</strong>. Gera motivação com quitações rápidas.');

  const extra = Math.max(getFreeAmount(), 0);
  const ordered = getSortedDebts();

  const pl = document.getElementById('plan-list');
  if (!ordered.length) {
    renderHtml(pl, '<div class="alert ok"><strong>🎉 Parabéns!</strong> Nenhuma dívida ativa no momento!</div>');
  } else {
    renderHtml(pl, ordered.map((d, i) => {
      const isFirst = i === 0;
      const ef = d.monthly + (isFirst ? extra : 0);
      const months = ef > 0 ? Math.ceil(d.total / ef) : '?';
      const urgNote = d.status === 'atrasada' ? ' <span class="tag tag-red">URGENTE</span>' : '';
      const fineNote = d.status === 'atrasada' && d.delay ? ` · multa estimada: <span class="hi">${fmt(d.total * 0.02 * d.delay)}</span>` : '';
      const extraNote = isFirst && extra > 0
        ? `<br>→ Coloque <strong class="go">${fmt(extra)}/mês de sobra</strong> aqui além da parcela mínima.`
        : '';
      return `<div class="plan-item">
        <div class="plan-num">0${i + 1}</div>
        <div class="plan-body">
          <h3>${esc(d.name)}${urgNote}</h3>
          <p>Saldo: <strong>${fmt(d.total)}</strong>${fineNote} · Parcela mínima: ${fmt(d.monthly)} · Juros: ${d.rate || '—'}%/mês
          ${extraNote}
          <br>Previsão de quitação: <span class="go">~${months} meses</span></p>
        </div>
      </div>`;
    }).join(''));
  }

  const total = state.debts.reduce((s, d) => s + d.total, 0);
  const paidTotal = state.debts.filter((d) => d.paid).reduce((s, d) => s + d.total, 0);
  const p = pct(paidTotal, total);
  renderHtml(document.getElementById('progress-box'), `
    <div style="font-size:0.78rem;color:var(--muted);margin-bottom:0.5rem;">${p}% quitado — ${fmt(paidTotal)} de ${fmt(total)}</div>
    <div class="prog-bar" style="height:14px;"><div class="prog-fill" style="width:${p}%;"></div></div>`);

  let cumMonths = 0;
  const phases = ordered.map((d, i) => {
    const ef = d.monthly + (i === 0 ? extra : 0);
    const m = ef > 0 ? Math.ceil(d.total / ef) : 0;
    cumMonths += m;
    return `<div class="plan-item" style="padding:0.75rem 1rem;">
      <div class="plan-num" style="font-size:1.4rem;min-width:36px;">F${i + 1}</div>
      <div class="plan-body">
        <h3>${esc(d.name)} — <span class="go">~${m} meses</span></h3>
        <p>Acumulado: <strong>~${cumMonths} meses</strong> do início · Libera ${fmt(d.monthly)}/mês após quitação.</p>
      </div>
    </div>`;
  }).join('');
  renderHtml(document.getElementById('phases-box'), phases || '<div class="empty">Cadastre dívidas para ver o cronograma.</div>');

  const tips = [];
  const highRate = ordered.filter((d) => d.rate >= 8);
  if (highRate.length) tips.push(`⚡ <strong>Refinancie urgente:</strong> ${highRate.map((d) => `${esc(d.name)}(${d.rate}%/mês)`).join(', ')}. Tente portabilidade de crédito para banco público ou fintech com taxa menor.`);
  if (extra > 0) tips.push(`💰 Você tem <strong>${fmt(extra)}/mês de sobra</strong>. Cada real extra na dívida prioritária reduz significativamente o prazo total.`);
  if (state.fgts.length > 1) tips.push(`🏦 <strong>${state.fgts.length} contratos FGTS antecipados.</strong> Avalie o custo total x benefício — se as taxas forem baixas, use o capital para quitar dívidas caras.`);
  tips.push('🤝 <strong>Negociação:</strong> Dívidas com 2-3 meses de atraso ainda têm boa margem de desconto (40-60%). Acesse o Serasa Limpa Nome ou negocie diretamente antes de completar 90 dias.');
  tips.push('📅 <strong>Estratégia em 4 fases:</strong> 1) Regularize atrasadas → 2) Elimine juros altos → 3) Amortize empréstimos → 4) Construa reserva e metas.');

  if (state.goals.length) {
    const top = state.goals.find((g) => g.prio === 'alta');
    if (top) tips.push(`🎯 <strong>Meta prioritária:</strong> "${esc(top.name)}" — R$ ${fmt(top.target)}. Ao quitar a 1ª dívida, redirecione a parcela liberada para essa meta.`);
  }

  renderHtml(document.getElementById('tips-box'), tips
    .map((t) => `<div class="plan-item"><div class="plan-body"><p>${t}</p></div></div>`)
    .join(''));

  renderMissions();
}

initAuth((user) => {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'block';
  document.getElementById('user-name').textContent = state.profile?.name || user.displayName || '';
  document.getElementById('user-photo').src = user.photoURL || '';
  render();
}, () => {
  window.location.href = '../index.html';
});
