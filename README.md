# FinCtrl — Guia de Configuração Completa

## Estrutura do Projeto

```
fincrtl/
├── index.html              ← Página principal (Visão Geral + Login)
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
    └── admin.html          ← Painel técnico (logs + estatísticas)
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

## PASSO 2 — Configurar js/firebase.js

O projeto já está com as credenciais carregadas em `js/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDnqqfvrAJdEJFzDNjt4gohg6h63unL8g4",
  authDomain: "fincrtl-3e976.firebaseapp.com",
  projectId: "fincrtl-3e976",
  storageBucket: "fincrtl-3e976.firebasestorage.app",
  messagingSenderId: "1052094135775",
  appId: "1:1052094135775:web:d25f0dd40c5d992437186a",
  measurementId: "G-BLK1Q2494Z",
  databaseURL: "https://fincrtl-3e976-default-rtdb.firebaseio.com"
};
```

### Firebase Admin (backend)

Também foi adicionado o arquivo `firebase-admin-init.example.cjs` com o bootstrap do Admin SDK para uso em backend Node.js.

> Importante: o Admin SDK **não deve** rodar no navegador.
> O arquivo `serviceAccountKey.json` precisa ficar fora do Git (ex: `./secrets/serviceAccountKey.json`).

### Banco de logs (para diagnóstico)

O app agora grava logs automaticamente no Firestore em:

- `logs/{autoId}` (visão geral do sistema)
- `users/{uid}/logs/{autoId}` (logs por usuário)

Campos gravados: `level`, `message`, `payload`, `uid`, `email`, `createdAt`, `userAgent`.

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
| Gastos fixos por categoria e pessoa | ✅ |
| FGTS antecipado (múltiplos contratos) | ✅ |
| Metas financeiras com progresso | ✅ |
| Plano Avalanche / Bola de Neve | ✅ |
| Painel Admin técnico | ✅ |
| Alertas automáticos de risco | ✅ |
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
