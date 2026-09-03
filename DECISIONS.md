# Decisões de arquitetura

Registro das decisões estruturantes do projeto. Cada entrada traz a decisão,
as alternativas consideradas e o porquê da escolha.

## Organização do projeto

**Decisão:** monorepo pnpm com `apps/*` (processos) e `packages/*` (código compartilhado).

**Alternativas consideradas:**

- Um repositório por serviço (`transactions`, `anti-fraud`, `web`)
- Monorepo com Turborepo ou Nx

**Por quê:** os dois serviços precisam concordar sobre o formato dos eventos
Kafka. Com `packages/contracts` no mesmo repositório, uma mudança de schema
quebra o build do consumidor na hora — a consistência vira regra do
compilador, não acordo verbal. Repositórios separados exigiriam publicar um
pacote versionado a cada mudança de contrato; em 5 dias isso é cerimônia
desproporcional. Turborepo/Nx entram quando o grafo de build e o cache
remoto passam a doer; hoje o `pnpm -r` cobre o quality gate.

## Versões da stack

**Decisão:** pinagem explícita — NestJS 11.2.x, Prisma 7.10 (`prisma@prev`),
Next.js 16.3.x, TypeScript 6.0.3, pnpm 11.25.0. Sem ranges `^` nas
dependências de tooling da raiz.

**Alternativas consideradas:**

- Usar sempre `latest` (NestJS 12 ESM, Prisma 8 RC, TypeScript 7)
- Pinagem só nos frameworks e `^` no tooling

**Por quê:** na semana do desafio, NestJS 12 saiu ESM-first, `prisma@latest`
apontava para `8.0.0-rc.12` (release candidate) e o TypeScript 7.0.2 não era
aceito pelo peer do `typescript-eslint@8` (`typescript < 6.1.0`). Em prazo
curto, estabilidade e reprodutibilidade entre máquina local e CI pesam mais
do que estar no major de ontem. O `packageManager` + `--frozen-lockfile` no
CI fecham o circuito.
