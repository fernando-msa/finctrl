# FinCtrl v2

Aplicação web de controle financeiro pessoal com autenticação segura, isolamento por usuário e arquitetura escalável usando Next.js + Firebase.

## Stack

- Next.js 16 (App Router)
- TypeScript strict
- Tailwind CSS
- Firebase Auth + Firestore + Admin SDK
- React Hook Form + Zod
- Recharts
- Vitest + Playwright

## Estrutura principal

```txt
app/
  (public)/
    landing/page.tsx
    login/page.tsx
  (app)/
    dashboard/page.tsx
    debts/page.tsx
    expenses/page.tsx
    goals/page.tsx
    fgts/page.tsx
    plan/page.tsx
    diagnostics/page.tsx
    settings/page.tsx
  api/
    auth/session/route.ts
    auth/logout/route.ts
    diagnostics/feedback/route.ts
    admin/health/route.ts
components/
features/
lib/firebase/
server/
types/
```

## Segurança adotada

- Session cookie `httpOnly` para sessão do Firebase Admin.
- Middleware protegendo rotas privadas.
- Validação de payload com Zod.
- Validação básica de App Check em endpoint sensível.
- Firestore Rules com isolamento por `request.auth.uid`.

## Rodando localmente

```bash
npm install
npm run dev
```

## Scripts úteis

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## Transparência de releases

- Histórico de mudanças para clientes: [`CHANGELOG.md`](./CHANGELOG.md)

## Roadmap sugerido

1. Implementar CRUD completo em `expenses`, `debts`, `goals` e `fgts` com Server Actions.
2. Substituir mocks do dashboard por agregações reais do Firestore.
3. Integrar Firebase Emulator Suite no fluxo local.
4. Completar cobertura de testes (unit, integração de regras e e2e completo).
