# FinCtrl — Guia de Configuração Completa

## Estrutura do Projeto

```
fincrtl/
├── index.html              ← Página principal (Visão Geral + Login)
├── app.js                  ← Compat legado (reexporta /js/app.js)
├── firebase.js             ← Compat legado (reexporta /js/firebase.js)
├── vercel.json             ← Configuração do Vercel
├── firestore.rules         ← Regras de segurança do Firebase
├── css/
│   └── style.css           ← Estilos globais
├── js/
│   ├── firebase.js         ← SDK Firebase + funções de banco
│   ├── app.js              ← Estado global + lógica
│   └── wizard.js           ← Wizard de onboarding (5 etapas)
└── pages/
    ├── dividas.html        ← Dívidas e empréstimos
    ├── gastos.html         ← Gastos fixos mensais
    ├── fgts.html           ← Contratos FGTS antecipado
    ├── metas.html          ← Metas financeiras
    ├── plano.html          ← Plano de ação (Avalanche / Bola de Neve)
    ├── diagnostico.html    ← Diagnóstico da conta (logs + estatísticas do usuário)
    └── admin.html          ← Painel técnico (restrito por e-mail)
```

> Observação: URLs legadas na raiz (`/dividas.html`, `/gastos.html`, etc.) redirecionam para `/pages/*`.

---

## PASSO 1 — Criar projeto no Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **Adicionar projeto** → dê um nome (ex: `fincrtl-prod`)
3. Desative o Google Analytics (opcional) → **Criar projeto**

### Ativar Authentication com Google

1. No menu lateral: **Build → Authentication**
2. Clique em **Começar**
3. Em **Provedores de login**, clique em **Google**
4. Ative → coloque seu e-mail de suporte → **Salvar**

### Criar banco Firestore

1. No menu lateral: **Build → Firestore Database**
2. **Criar banco de dados** → escolha **Modo de produção**
3. Selecione a região: `southamerica-east1` (São Paulo) ← mais próximo de Aracaju
4. **Concluir**

### Aplicar regras de segurança

1. No Firestore, vá em **Regras**
2. Substitua o conteúdo pelo que está em `firestore.rules`
3. **Publicar**

### Obter as credenciais do Firebase

1. No menu: **Configurações do projeto** (ícone de engrenagem)
2. Role até **Seus apps** → clique em `</>` (Web)
3. Registre o app (nome: `fincrtl-web`) → **Registrar**
4. Copie o objeto `firebaseConfig` que aparecer

---

## PASSO 2 — Configurar Firebase sem expor chave no repositório

Não coloque credenciais reais dentro de `js/firebase.js`.

1. Copie o arquivo de exemplo:
   ```bash
   cp js/firebase-config.example.js js/firebase-config.local.js
   ```
2. Preencha o `window.__FINCTRL_FIREBASE_CONFIG__` com os dados do seu projeto.
3. O arquivo `js/firebase-config.local.js` já está no `.gitignore` e **não deve ser commitado**.

> ⚠️ **Não publique neste README, issues ou PRs**: `serviceAccountKey.json`, tokens, webhooks, senhas ou qualquer segredo.
>
> O `firebaseConfig` do frontend não substitui regras de segurança: proteja acesso aos dados com `firestore.rules`.

### Firebase Admin (backend)

Também foi adicionado o arquivo `firebase-admin-init.example.cjs` com o bootstrap do Admin SDK para uso em backend Node.js.

> Importante: o Admin SDK **não deve** rodar no navegador.
> O arquivo `serviceAccountKey.json` precisa ficar fora do Git (ex: `./secrets/serviceAccountKey.json`).

### Banco de logs (para diagnóstico)

O app agora grava logs automaticamente no Firestore em:

- `logs/{autoId}` (visão geral do sistema)
- `users/{uid}/logs/{autoId}` (logs por usuário)

Campos gravados: `level`, `message`, `payload`, `uid`, `email`, `createdAt`, `userAgent`.

### Centralizar erros/feedback no Slack

Foi adicionada uma API serverless em `api/slack-log.js`, acionada automaticamente pelo app ao registrar logs.

1. Crie um **Incoming Webhook** no Slack do canal desejado.
2. No Vercel, configure a variável de ambiente:
   - `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...`
3. Faça novo deploy.

Pronto: erros e feedbacks enviados via `logEvent` passam a ser encaminhados para o Slack.

> Alternativa (sem webhook): use **Slack Bot Token** com:
> - `SLACK_BOT_TOKEN=xoxb-...`
> - `SLACK_CHANNEL_ID=C0123456789`
>
> O endpoint tenta webhook primeiro e, se falhar, usa bot token como fallback.

#### Se não chegar nada no Slack

