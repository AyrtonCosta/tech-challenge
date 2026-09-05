# Tech Challenge — transações com antifraude

Dois processos NestJS e um dashboard Next.js. A criação grava a transação
como `pending` e publica `transaction.created` via outbox. O antifraude
(sem banco) aplica a regra (valor acima de 1000 rejeita) e publica
`transaction.status.updated`. O serviço de transações atualiza só se a
linha ainda estiver `PENDING`. A UI reflete a mudança com polling de 2s.

## Como subir

Requisitos: Node 22+ (`nvm use` lê o `.nvmrc`), pnpm 11.25.0, Docker.

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @tech-challenge/transactions db:deploy
pnpm --filter @tech-challenge/transactions db:seed
```

Três terminais:

```bash
pnpm --filter @tech-challenge/transactions start:dev
pnpm --filter @tech-challenge/anti-fraud start:dev
pnpm --filter @tech-challenge/web dev
```

| Serviço    | Endereço              |
| ---------- | --------------------- |
| Dashboard  | http://localhost:3000 |
| API        | http://localhost:3001 |
| Antifraude | http://localhost:3002 |
| Kafka UI   | http://localhost:8080 |
| Postgres   | localhost:5432        |

Suba o antifraude **antes** de criar transações neste processo: o consumer
group não relê o passado (`fromBeginning: false`).

## Como testar

```bash
pnpm quality
```

Lint, formatação, typecheck, testes e build. O mesmo comando roda no CI.

No browser: criar com valor `1500` (rejeitada) e `1000` (aprovada). A
listagem e o detalhe atualizam sem F5.

## O que ficou de fora

- Autenticação e multi-tenant
- DLQ formal e retry com backoff (payload inválido é logado e o offset avança)
- CDC / Debezium no lugar do poll do outbox
- Testes e2e; as regras e os estados de tela estão em unitários
- Cache, shard de banco e cursor na listagem — ver `DECISIONS.md`

As decisões (incluindo volume alto e estratégia de testes) estão em
[DECISIONS.md](./DECISIONS.md).
As práticas do desafio estão em [PRACTICES.md](./PRACTICES.md).
