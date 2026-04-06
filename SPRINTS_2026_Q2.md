# Sprints de execução — FinCtrl (Q2 2026)

> Objetivo: transformar o FinCtrl em produto pronto para operação com clientes, com foco em entrega incremental semanal e revisão quinzenal de métricas.

## Cadência proposta

- **Modelo:** Sprints de 2 semanas.
- **Rituais fixos:**
  - Planejamento: segunda-feira (semana 1).
  - Daily assíncrona: status em bloco único (feito / em progresso / bloqueio).
  - Review + Retro: sexta-feira (semana 2).
- **Definição de pronto (DoD):**
  - Feature funcional no App Router.
  - Validações básicas de UX (erro, loading, vazio).
  - Testes mínimos passando (`npm run lint` + testes unitários/e2e relevantes).
  - Changelog atualizado para itens visíveis ao usuário.

---

## Sprint 1 — CRUD núcleo (Despesas + Dívidas)

**Meta:** sair de leitura para operação completa em despesas e dívidas.

### Escopo principal

1. **API/Server actions para despesas**
   - criar, editar e remover despesas;
   - validação de payload (campos obrigatórios, valor > 0, data válida).
2. **API/Server actions para dívidas**
   - criar, editar e remover dívidas;
   - validação de taxa, tipo de juros e status.
3. **UI de formulário e ações**
   - botão “Nova despesa” / “Nova dívida”;
   - modal ou página de edição;
   - confirmação para exclusão.
4. **Mensagens de erro amigáveis**
   - substituir redirecionamento silencioso por feedback de falha.

### Critérios de aceite

- Usuário autenticado consegue criar, editar e excluir despesas e dívidas.
- Fluxos inválidos retornam mensagem clara em tela.
- Lista atualiza após operação sem necessidade de refresh manual.

---

## Sprint 2 — CRUD complementar (Metas + FGTS) e responsividade

**Meta:** completar módulos financeiros centrais e padronizar experiência mobile.

### Escopo principal

1. **CRUD completo para metas**
   - criação/edição de meta com valor alvo e prazo;
   - cálculo de progresso atualizado automaticamente.
2. **CRUD completo para FGTS**
   - inclusão de conta/modalidade;
   - edição de saldo e eventos relevantes;
   - remoção com confirmação.
3. **Responsividade transversal**
   - tabelas com comportamento em telas pequenas;
   - ajustes de espaçamento/tipografia em dashboard, plano e módulos.

### Critérios de aceite

- Os quatro módulos (`expenses`, `debts`, `goals`, `fgts`) possuem CRUD completo.
- Experiência mobile/tablet sem quebra de layout nos fluxos principais.
- Lint e testes críticos do core financeiro passando.

---

## Sprint 3 — Onboarding e ativação

**Meta:** reduzir tempo para “primeiro valor” do usuário.

### Escopo principal

1. **Onboarding guiado em passos**
   - checklist com progresso;
   - próximos passos claros (cadastrar despesa e dívida).
2. **Estados de vazio orientativos**
   - CTA contextual em cada módulo.
3. **Medição de funil**
   - evento: onboarding iniciado;
   - evento: onboarding concluído;
   - evento: primeiro cadastro em despesas/dívidas.

### Critérios de aceite

- Usuário novo conclui onboarding em fluxo único.
- Métricas básicas de ativação disponíveis para acompanhamento semanal.

---

## Sprint 4 — Release management e qualidade contínua

**Meta:** criar rotina previsível de release com transparência para cliente.

### Escopo principal

1. **Processo de release**
   - consolidar changelog por versão;
   - template de “novidades da versão”.
2. **Gate mínimo de qualidade por deploy**
   - smoke e2e de autenticação e CRUD essencial;
   - checklist de release antes de produção.
3. **Backlog de melhorias orientado por uso**
   - revisão quinzenal de métricas;
   - priorização por impacto em retenção.

### Critérios de aceite

- Toda release publicada com nota de versão.
- Pipeline de validação mínima executado antes do deploy.

---

## Backlog inicial (pré-classificado)

### P0 (executar até fim da Sprint 2)

- CRUD de `expenses`, `debts`, `goals`, `fgts`.
- Erros amigáveis em todas as telas principais.
- Responsividade em dashboard, plano e módulos.

### P1 (Sprints 3 e 4)

- Onboarding com checklist e CTA.
- Eventos de funil e retenção semanal.
- Changelog público por release.

### P2 (após estabilização)

- Gamificação de metas.
- Alertas inteligentes financeiros.
- Simulações avançadas e recursos premium.