1. Verifique se as variáveis estão no ambiente correto (Production/Preview):
   - `SLACK_WEBHOOK_URL` **ou**
   - `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID`
2. Faça novo deploy após salvar a variável.
3. Teste a saúde da rota: `GET /api/slack-log` deve retornar `{ ok: true }`.
4. Ao enviar feedback no app, se aparecer aviso de webhook ausente/falha, confira se o webhook não foi revogado no Slack.
5. Na página **Diagnóstico**, use os botões **Testar API Slack** e **Enviar teste Slack** para validar healthcheck e entrega.

---

## PASSO 3 — Deploy no Vercel

### Opção A — Via GitHub (recomendado)

1. Crie um repositório no GitHub e faça push de todos os arquivos
2. Acesse https://vercel.com → **New Project**
3. Importe o repositório → clique em **Deploy**
4. Pronto! O Vercel detecta automaticamente o projeto estático.

### Opção B — Via Vercel CLI

```bash
npm install -g vercel
cd fincrtl/
vercel login
vercel --prod
```

### Variáveis de ambiente recomendadas (Vercel)

- `SLACK_WEBHOOK_URL` → webhook de alertas operacionais no Slack.
- `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` → alternativa ao webhook para envio via `chat.postMessage`.

### Configurar domínio autorizado no Firebase

Depois do deploy, copie a URL do Vercel (ex: `fincrtl.vercel.app`) e adicione em:

**Firebase Console → Authentication → Settings → Domínios autorizados → Adicionar domínio**

Adicione:
- `fincrtl.vercel.app` (ou seu domínio personalizado)
- `localhost` (já deve estar lá — para desenvolvimento local)

---

## PASSO 4 — Teste local (opcional)

Para testar localmente antes do deploy, você precisa de um servidor HTTP
(não funciona com `file://` por causa do CORS do Firebase):

```bash
# Com Python (já vem instalado no Windows/Mac/Linux)
cd fincrtl/
python -m http.server 8080
# Acesse: http://localhost:8080

# Ou com Node.js
npx serve .
```

---

## Estrutura do Firestore (gerada automaticamente)

```
users/
  {uid}/                    ← documento do usuário
    name: "Fernando"
    income: 5500
    emergency: 300
    dependents: [{name, rel}]
    onboardingDone: true
    
    debts/                  ← subcoleção
      {id}: { name, type, total, monthly, rate, parcels, status, delay, paid, obs }
    
    expenses/               ← subcoleção
      {id}: { name, cat, val, person, obs }
    
    fgts/                   ← subcoleção
      {id}: { bank, val, fgts, rate, year, years, obs }
    
    goals/                  ← subcoleção
      {id}: { name, icon, target, saved, monthly, prio, desc }
```

---

## Funcionalidades

| Feature | Status |
|---|---|
| Login com Google | ✅ |
| Dados por usuário isolados | ✅ |
| Wizard de onboarding (5 etapas) | ✅ |
| Cadastro de dívidas/empréstimos | ✅ |
| Edição de dívidas e gastos | ✅ |
| Gastos fixos por categoria e pessoa | ✅ |
| FGTS antecipado (múltiplos contratos) | ✅ |
| Metas financeiras com progresso | ✅ |
| Plano Avalanche / Bola de Neve | ✅ |
| Diagnóstico da conta (usuário) | ✅ |
| Painel Admin técnico (restrito) | ✅ |
| Alertas automáticos de risco | ✅ |
| Recomendações personalizadas | ✅ |
| Reporte para suporte (Slack) | ✅ |
| Novidades/correções por versão | ✅ |
| Painel por dependente | ✅ |
| Fluxo de caixa visual | ✅ |
| Sincronização em nuvem (Firestore) | ✅ |
| Responsivo (mobile) | ✅ |

---

## Dúvidas frequentes

**O login não está funcionando:**
- Verifique se adicionou o domínio do Vercel nos domínios autorizados do Firebase
- Confirme que o Google Auth está ativado no Firebase Console

**Erro "Missing or insufficient permissions":**
- Verifique se as regras do Firestore foram aplicadas corretamente
- Confira se está logado antes de tentar ler/escrever

**Dados não aparecem após login:**
- O `onAuthStateChanged` pode demorar 1-2s para disparar — é normal
- Verifique se as credenciais em `firebase.js` estão corretas

---

## Boas práticas de segurança (público)

- Nunca comite segredos (webhooks, chaves privadas, service accounts, tokens).
- Não exponha e-mails pessoais/admin em documentação pública.
- Mantenha o acesso administrativo protegido por regras de backend, não apenas por ocultação no frontend.
- Revise periodicamente as regras do Firestore e os domínios autorizados no Firebase Auth.
