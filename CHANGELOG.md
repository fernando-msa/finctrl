# Changelog

Todas as mudanças relevantes do FinCtrl devem ser registradas aqui para transparência com clientes.

Este projeto segue o padrão de versionamento semântico (`MAJOR.MINOR.PATCH`).

## [2.2.3](https://github.com/fernando-msa/finctrl/compare/finctrl-v2-v2.2.2...finctrl-v2-v2.2.3) (2026-04-04)


### Bug Fixes

* atualiza integrity de @next/env no lockfile para deploy ([c65faca](https://github.com/fernando-msa/finctrl/commit/c65facad4b60a991489fa1c4361999176cf5b845))
* correct context.params typing in expenses and debts route handlers ([83842b7](https://github.com/fernando-msa/finctrl/commit/83842b7ea2c12a3b31cd0fb0f17b706eb9fe3512))

## [2.2.2](https://github.com/fernando-msa/finctrl/compare/finctrl-v2-v2.2.1...finctrl-v2-v2.2.2) (2026-04-04)


### Bug Fixes

* remove insecure document methods in js views ([d5c5384](https://github.com/fernando-msa/finctrl/commit/d5c53844550e0633d5edbbca530bbeecfb6cbea7))

## [2.2.1](https://github.com/fernando-msa/finctrl/compare/finctrl-v2-v2.2.0...finctrl-v2-v2.2.1) (2026-04-04)


### Bug Fixes

* bump next to 16.0.11 for vuln remediation ([90e479a](https://github.com/fernando-msa/finctrl/commit/90e479a4ca44f93caf26fcba93e3f1bfa7026d69))
* bump Next.js to 16.0.11 to remediate vulnerability ([e3eb5c6](https://github.com/fernando-msa/finctrl/commit/e3eb5c6af8ced8425e522d6eb70e216a09660458))

## [2.2.0](https://github.com/fernando-msa/finctrl/compare/finctrl-v2-v2.1.0...finctrl-v2-v2.2.0) (2026-04-04)


### Features

* add charts/exports and harden firestore ownership rules ([44fd581](https://github.com/fernando-msa/finctrl/commit/44fd581d34b04295d4b36ee13c56fa7df2f0a660))
* dashboard charts & exports; enforce Firestore owner checks ([be82829](https://github.com/fernando-msa/finctrl/commit/be8282996481a371951e4cfcae9c789ab90437ab))
* inicia implantação com perfil no wizard, missões e score financeiro ([cbcf966](https://github.com/fernando-msa/finctrl/commit/cbcf9668e4e517d413c8c04566b04c35e8443db9))
* migra expenses da v2 para dados reais sem página estática ([46c706a](https://github.com/fernando-msa/finctrl/commit/46c706a2a50b822cb009547bfb413f03d57781be))
* migrar página de fgts para app router ([6fb053a](https://github.com/fernando-msa/finctrl/commit/6fb053a8c5b92b386883d9ac8897309c4694be4b))
* scaffold finctrl v2 nextjs architecture ([41d71ad](https://github.com/fernando-msa/finctrl/commit/41d71ad4d250a3dae425c694c28bc892e53c930f))
* scaffold FinCtrl v2 with Next.js App Router and Firebase server layer ([8e957ee](https://github.com/fernando-msa/finctrl/commit/8e957eeb2891634093169dbe1fcc618cb3e198a6))


### Bug Fixes

* adiciona stub firebase-config.local e hardening no boot do app ([1c7fea0](https://github.com/fernando-msa/finctrl/commit/1c7fea00d6e3f561b049a5c2e82c9092e4df060c))
* align v1.6 docs and ensure debt toggle complies with ownerUid rules ([dd15c93](https://github.com/fernando-msa/finctrl/commit/dd15c938adc014e7faa1af4b35a201b1b519e539))
* aplica fallback de config firebase web no login ([7ea45bc](https://github.com/fernando-msa/finctrl/commit/7ea45bce17b7546003c8c6a889dd359d60037bcc))
* aplica fallback de sessão quando admin sdk indisponível ([ce7fde4](https://github.com/fernando-msa/finctrl/commit/ce7fde486e0ca78be013a3479edfd93bec29f639))
* corrige divergência FinCrtl/FinCtrl na configuração Firebase ([06b0911](https://github.com/fernando-msa/finctrl/commit/06b0911e4c1c8f40b6e8e0abef87a040bb6dbe12))
* corrige ID do projeto Firebase para FinCtrl ([164e4df](https://github.com/fernando-msa/finctrl/commit/164e4df5b540ccbdc2431dc2ffd5371bf704da80))
* evitar crash do dashboard quando firestore/admin indisponível ([e0d5344](https://github.com/fernando-msa/finctrl/commit/e0d5344f2907954ebd98686fa3f929fe4d08dc5b))
* fallback legado quando firestore falhar em debts/expenses ([36d6cb5](https://github.com/fernando-msa/finctrl/commit/36d6cb5b3d6b3b62a77639f16f95ae3ba1d20703))
* habilitar fallback seguro de login via verificação JWKS ([99d61c9](https://github.com/fernando-msa/finctrl/commit/99d61c9c7ccdfd4863fe139a95482d13a7807572))
* limpar warnings e reduzir ruído de build nas rotas privadas ([092f461](https://github.com/fernando-msa/finctrl/commit/092f46123b55778b1266b5139bdc1ddaec8c2b3a))
* mostra erro de sessão no login e evita loop silencioso ([468ee00](https://github.com/fernando-msa/finctrl/commit/468ee00b84174729cb3cc5ad8f9c7c64aeace73c))
* **preview:** guard Vercel steps against missing secrets for fork PRs ([09329d5](https://github.com/fernando-msa/finctrl/commit/09329d5fea18a816ea1aa9acba254ed9cc3756e7))
* replace binary dashboard gif with svg preview asset ([7f5b00d](https://github.com/fernando-msa/finctrl/commit/7f5b00d063b05f33ade54efd56e8a3bfeecfd426))
* restaura import do app firebase para evitar ReferenceError ([6b21ce0](https://github.com/fernando-msa/finctrl/commit/6b21ce0ce485bd6db029f9dabbf7c476aa398d8d))

## [2.1.0] - 2026-04-04

### Added
- Páginas App Router para `goals`, `fgts`, `plan` e `diagnostics`.
- Página `Primeiros passos` com tutorial inicial para cliente.
- Repositórios para metas e FGTS no backend (`goals`, `fgts`).
- Fallback de sessão com verificação JWKS para ambientes sem Admin SDK.

### Changed
- Dashboard passou a usar agregações reais e fallback resiliente.
- Layout privado ganhou navegação mais amigável para mobile/tablet.
- Fluxos de erro das páginas internas passaram a redirecionar para `/dashboard` (evitando 404 legado).

### Fixed
- Erro de login em ambiente sem Admin SDK configurado.
- Erro 500 do dashboard em falha de leitura de dados.
- Warnings de lint e ruídos de build por renderização dinâmica.

## [2.0.0] - 2026-03-xx

### Added
- Base inicial FinCtrl v2 com App Router, autenticação e módulos financeiros.

## [1.1.0] - 2025-12-10

### Added
- Evolução do dashboard com indicadores consolidados e gráficos.
- Melhorias de UX para fluxo de metas e plano financeiro.

### Changed
- Ajustes de arquitetura para separar melhor camadas `features` e `server`.

## [1.0.0] - 2025-10-01

### Added
- Primeira release estável do FinCtrl com autenticação e módulos financeiros base.
- Estrutura inicial de testes automatizados (unitários e e2e).
