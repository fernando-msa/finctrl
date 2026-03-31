# FinCtrl — Melhorias e customizações alinhadas ao produto e ao mercado (2026)

Este guia foi revisado para ficar **mais prático e acionável**, conectando cada proposta às telas e componentes já existentes no FinCtrl.

## 1) Melhorias imediatas por tela do app

### 1.1 `index.html` + onboarding (`js/wizard.js`)
**Objetivo:** aumentar ativação na 1ª semana.

- Adicionar opção de perfil no onboarding: `quitar_dividas`, `organizar_familia`, `autonomo_renda_variavel`.
- Pré-configurar categorias e metas com base no perfil escolhido.
- Incluir “primeira vitória em 10 minutos”: ao concluir o wizard, gerar uma missão inicial automática.

**KPI principal:** taxa de onboarding concluído (meta: +20%).

### 1.2 Dívidas (`pages/dividas.html`)
**Objetivo:** reduzir inadimplência e acelerar quitação.

- Criar campo de vencimento por parcela e alerta de risco de atraso.
- Incluir “simular renegociação” (redução de taxa/prazo) com comparação visual.
- Sugerir automaticamente método Avalanche ou Bola de Neve com justificativa simples.

**KPI principal:** redução de dívidas em atraso (meta: -25% em 90 dias).

### 1.3 Gastos (`pages/gastos.html`)
**Objetivo:** elevar consciência de consumo e previsibilidade.

- Introduzir orçamento por envelope (50-30-20 como padrão, com personalização).
- Destacar variação mensal por categoria (verde/amarelo/vermelho).
- Adicionar regra “gasto anômalo” para categorias que subirem acima do histórico.

**KPI principal:** queda de gasto variável evitável (meta: -10% em 60 dias).

### 1.4 Metas (`pages/metas.html`)
**Objetivo:** aumentar retenção com senso de progresso.

- Implementar check-ins semanais de aporte com lembrete inteligente.
- Criar metas em “escada”: pequena, média e principal.
- Exibir previsão de conclusão com base no aporte médio real.

**KPI principal:** percentual de metas com aporte mensal (meta: +30%).

### 1.5 Plano (`pages/plano.html`)
**Objetivo:** transformar diagnóstico em ação recorrente.

- Inserir “Missões da Semana” com 3 tarefas de alto impacto.
- Mostrar impacto estimado por missão (ex.: “economia potencial R$ 180/mês”).
- Incluir histórico de missões concluídas para reforço comportamental.

**KPI principal:** retenção D30 (meta: +15%).

### 1.6 Diagnóstico (`pages/diagnostico.html`)
**Objetivo:** aumentar clareza e percepção de valor.

- Criar **Score de Saúde Financeira (0–100)** com subitens: fluxo de caixa, dívida/renda, reserva, consistência.
- Exibir “3 próximos passos” automáticos com prioridade.
- Comparar mês atual x mês anterior (tendência e direção).

**KPI principal:** usuários que retornam ao diagnóstico no mês (meta: +25%).

---

## 2) Tendências de mercado 2026 aplicadas ao FinCtrl

1. **Copiloto com IA orientado a decisão**
   - Não só chatbot: respostas ligadas aos dados reais do usuário e com ação sugerida.

2. **Personalização por momento de vida**
   - CLT, autônomo, família com dependentes, renda variável, recém-endividado.

3. **Experiência conversacional (WhatsApp-first)**
   - Resumo semanal e alertas por canal com maior abertura/engajamento.

4. **Monetização por resultado percebido**
   - Upgrade baseado em economia projetada e risco evitado.

5. **Educação contextual de micro-momentos**
   - Conteúdo curto no ponto de decisão (antes de parcelar, antes do vencimento, etc.).

---

## 3) Pacotes de customização (para segmentação comercial)

### Pacote Starter (gratuito)
- Cadastro manual de dívidas, gastos e metas.
- Diagnóstico básico e plano padrão.

### Pacote Pro
- Alertas preditivos e score completo.
- Missões semanais personalizadas.
- Simulador de renegociação e previsões.

### Pacote Família
- Múltiplos membros com permissões.
- Metas compartilhadas e visão por responsável.
- Timeline de alterações para transparência doméstica.

---

## 4) Backlog priorizado (impacto x esforço)

### Onda 1 — 0 a 8 semanas (rápido retorno)
1. Missões semanais no plano.
2. Score financeiro no diagnóstico.
3. Alertas de vencimento de dívida.
4. Perfis no onboarding.

### Onda 2 — 8 a 16 semanas
1. Orçamento por envelope.
2. Simulador de renegociação.
3. Insights de variação mensal por categoria.

### Onda 3 — 16 a 24 semanas
1. Copiloto IA com recomendações acionáveis.
2. Canal WhatsApp para lembretes e resumos.
3. Modo Família completo.

---

## 5) Instrumentação mínima recomendada

Para evitar roadmap “no escuro”, registrar eventos:

- `onboarding_completed`
- `first_debt_added`
- `first_goal_added`
- `weekly_mission_completed`
- `risk_alert_viewed`
- `plan_recommended_applied`
- `upgrade_prompt_seen`
- `upgrade_completed`

Com isso, o time consegue medir ativação, retenção e conversão de forma objetiva.

---

## 6) Recomendação final (sequência ideal)

Para o contexto atual do FinCtrl, a ordem mais segura é:

1. **Retenção e hábito:** missões + score + alertas.
2. **Eficiência financeira real:** renegociação + envelopes.
3. **Escala de receita:** IA + pacote Pro/Família + canal conversacional.

Essa sequência mantém execução simples, gera resultado percebido rápido e prepara monetização sem aumentar complexidade cedo demais.
