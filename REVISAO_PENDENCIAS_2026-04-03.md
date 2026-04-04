# Revisão do projeto FinCtrl (atualizada em 04/04/2026)

## 1) Estado atual

O FinCtrl avançou na migração para App Router e já possui as rotas principais em Next.js.
Ainda assim, para virar uma plataforma pronta para operação comercial, faltam quatro blocos estratégicos:

1. **UX responsiva consistente** em todas as telas e componentes.
2. **CRUD completo** (inserção, edição e remoção) para despesas, dívidas, metas e FGTS.
3. **Onboarding guiado** para primeiro uso do cliente final.
4. **Versionamento público de produto** (changelog e notas por release).

## 2) Pendências priorizadas

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

## 3) Plano de execução sugerido (4 ciclos)

### Ciclo 1 (1–2 semanas) — Base comercial
- Entregar CRUD de despesas e dívidas.
- Ajustar feedbacks de erro na UI.
- Consolidar responsividade mobile/tablet.

### Ciclo 2 (1–2 semanas) — Completar núcleo financeiro
- Entregar CRUD de metas e FGTS.
- Revisar dashboard e plano com dados reais de ponta a ponta.

### Ciclo 3 (1 semana) — Onboarding e ativação
- Entregar tutorial guiado com checklist.
- Publicar guia de primeiro uso e fluxo de ativação.

### Ciclo 4 (contínuo) — Transparência e fidelização
- Formalizar changelog por versão.
- Publicar notas de release para clientes.
- Rodar rotina quinzenal de melhorias baseadas em uso.

## 4) Critério de pronto (recomendado)

Considerar o produto pronto para operação com cliente quando:

- CRUD completo funcionar para `expenses`, `debts`, `goals` e `fgts`.
- Layout estiver responsivo e validado em mobile/tablet/desktop.
- Onboarding de primeiro uso tiver taxa de conclusão monitorada.
- Cada release tiver changelog público e comunicado de novidades.
- Testes de regressão críticos passarem antes de deploy.
