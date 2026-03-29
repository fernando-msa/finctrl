# Sobre o FinCtrl

O **FinCtrl** é uma aplicação web de organização financeira pessoal, com foco em simplicidade, visual limpo e acompanhamento prático da saúde financeira do usuário.

## Objetivo

Ajudar pessoas e famílias a:
- entender sua situação financeira atual;
- registrar dívidas, gastos fixos e metas;
- acompanhar evolução mensal;
- tomar decisões com base em dados claros.

## Principais tópicos do projeto

### 1) Autenticação e segurança
- Login com Google e com e-mail/senha via Firebase Authentication.
- Isolamento de dados por usuário no Firestore.
- Regras de segurança em `firestore.rules`.

### 2) Onboarding financeiro
- Wizard inicial para coleta de informações essenciais.
- Cadastro de renda, reserva de emergência e dependentes.

### 3) Gestão de dívidas
- Registro de dívidas/empréstimos com parcelas, taxa e status.
- Edição, exclusão e marcação de pagamento.
- Base para estratégias Avalanche e Bola de Neve.

### 4) Gastos fixos
- Cadastro de despesas recorrentes por categoria e responsável.
- Visão consolidada para melhorar planejamento mensal.

### 5) FGTS antecipado
- Controle de contratos de antecipação de FGTS.
- Registro de banco, valores, taxas e período.

### 6) Metas financeiras
- Metas com valor alvo, valor guardado e prioridade.
- Acompanhamento de progresso em percentual.

### 7) Plano de ação
- Recomendações práticas a partir dos dados do usuário.
- Apoio para priorização de pagamentos e organização.

### 8) Diagnóstico e observabilidade
- Página de diagnóstico com estatísticas e logs.
- Registro de eventos no Firestore (`logs` globais e por usuário).
- Integração com Slack para feedbacks e alertas operacionais.

### 9) Administração técnica
- Painel administrativo com acesso controlado por e-mail.
- Recursos para suporte e monitoramento do ambiente.

## Estrutura resumida

- `index.html`: entrada principal (visão geral + login).
- `js/app.js`: estado global e regras de negócio.
- `js/firebase.js`: inicialização e conexões Firebase.
- `pages/`: páginas funcionais (dívidas, gastos, metas, plano, diagnóstico, admin).
- `api/slack-log.js`: endpoint serverless para encaminhar logs ao Slack.

## Público-alvo

- Pessoas que desejam sair do descontrole financeiro.
- Famílias que precisam organizar orçamento de forma colaborativa.
- Usuários que querem clareza sobre dívidas e metas.

## Diferenciais

- Interface objetiva e em português (pt-BR).
- Fluxo guiado para reduzir atrito no primeiro uso.
- Diagnóstico operacional para facilitar suporte técnico.
- Arquitetura simples para deploy rápido (Vercel + Firebase).

## Próximos tópicos sugeridos (roadmap)

- Relatórios mensais em PDF.
- Alertas inteligentes por meta e por vencimento de dívida.
- Painel com comparativo histórico (mês a mês).
- Exportação/importação de dados do usuário.
- Personalização avançada de categorias e etiquetas.
