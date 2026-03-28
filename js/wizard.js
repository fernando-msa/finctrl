import { state, actionSaveProfile, toast } from './app.js';

const ID = 'wizard-modal';
const TOTAL_STEPS = 5;
const wizardDraft = {
  income: 0,
  emergency: 0,
  essentials: 0,
  debtStress: 'alto',
  focus: 'equilibrio',
  method: 'avalanche'
};

const BRL = (value = 0) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

let currentStep = 1;

function ensureModal() {
  let modal = document.getElementById(ID);
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = ID;
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(0,0,0,0.65)';
  modal.style.display = 'none';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9998';
  modal.innerHTML = `
    <div style="width:min(640px,92vw);background:#101010;border:1.5px solid #343434;border-radius:12px;padding:20px;color:#f5f5f5;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <h3 style="margin:0">Configuração guiada (5 etapas)</h3>
        <div id="wiz-step" style="font-size:12px;color:#bdbdbd;">Etapa 1/5</div>
      </div>
      <p style="font-size:13px;color:#bdbdbd;margin-top:10px;">Preencha para receber um plano inicial mais aderente à sua realidade.</p>
      <div id="wiz-content" style="margin-top:10px;"></div>
      <div style="display:flex;justify-content:space-between;gap:8px;margin-top:14px;">
        <div style="display:flex;gap:8px;">
          <button id="wiz-close" style="padding:9px 12px;border-radius:8px;border:1px solid #4e4e4e;background:#222;color:#fff;">Depois</button>
          <button id="wiz-prev" style="padding:9px 12px;border-radius:8px;border:1px solid #4e4e4e;background:#222;color:#fff;display:none;">← Voltar</button>
        </div>
        <button id="wiz-next" style="padding:9px 12px;border-radius:8px;border:none;background:#c4960a;color:#101010;font-weight:700;">Próxima etapa →</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#wiz-close').addEventListener('click', closeWizard);
  modal.querySelector('#wiz-prev').addEventListener('click', () => {
    persistCurrentStep(modal);
    currentStep = Math.max(1, currentStep - 1);
    renderStep(modal);
  });
  modal.querySelector('#wiz-next').addEventListener('click', async () => {
    persistCurrentStep(modal);

    if (currentStep < TOTAL_STEPS) {
      currentStep += 1;
      renderStep(modal);
      return;
    }

    await actionSaveProfile({
      income: wizardDraft.income,
      emergency: wizardDraft.emergency,
      essentials: wizardDraft.essentials,
      debtStress: wizardDraft.debtStress,
      focus: wizardDraft.focus,
      method: wizardDraft.method,
      onboardingDone: true,
      name: state.profile?.name || ''
    });

    toast('Configuração inicial salva!', 'ok');
    closeWizard();
    window.dispatchEvent(new Event('fincrtl:ready'));
  });

  return modal;
}

function safeValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function persistCurrentStep(modal) {
  if (currentStep === 1) {
    wizardDraft.income = safeValue(modal.querySelector('#wiz-income')?.value, 0);
    wizardDraft.emergency = safeValue(modal.querySelector('#wiz-emergency')?.value, 0);
  }
  if (currentStep === 2) {
    wizardDraft.essentials = safeValue(modal.querySelector('#wiz-essentials')?.value, 0);
  }
  if (currentStep === 3) {
    wizardDraft.debtStress = modal.querySelector('input[name="wiz-debt-stress"]:checked')?.value || 'alto';
  }
  if (currentStep === 4) {
    wizardDraft.focus = modal.querySelector('input[name="wiz-focus"]:checked')?.value || 'equilibrio';
    wizardDraft.method = modal.querySelector('input[name="wiz-method"]:checked')?.value || 'avalanche';
  }
}

function summaryHtml() {
  const baseFree = wizardDraft.income - wizardDraft.essentials - wizardDraft.emergency;
  const urgency = baseFree <= 0 || wizardDraft.debtStress === 'alto';
  const methodName = wizardDraft.method === 'snowball' ? 'Bola de Neve' : 'Avalanche';
  const recommendations = [];

  if (urgency) recommendations.push('🔴 Priorize negociação de dívidas atrasadas e redução imediata de gastos variáveis.');
  if (!urgency) recommendations.push('🟢 Direcione a sobra mensal para amortizar dívidas com juros maiores.');
  if (wizardDraft.focus === 'quitar') recommendations.push('💳 Monte meta de quitação de curto prazo (30-90 dias).');
  if (wizardDraft.focus === 'cortar') recommendations.push('✂️ Defina teto por categoria de gasto (alimentação/transporte).');
  if (wizardDraft.focus === 'equilibrio') recommendations.push('⚖️ Combine renegociação + pequenos cortes + reserva mínima.');
  recommendations.push(`🧭 Método sugerido agora: ${methodName}.`);

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:#171717;border:1px solid #2a2a2a;border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:#bdbdbd;">Renda</div>
        <div style="font-weight:700;">${BRL(wizardDraft.income)}</div>
      </div>
      <div style="background:#171717;border:1px solid #2a2a2a;border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:#bdbdbd;">Compromissos essenciais</div>
        <div style="font-weight:700;">${BRL(wizardDraft.essentials)}</div>
      </div>
      <div style="background:#171717;border:1px solid #2a2a2a;border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:#bdbdbd;">Reserva mensal</div>
        <div style="font-weight:700;">${BRL(wizardDraft.emergency)}</div>
      </div>
      <div style="background:#171717;border:1px solid #2a2a2a;border-radius:10px;padding:12px;">
        <div style="font-size:12px;color:#bdbdbd;">Sobra estimada</div>
        <div style="font-weight:700;color:${baseFree <= 0 ? '#f26d6d' : '#94d3a2'};">${BRL(baseFree)}</div>
      </div>
    </div>
    <div style="margin-top:12px;background:#171717;border:1px solid #2a2a2a;border-radius:10px;padding:12px;">
      <div style="font-size:12px;color:#bdbdbd;margin-bottom:6px;">Plano recomendado</div>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">
        ${recommendations.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderStep(modal) {
  const content = modal.querySelector('#wiz-content');
  const stepLabel = modal.querySelector('#wiz-step');
  const prevBtn = modal.querySelector('#wiz-prev');
  const nextBtn = modal.querySelector('#wiz-next');

  stepLabel.textContent = `Etapa ${currentStep}/${TOTAL_STEPS}`;
  prevBtn.style.display = currentStep === 1 ? 'none' : '';
  nextBtn.textContent = currentStep === TOTAL_STEPS ? 'Salvar configuração' : 'Próxima etapa →';

  if (currentStep === 1) {
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;">Renda mensal
          <input id="wiz-income" type="number" min="0" step="0.01" value="${wizardDraft.income || ''}" style="padding:10px;border-radius:8px;border:1px solid #3f3f3f;background:#191919;color:#fff;" />
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;">Reserva emergência / mês
          <input id="wiz-emergency" type="number" min="0" step="0.01" value="${wizardDraft.emergency || ''}" style="padding:10px;border-radius:8px;border:1px solid #3f3f3f;background:#191919;color:#fff;" />
        </label>
      </div>
    `;
  }

  if (currentStep === 2) {
    content.innerHTML = `
      <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;">Total de gastos essenciais por mês (moradia, luz, água, alimentação básica)
        <input id="wiz-essentials" type="number" min="0" step="0.01" value="${wizardDraft.essentials || ''}" style="padding:10px;border-radius:8px;border:1px solid #3f3f3f;background:#191919;color:#fff;" />
      </label>
      <p style="font-size:12px;color:#bdbdbd;margin-top:8px;">Esse valor ajuda o app a estimar quanto você consegue direcionar para quitar dívidas.</p>
    `;
  }

  if (currentStep === 3) {
    content.innerHTML = `
      <div style="font-size:12px;color:#bdbdbd;margin-bottom:8px;">Hoje, como você percebe a pressão das dívidas?</div>
      <div style="display:grid;gap:8px;">
        ${[
    ['alto', 'Alta (já estou em atraso / cobrando muito)'],
    ['medio', 'Média (pago no limite do orçamento)'],
    ['baixo', 'Baixa (consigo manter em dia)']
  ].map(([value, label]) => `
          <label style="display:flex;gap:8px;align-items:center;background:#171717;padding:10px;border:1px solid #2a2a2a;border-radius:8px;">
            <input type="radio" name="wiz-debt-stress" value="${value}" ${wizardDraft.debtStress === value ? 'checked' : ''}>
            <span style="font-size:13px;">${label}</span>
          </label>`).join('')}
      </div>
    `;
  }

  if (currentStep === 4) {
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:12px;color:#bdbdbd;margin-bottom:8px;">Seu foco principal agora</div>
          <div style="display:grid;gap:8px;">
            ${[
    ['quitar', 'Quitar dívidas mais rápido'],
    ['cortar', 'Reduzir gastos do mês'],
    ['equilibrio', 'Equilibrar os dois']
  ].map(([value, label]) => `
              <label style="display:flex;gap:8px;align-items:center;background:#171717;padding:10px;border:1px solid #2a2a2a;border-radius:8px;">
                <input type="radio" name="wiz-focus" value="${value}" ${wizardDraft.focus === value ? 'checked' : ''}>
                <span style="font-size:13px;">${label}</span>
              </label>`).join('')}
          </div>
        </div>
        <div>
          <div style="font-size:12px;color:#bdbdbd;margin-bottom:8px;">Método de prioridade</div>
          <div style="display:grid;gap:8px;">
            ${[
    ['avalanche', 'Avalanche (maiores juros primeiro)'],
    ['snowball', 'Bola de Neve (menor saldo primeiro)']
  ].map(([value, label]) => `
              <label style="display:flex;gap:8px;align-items:center;background:#171717;padding:10px;border:1px solid #2a2a2a;border-radius:8px;">
                <input type="radio" name="wiz-method" value="${value}" ${wizardDraft.method === value ? 'checked' : ''}>
                <span style="font-size:13px;">${label}</span>
              </label>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (currentStep === 5) {
    content.innerHTML = summaryHtml();
  }
}

export function openWizard() {
  const modal = ensureModal();
  wizardDraft.income = safeValue(state.profile?.income, 0);
  wizardDraft.emergency = safeValue(state.profile?.emergency, 0);
  wizardDraft.essentials = safeValue(state.profile?.essentials, 0);
  wizardDraft.debtStress = state.profile?.debtStress || 'alto';
  wizardDraft.focus = state.profile?.focus || 'equilibrio';
  wizardDraft.method = state.profile?.method || 'avalanche';
  currentStep = 1;
  renderStep(modal);
  modal.style.display = 'flex';
}

export function closeWizard() {
  const modal = document.getElementById(ID);
  if (modal) modal.style.display = 'none';
}
