# Revisão do projeto FinCtrl (atualizada em 04/04/2026)

## 1) Estado atual

O FinCtrl avançou na migração para App Router e já possui as rotas principais em Next.js.
Ainda assim, para virar uma plataforma pronta para operação comercial, faltam quatro blocos estratégicos:

1. **UX responsiva consistente** em todas as telas e componentes.
2. **CRUD completo** (inserção, edição e remoção) para despesas, dívidas, metas e FGTS.
3. **Onboarding guiado** para primeiro uso do cliente final.
4. **Versionamento público de produto** (changelog e notas por release).

## 2) Diagnóstico rápido das pendências (baseado no código atual)

### Evidências observadas

- As páginas de módulos estão focadas em leitura/listagem de dados.
- Os repositórios de dados existentes estão centrados em função `list*`.
- Ainda não há fluxo completo de CRUD exposto na UI para os quatro módulos.

### Impacto direto no produto

- O usuário consegue visualizar, mas ainda não conclui o ciclo de gestão financeira sem fricção.
- Falta robustez de UX para erros e estados vazios guiados.
- O produto ainda depende de evolução do onboarding para aumentar ativação e retenção.

## 3) Pendências priorizadas

### P0 — Produto mínimo vendável (foco imediato)

1. **CRUD completo por módulo**
   - `expenses`: criar/editar/excluir com validação.
   - `debts`: criar/editar/excluir com validação de taxas/status.
   - `goals`: criar/editar/excluir com progresso automático.
   - `fgts`: criar/editar/excluir contas e modalidade.

2. **Resiliência de erro por tela**
   - Exibir feedback amigável quando backend estiver indisponível.
   - Evitar redirecionamentos silenciosos que confundem o usuário.

3. **Onboarding de primeiro uso**
   - Tutorial em etapas com checklist de conclusão.
   - CTA direto para começar por despesas/dívidas.

### P1 — Confiabilidade e operação

4. **Versionamento de produto transparente**
   - Manter `CHANGELOG.md` com padrão semântico.
   - Publicar “Novidades da versão” para clientes a cada release.

5. **Métricas de uso e funil**
   - Acompanhar conclusão do onboarding.
   - Rastrear retenção semanal e uso por módulo.

6. **QA mais forte (além do básico atual)**
   - Cobrir fluxos de CRUD e autenticação com testes e2e.
   - Definir smoke tests mínimos por deploy.

### P2 — Diferenciais competitivos (mercado)

7. **Recursos adotados por apps financeiros modernos**
   - Metas com gamificação leve (streak, medalhas de consistência).
   - Alertas inteligentes (vencimentos, estourou orçamento, dívidas em atraso).
   - Insights automáticos por comportamento mensal.

8. **Plano premium futuro**
   - Simulações avançadas de quitação.
   - Compartilhamento de progresso e relatórios.
   - Recomendações com IA explicável.

## 4) Plano de sprints recomendado

O plano detalhado para execução está em **`SPRINTS_2026_Q2.md`**, com quatro sprints de duas semanas:

- Sprint 1: CRUD de despesas e dívidas.
- Sprint 2: CRUD de metas e FGTS + responsividade.
- Sprint 3: onboarding e ativação.
- Sprint 4: release management e qualidade contínua.

## 5) Critério de pronto (recomendado)

Considerar o produto pronto para operação com cliente quando:

- CRUD completo funcionar para `expenses`, `debts`, `goals` e `fgts`.
- Layout estiver responsivo e validado em mobile/tablet/desktop.
- Onboarding de primeiro uso tiver taxa de conclusão monitorada.
- Cada release tiver changelog público e comunicado de novidades.
- Testes de regressão críticos passarem antes de deploy.
