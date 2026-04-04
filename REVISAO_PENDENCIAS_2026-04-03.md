# Revisão do projeto FinCtrl (03/04/2026)

## Visão geral

O projeto já possui uma base funcional em Next.js com autenticação, área privada e integração inicial com Firebase.
No entanto, ainda existe uma transição incompleta entre o legado em páginas HTML estáticas e a nova arquitetura App Router.

## O que já está consistente

- Estrutura de módulos privados e públicos no App Router.
- Autenticação por cookie de sessão (`finctrl_session`) com proteção em layout privado.
- Repositórios de leitura para despesas e dívidas via Firestore Admin SDK.
- Build de produção concluindo com sucesso.

## Pendências identificadas

### P0 — Correções críticas de engenharia (fazer primeiro)

1. **Corrigir suíte de testes unitários (Vitest) com alias `@/` quebrado**
   - O teste `tests/unit/score.test.ts` importa `@/features/...`, mas o `vitest.config.ts` não resolve alias de `tsconfig`.
   - Resultado atual: `npm run test` falha antes de executar os testes.

2. **Corrigir script de lint (`npm run lint`)**
   - O comando atual (`next lint`) está falhando no ambiente com erro de diretório inválido (`/workspace/finctrl/lint`).
   - Necessário revisar comando e/ou migração para ESLint CLI conforme versão atual do Next.

3. **Remover fallback inseguro de sessão em produção**
   - Quando falha a criação de session cookie pelo Admin SDK, o endpoint faz fallback para usar `idToken` puro como cookie.
   - Isso pode mascarar erro de configuração e fragilizar o modelo de sessão no servidor.

### P1 — Completar migração funcional para v2

4. **Substituir resumo mockado do dashboard por dados reais**
   - `getDashboardSummary` retorna valores fixos e gráfico estático.

5. **Migrar páginas ainda redirecionadas ao legado (`/pages/*.html`)**
   - `goals`, `fgts`, `plan` e `diagnostics` ainda não têm telas v2 reais e redirecionam para HTML legado.
   - Isso fragmenta UX, dificulta testes e impede padronização de segurança/telemetria.

6. **Implementar CRUD completo para entidades financeiras**
   - Hoje há leitura de despesas e dívidas.
   - Ainda faltam operações de criação/edição/exclusão e módulos equivalentes para metas/FGTS.

### P2 — Robustez, DX e observabilidade

7. **Ajustar política de renderização dinâmica explícita para rotas autenticadas**
   - O build passa, mas durante geração estática aparecem avisos de uso dinâmico (`cookies`) em `/expenses` e `/debts`.
   - Vale explicitar estratégia (`force-dynamic`/cache) para evitar ruído operacional.

8. **Fortalecer validação de App Check**
   - Hoje a validação aceita apenas presença do header/token, sem verificação criptográfica.
   - Ideal: validação real via Admin SDK e tratamento padronizado de erro HTTP.

9. **Fechar lacunas de qualidade de dependências e CI**
   - Fixar versões-chave (evitar `next: latest` em produção).
   - Atualizar baseline-browser-mapping (aviso recorrente no build).
   - Formalizar pipeline mínimo: `typecheck + lint + test` como gate.

## Plano sugerido de execução (ordem)

1. **Sprint de estabilização técnica (rápida)**
   - Corrigir alias do Vitest.
   - Corrigir lint.
   - Remover fallback de sessão inseguro.

2. **Sprint de produto v2 (migração total)**
   - Implementar telas nativas para goals/fgts/plan/diagnostics.
   - Entregar CRUD completo com Server Actions/API routes.
   - Conectar dashboard a agregações reais.

3. **Sprint de hardening**
   - Reforçar App Check.
   - Organizar estratégia de renderização dinâmica.
   - Completar cobertura de testes unit/integration/e2e com browsers provisionados na CI.

## Critério de pronto recomendado

Considerar a v2 “pronta para operação” apenas quando:

- `npm run typecheck`, `npm run lint` e `npm run test` passarem sem ajustes manuais.
- Não houver redirecionamentos para páginas HTML legadas nas rotas principais.
- Dashboard, despesas, dívidas, metas e FGTS operarem com dados reais e fluxo CRUD completo.
- Segurança de sessão e App Check estiverem validadas de ponta a ponta.
