const MAX_LEN = 280;

function sanitize(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, service: 'slack-log', now: new Date().toISOString() });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  try {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    const botToken = process.env.SLACK_BOT_TOKEN;
    const channelId = process.env.SLACK_CHANNEL_ID;

    const body = await getJsonBody(req);
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

    async function sendViaWebhook() {
      const slackResp = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!slackResp.ok) {
        const errTxt = await slackResp.text();
        throw new Error(`webhook_failed:${errTxt.slice(0, 160)}`);
      }
      return { ok: true, mode: 'webhook' };
    }

    async function sendViaBotToken() {
      const resp = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${botToken}`
        },
        body: JSON.stringify({
          channel: channelId,
          text
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(`bot_failed:${sanitize(data?.error || resp.statusText)}`);
      }
      return { ok: true, mode: 'bot_token' };
    }

    try {
      if (webhook) {
        const out = await sendViaWebhook();
        res.status(200).json({ ok: true, source: 'slack', mode: out.mode });
        return;
      }
      if (botToken && channelId) {
        const out = await sendViaBotToken();
        res.status(200).json({ ok: true, source: 'slack', mode: out.mode });
        return;
      }
      res.status(202).json({ ok: true, skipped: 'missing_slack_config' });
    } catch (errWebhook) {
      if (botToken && channelId) {
        try {
          const out = await sendViaBotToken();
          res.status(200).json({
            ok: true,
            source: 'slack',
            mode: out.mode,
            fallback: 'webhook_failed'
          });
          return;
        } catch (errBot) {
          res.status(502).json({
            ok: false,
            error: 'slack_failed',
            details: sanitize(`${errWebhook?.message || errWebhook} | ${errBot?.message || errBot}`),
            source: 'slack'
          });
          return;
        }
      }
      res.status(502).json({
        ok: false,
        error: 'slack_failed',
        details: sanitize(errWebhook?.message || errWebhook),
        source: 'slack'
      });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: 'internal_error', details: sanitize(err?.message || err) });
  }
};
