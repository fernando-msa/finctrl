// ============================================================
// wizard.js — Onboarding multi-step (5 etapas)
// Etapas: Perfil → Dependentes → Dívidas → Gastos Fixos → Metas
// ============================================================

import { state, fmt, actionSaveProfile, actionAddDebt, actionAddExpense, actionAddGoal, toast } from './app.js';

let currentStep = 1;
const TOTAL_STEPS = 5;

// Dados coletados no wizard (antes de salvar)
const wiz = {
  profile:  {},
  debts:    [],
  expenses: [],
  goals:    [],
};

// ── STEP LABELS ──────────────────────────────────────────────
const STEP_LABELS = ['Perfil', 'Dependentes', 'Dívidas', 'Gastos', 'Metas'];

// ── OPEN / CLOSE ─────────────────────────────────────────────
export function openWizard() {
  currentStep = 1;
  wiz.profile  = {};
  wiz.debts    = [];
  wiz.expenses = [];
  wiz.goals    = [];

  let overlay = document.getElementById('wizard-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'wizard-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  renderWizard();
}

export function closeWizard() {
  const overlay = document.getElementById('wizard-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── MAIN RENDER ──────────────────────────────────────────────
function renderWizard() {
  const overlay = document.getElementById('wizard-overlay');
  overlay.innerHTML = `
    <div class="wizard-box">
      <div class="wizard-header">
        <span class="logo">Fin<em>Ctrl</em></span>
        <span style="font-size:0.75rem;color:#aaa;">Configuração inicial</span>
      </div>
      <div class="wiz-steps">
        ${STEP_LABELS.map((l,i) => `
          <div class="wiz-step-dot ${i+1 === currentStep ? 'active' : i+1 < currentStep ? 'done' : ''}">
            ${i+1 < currentStep ? '✓ ' : ''}${l}
          </div>`).join('')}
      </div>
      <div class="wizard-body" id="wiz-body">${renderStep()}</div>
      <div class="wizard-footer">
        <span class="wiz-progress">Etapa ${currentStep} de ${TOTAL_STEPS}</span>
        <div class="btn-row">
          ${currentStep > 1 ? `<button class="btn btn-outline" onclick="window._wizPrev()">← Voltar</button>` : ''}
          ${currentStep < TOTAL_STEPS
            ? `<button class="btn btn-dark" onclick="window._wizNext()">Próximo →</button>`
            : `<button class="btn btn-green" onclick="window._wizFinish()">✓ Concluir e Entrar</button>`
          }
          ${currentStep === 1 ? `<button class="btn btn-outline" onclick="window._wizSkip()" style="font-size:0.65rem;padding:0.4rem 0.7rem;">Pular tudo</button>` : ''}
        </div>
      </div>
    </div>`;

  // bind nav
  window._wizNext   = stepNext;
  window._wizPrev   = stepPrev;
  window._wizFinish = finish;
  window._wizSkip   = skipAll;
}

// ── STEP CONTENT ─────────────────────────────────────────────
function renderStep() {
  switch(currentStep) {
    case 1: return stepPerfil();
    case 2: return stepDependentes();
    case 3: return stepDividas();
    case 4: return stepGastos();
    case 5: return stepMetas();
    default: return '';
  }
}

// ── STEP 1: PERFIL ───────────────────────────────────────────
function stepPerfil() {
  const p = wiz.profile;
  return `
    <div class="wizard-title">👤 Seu perfil financeiro</div>
    <div class="wizard-sub">Essas informações são a base do seu painel. Você pode editar depois.</div>
    <div class="fgrid">
      <div class="fg fgrid-w2">
        <label>Seu nome (como quer ser chamado)</label>
        <input id="wp-name" type="text" placeholder="Fernando" value="${p.name||''}">
      </div>
      <div class="fg">
        <label>Renda líquida mensal (R$)</label>
        <input id="wp-income" type="number" placeholder="4500" value="${p.income||''}">
      </div>
      <div class="fg">
        <label>Reserva para emergência / mês (R$)</label>
        <input id="wp-emergency" type="number" placeholder="300" value="${p.emergency||''}">
      </div>
      <div class="fg">
        <label>Estado civil</label>
        <select id="wp-civil">
          <option ${p.civil==='solteiro'?'selected':''}>Solteiro(a)</option>
          <option ${p.civil==='casado'?'selected':''}>Casado(a)</option>
          <option ${p.civil==='divorciado'?'selected':''}>Divorciado(a)</option>
          <option ${p.civil==='outro'?'selected':''}>Outro</option>
        </select>
      </div>
      <div class="fg">
        <label>Situação de emprego</label>
        <select id="wp-job">
          <option ${p.job==='clt'?'selected':''}>CLT / Empregado</option>
          <option ${p.job==='servidor'?'selected':''}>Servidor público</option>
          <option ${p.job==='autonomo'?'selected':''}>Autônomo / Freelancer</option>
          <option ${p.job==='empresario'?'selected':''}>Empresário</option>
          <option ${p.job==='desempregado'?'selected':''}>Desempregado</option>
        </select>
      </div>
    </div>
    <div class="alert info" style="font-size:0.74rem;">
      💡 Seus dados ficam salvos com segurança no Firebase, vinculados à sua conta Google. Ninguém mais tem acesso.
    </div>`;
}

// ── STEP 2: DEPENDENTES ──────────────────────────────────────
function stepDependentes() {
  const deps = wiz.profile.dependents || [];
  return `
    <div class="wizard-title">👨‍👩‍👧 Dependentes e família</div>
    <div class="wizard-sub">Quem depende financeiramente de você? Isso personaliza o painel de pessoas.</div>
    <div class="fgrid" style="margin-bottom:0.5rem;">
      <div class="fg fgrid-w2">
        <label>Nome do dependente</label>
        <input id="wd-name" type="text" placeholder="Ex: Marcos, Salette, Sabrina">
      </div>
      <div class="fg">
        <label>Relação</label>
        <select id="wd-rel">
          <option>Filho(a)</option>
          <option>Cônjuge / Parceiro(a)</option>
          <option>Pai / Mãe</option>
          <option>Irmão / Irmã</option>
          <option>Outro</option>
        </select>
      </div>
    </div>
    <button class="btn btn-dark" style="margin-bottom:1rem;" onclick="window._wizAddDep()">+ Adicionar</button>
    <div class="wiz-mini-list" id="dep-list">
      ${deps.length === 0 ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhum dependente adicionado ainda.</div>'
        : deps.map((d,i) => `
          <div class="wiz-mini-item">
            <span>👤 <strong>${d.name}</strong> — ${d.rel}</span>
            <button class="ib" onclick="window._wizRemDep(${i})">✕</button>
          </div>`).join('')}
    </div>`;
}

// ── STEP 3: DÍVIDAS ──────────────────────────────────────────
function stepDividas() {
  return `
    <div class="wizard-title">💳 Suas dívidas e empréstimos</div>
    <div class="wizard-sub">Cadastre cada dívida. Você também pode adicionar depois no painel.</div>
    <div class="fgrid">
      <div class="fg fgrid-w2"><label>Credor / Nome</label><input id="wdbt-name" type="text" placeholder="Ex: Banco Pan, Nubank"></div>
      <div class="fg">
        <label>Tipo</label>
        <select id="wdbt-type">
          <option>Empréstimo pessoal</option><option>Consignado</option>
          <option>Cartão de crédito</option><option>Cheque especial</option>
          <option>Financiamento</option><option>Conta em atraso</option><option>Outro</option>
        </select>
      </div>
      <div class="fg"><label>Total (R$)</label><input id="wdbt-total" type="number" placeholder="5000"></div>
      <div class="fg"><label>Parcela/mês (R$)</label><input id="wdbt-monthly" type="number" placeholder="500"></div>
      <div class="fg"><label>Juros/mês (%)</label><input id="wdbt-rate" type="number" placeholder="3.5" step="0.1"></div>
      <div class="fg"><label>Parcelas restantes</label><input id="wdbt-parcels" type="number" placeholder="12"></div>
      <div class="fg">
        <label>Status</label>
        <select id="wdbt-status">
          <option value="em_dia">Em dia</option>
          <option value="atrasada">Atrasada</option>
          <option value="negociando">Negociando</option>
        </select>
      </div>
      <div class="fg"><label>Meses em atraso</label><input id="wdbt-delay" type="number" placeholder="0" value="0"></div>
    </div>
    <button class="btn btn-dark" style="margin-bottom:1rem;" onclick="window._wizAddDebt()">+ Adicionar dívida</button>
    <div class="wiz-mini-list" id="debt-wiz-list">
      ${wiz.debts.length === 0 ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhuma dívida adicionada ainda.</div>'
        : wiz.debts.map((d,i) => `
          <div class="wiz-mini-item">
            <span><strong>${d.name}</strong> — ${fmt(d.total)} · ${d.type}</span>
            <button class="ib" onclick="window._wizRemDebt(${i})">✕</button>
          </div>`).join('')}
    </div>`;
}

// ── STEP 4: GASTOS FIXOS ─────────────────────────────────────
function stepGastos() {
  return `
    <div class="wizard-title">📋 Gastos fixos mensais</div>
    <div class="wizard-sub">Aluguel, colégios, faculdades, planos de saúde… tudo que paga todo mês.</div>
    <div class="fgrid">
      <div class="fg fgrid-w2"><label>Descrição</label><input id="wg-name" type="text" placeholder="Ex: Aluguel, Colégio Marcos"></div>
      <div class="fg">
        <label>Categoria</label>
        <select id="wg-cat">
          <option value="moradia">🏠 Moradia</option>
          <option value="educacao_filho">🎒 Ed. Filho</option>
          <option value="educacao_propria">🎓 Ed. Própria</option>
          <option value="saude">🏥 Saúde</option>
          <option value="transporte">🚗 Transporte</option>
          <option value="alimentacao">🛒 Alimentação</option>
          <option value="utilidades">💡 Utilidades</option>
          <option value="outro">📋 Outro</option>
        </select>
      </div>
      <div class="fg"><label>Valor/mês (R$)</label><input id="wg-val" type="number" placeholder="800"></div>
      <div class="fg"><label>Pessoa (opcional)</label><input id="wg-person" type="text" placeholder="Marcos, Salette..."></div>
    </div>
    <button class="btn btn-dark" style="margin-bottom:1rem;" onclick="window._wizAddExp()">+ Adicionar gasto</button>
    <div class="wiz-mini-list" id="exp-wiz-list">
      ${wiz.expenses.length === 0 ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhum gasto adicionado ainda.</div>'
        : wiz.expenses.map((e,i) => `
          <div class="wiz-mini-item">
            <span><strong>${e.name}</strong>${e.person?' ('+e.person+')':''} — ${fmt(e.val)}/mês</span>
            <button class="ib" onclick="window._wizRemExp(${i})">✕</button>
          </div>`).join('')}
    </div>`;
}

// ── STEP 5: METAS ────────────────────────────────────────────
const GOAL_ICONS = ['🎯','💰','🏠','✈️','🚗','📚','🏥','👶','💍','🛡️'];
function stepMetas() {
  return `
    <div class="wizard-title">🎯 Suas metas financeiras</div>
    <div class="wizard-sub">O que você quer conquistar depois de quitar as dívidas? Defina objetivos para se motivar.</div>
    <div class="fgrid">
      <div class="fg fgrid-w2"><label>Nome da meta</label><input id="wm-name" type="text" placeholder="Ex: Reserva de emergência, Viagem, Carro"></div>
      <div class="fg">
        <label>Ícone</label>
        <select id="wm-icon">${GOAL_ICONS.map(i=>`<option>${i}</option>`).join('')}</select>
      </div>
      <div class="fg"><label>Valor alvo (R$)</label><input id="wm-target" type="number" placeholder="10000"></div>
      <div class="fg"><label>Valor já guardado (R$)</label><input id="wm-saved" type="number" placeholder="0"></div>
      <div class="fg">
        <label>Prioridade</label>
        <select id="wm-prio">
          <option value="alta">🔴 Alta</option>
          <option value="media">🟡 Média</option>
          <option value="baixa">🟢 Baixa</option>
        </select>
      </div>
      <div class="fg fgrid-w2"><label>Descrição (opcional)</label><input id="wm-desc" type="text" placeholder="Guardar 3x o salário de emergência"></div>
    </div>
    <button class="btn btn-dark" style="margin-bottom:1rem;" onclick="window._wizAddGoal()">+ Adicionar meta</button>
    <div class="wiz-mini-list" id="goal-wiz-list">
      ${wiz.goals.length === 0 ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhuma meta adicionada ainda.</div>'
        : wiz.goals.map((g,i) => `
          <div class="wiz-mini-item">
            <span>${g.icon} <strong>${g.name}</strong> — ${fmt(g.target)}</span>
            <button class="ib" onclick="window._wizRemGoal(${i})">✕</button>
          </div>`).join('')}
    </div>
    <div class="alert ok" style="margin-top:1rem;font-size:0.74rem;">
      ✅ Tudo pronto! Clique em <strong>Concluir</strong> para salvar tudo e entrar no painel.
    </div>`;
}

// ── STEP ACTIONS ─────────────────────────────────────────────
function collectStep1() {
  wiz.profile.name      = document.getElementById('wp-name')?.value.trim() || '';
  wiz.profile.income    = parseFloat(document.getElementById('wp-income')?.value) || 0;
  wiz.profile.emergency = parseFloat(document.getElementById('wp-emergency')?.value) || 0;
  wiz.profile.civil     = document.getElementById('wp-civil')?.value || '';
  wiz.profile.job       = document.getElementById('wp-job')?.value || '';
  if (!wiz.profile.dependents) wiz.profile.dependents = [];
}

window._wizAddDep = function() {
  const name = document.getElementById('wd-name')?.value.trim();
  const rel  = document.getElementById('wd-rel')?.value;
  if (!name) return;
  if (!wiz.profile.dependents) wiz.profile.dependents = [];
  wiz.profile.dependents.push({ name, rel });
  document.getElementById('wd-name').value = '';
  document.getElementById('dep-list').innerHTML = renderDepList();
};
window._wizRemDep = function(i) {
  wiz.profile.dependents.splice(i,1);
  document.getElementById('dep-list').innerHTML = renderDepList();
};
function renderDepList() {
  const deps = wiz.profile.dependents || [];
  return deps.length === 0
    ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhum dependente adicionado ainda.</div>'
    : deps.map((d,i) => `<div class="wiz-mini-item"><span>👤 <strong>${d.name}</strong> — ${d.rel}</span><button class="ib" onclick="window._wizRemDep(${i})">✕</button></div>`).join('');
}

window._wizAddDebt = function() {
  const name = document.getElementById('wdbt-name')?.value.trim();
  if (!name) return;
  wiz.debts.push({
    name, paid: false,
    type:    document.getElementById('wdbt-type').value,
    total:   parseFloat(document.getElementById('wdbt-total').value)||0,
    monthly: parseFloat(document.getElementById('wdbt-monthly').value)||0,
    rate:    parseFloat(document.getElementById('wdbt-rate').value)||0,
    parcels: parseInt(document.getElementById('wdbt-parcels').value)||0,
    status:  document.getElementById('wdbt-status').value,
    delay:   parseInt(document.getElementById('wdbt-delay').value)||0,
  });
  ['wdbt-name','wdbt-total','wdbt-monthly','wdbt-rate','wdbt-parcels','wdbt-delay'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('debt-wiz-list').innerHTML = renderDebtWizList();
};
window._wizRemDebt = function(i) {
  wiz.debts.splice(i,1);
  document.getElementById('debt-wiz-list').innerHTML = renderDebtWizList();
};
function renderDebtWizList() {
  return wiz.debts.length === 0
    ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhuma dívida adicionada ainda.</div>'
    : wiz.debts.map((d,i)=>`<div class="wiz-mini-item"><span><strong>${d.name}</strong> — ${fmt(d.total)} · ${d.type}</span><button class="ib" onclick="window._wizRemDebt(${i})">✕</button></div>`).join('');
}

window._wizAddExp = function() {
  const name = document.getElementById('wg-name')?.value.trim();
  if (!name) return;
  wiz.expenses.push({
    name,
    cat:    document.getElementById('wg-cat').value,
    val:    parseFloat(document.getElementById('wg-val').value)||0,
    person: document.getElementById('wg-person').value.trim(),
  });
  ['wg-name','wg-val','wg-person'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('exp-wiz-list').innerHTML = renderExpWizList();
};
window._wizRemExp = function(i) {
  wiz.expenses.splice(i,1);
  document.getElementById('exp-wiz-list').innerHTML = renderExpWizList();
};
function renderExpWizList() {
  return wiz.expenses.length === 0
    ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhum gasto adicionado ainda.</div>'
    : wiz.expenses.map((e,i)=>`<div class="wiz-mini-item"><span><strong>${e.name}</strong>${e.person?' ('+e.person+')':''} — ${fmt(e.val)}/mês</span><button class="ib" onclick="window._wizRemExp(${i})">✕</button></div>`).join('');
}

window._wizAddGoal = function() {
  const name = document.getElementById('wm-name')?.value.trim();
  if (!name) return;
  wiz.goals.push({
    name,
    icon:   document.getElementById('wm-icon').value,
    target: parseFloat(document.getElementById('wm-target').value)||0,
    saved:  parseFloat(document.getElementById('wm-saved').value)||0,
    prio:   document.getElementById('wm-prio').value,
    desc:   document.getElementById('wm-desc').value.trim(),
  });
  ['wm-name','wm-target','wm-saved','wm-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('goal-wiz-list').innerHTML = renderGoalWizList();
};
window._wizRemGoal = function(i) {
  wiz.goals.splice(i,1);
  document.getElementById('goal-wiz-list').innerHTML = renderGoalWizList();
};
function renderGoalWizList() {
  return wiz.goals.length === 0
    ? '<div style="color:var(--muted);font-size:0.78rem;">Nenhuma meta adicionada ainda.</div>'
    : wiz.goals.map((g,i)=>`<div class="wiz-mini-item"><span>${g.icon} <strong>${g.name}</strong> — ${fmt(g.target)}</span><button class="ib" onclick="window._wizRemGoal(${i})">✕</button></div>`).join('');
}

// ── NAVIGATION ───────────────────────────────────────────────
function stepNext() {
  if (currentStep === 1) collectStep1();
  currentStep++;
  renderWizard();
}
function stepPrev() {
  currentStep--;
  renderWizard();
}
function skipAll() {
  closeWizard();
}

// ── FINISH ───────────────────────────────────────────────────
async function finish() {
  const btn = document.querySelector('.btn-green');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }
  try {
    const u = state.user;
    if (!u) throw new Error('Sem usuário autenticado');

    // Mark onboarding done
    wiz.profile.onboardingDone = true;
    await actionSaveProfile(wiz.profile);

    // Save all debts, expenses, goals in parallel
    await Promise.all([
      ...wiz.debts.map(d => actionAddDebt(d)),
      ...wiz.expenses.map(e => actionAddExpense(e)),
      ...wiz.goals.map(g => actionAddGoal(g)),
    ]);

    closeWizard();
    toast('✅ Perfil configurado com sucesso!', 'ok');

    // Trigger re-render of main app
    window.dispatchEvent(new CustomEvent('fincrtl:ready'));
  } catch(e) {
    toast('Erro ao salvar: ' + e.message, 'danger');
    if (btn) { btn.disabled = false; btn.textContent = '✓ Concluir e Entrar'; }
  }
}
