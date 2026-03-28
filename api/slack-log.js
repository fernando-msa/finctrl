const MAX_LEN = 280;

function sanitize(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) {
      res.status(202).json({ ok: true, skipped: 'missing_webhook' });
      return;
    }

    const body = req.body || {};
    const level = sanitize(body.level || 'info');
    const message = sanitize(body.message || 'Evento sem descrição');
    const email = sanitize(body.email || 'não informado');
    const uid = sanitize(body.uid || 'anônimo');
    const source = sanitize(body.projectId || 'fincrtl');
    const createdAt = sanitize(body.createdAt || new Date().toISOString());
    const payload = sanitize(JSON.stringify(body.payload || {}));

    const text = [
      `*FinCtrl • ${level.toUpperCase()}*`,
      `*Mensagem:* ${message}`,
      `*Usuário:* ${email} (${uid})`,
      `*Projeto:* ${source}`,
      `*Data:* ${createdAt}`,
      `*Payload:* \`${payload}\``
    ].join('\n');

    const slackResp = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!slackResp.ok) {
      const errTxt = await slackResp.text();
      res.status(502).json({ ok: false, error: 'slack_failed', details: errTxt.slice(0, 160) });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'internal_error', details: sanitize(err?.message || err) });
  }
};
