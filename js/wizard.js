import { state, actionSaveProfile, toast } from './app.js';

const ID = 'wizard-modal';

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
    <div style="width:min(560px,92vw);background:#101010;border:1.5px solid #343434;border-radius:12px;padding:20px;color:#f5f5f5;">
      <h3 style="margin-top:0">Configuração inicial</h3>
      <p style="font-size:13px;color:#bdbdbd">Complete os campos para liberar o painel.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;">Renda mensal
          <input id="wiz-income" type="number" min="0" step="0.01" style="padding:10px;border-radius:8px;border:1px solid #3f3f3f;background:#191919;color:#fff;" />
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;">Reserva emergência
          <input id="wiz-emergency" type="number" min="0" step="0.01" style="padding:10px;border-radius:8px;border:1px solid #3f3f3f;background:#191919;color:#fff;" />
        </label>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
        <button id="wiz-close" style="padding:9px 12px;border-radius:8px;border:1px solid #4e4e4e;background:#222;color:#fff;">Depois</button>
        <button id="wiz-save" style="padding:9px 12px;border-radius:8px;border:none;background:#c4960a;color:#101010;font-weight:700;">Salvar e continuar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#wiz-close').addEventListener('click', closeWizard);
  modal.querySelector('#wiz-save').addEventListener('click', async () => {
    const income = Number(modal.querySelector('#wiz-income').value || 0);
    const emergency = Number(modal.querySelector('#wiz-emergency').value || 0);

    await actionSaveProfile({
      income,
      emergency,
      onboardingDone: true,
      name: state.profile?.name || ''
    });

    toast('Configuração inicial salva!', 'ok');
    closeWizard();
    window.dispatchEvent(new Event('fincrtl:ready'));
  });

  return modal;
}

export function openWizard() {
  const modal = ensureModal();
  modal.style.display = 'flex';
  modal.querySelector('#wiz-income').value = state.profile?.income || '';
  modal.querySelector('#wiz-emergency').value = state.profile?.emergency || '';
}

export function closeWizard() {
  const modal = document.getElementById(ID);
  if (modal) modal.style.display = 'none';
}
