# Changelog

Todas as mudanças relevantes do FinCtrl devem ser registradas aqui para transparência com clientes.

Este projeto segue o padrão de versionamento semântico (`MAJOR.MINOR.PATCH`).

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
