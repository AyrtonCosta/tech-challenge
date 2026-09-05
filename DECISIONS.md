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

**Decisão:** pinagem explícita — NestJS 11.2.x, Prisma 7.10.0 em versão exata
(família inteira: `prisma`, `@prisma/client`, `@prisma/adapter-pg`),
Next.js 16.3.x, TypeScript 6.0.3, pnpm 11.25.0. Sem ranges `^` nas
dependências de tooling da raiz nem na família Prisma.

**Alternativas consideradas:**

- Usar sempre `latest` (NestJS 12 ESM, Prisma 8 RC, TypeScript 7)
- Pinagem só nos frameworks e `^` no tooling
- Instalar pela dist-tag (`prisma@prev`) em vez de versão literal

**Por quê:** na semana do desafio, NestJS 12 saiu ESM-first, `prisma@latest`
apontava para `8.0.0-rc.12` (release candidate) e o TypeScript 7.0.2 não era
aceito pelo peer do `typescript-eslint@8` (`typescript < 6.1.0`). Em prazo
curto, estabilidade e reprodutibilidade entre máquina local e CI pesam mais
do que estar no major de ontem. O `packageManager` + `--frozen-lockfile` no
CI fecham o circuito.

Instalar por dist-tag mostrou-se a pior das opções, e o projeto pagou por
isso: `prisma@prev` resolvia para 7.10.0 enquanto `@prisma/client@prev`
resolvia para 6.19.3 — a mesma tag aponta para majors diferentes em pacotes
diferentes do mesmo produto. A CLI 7 rodou a migration sem reclamar e o
desalinhamento só apareceria na primeira query. Daí a regra: pacotes que
compartilham ciclo de release são pinados na mesma versão literal.

## Acesso ao banco com Prisma 7

**Decisão:** generator `prisma-client` com `output` para `src/generated/prisma`,
driver adapter `@prisma/adapter-pg` injetado no `PrismaClient`, e o client
gerado no `postinstall` em vez de versionado.

**Alternativas consideradas:**

- Ficar no Prisma 6 com `prisma-client-js` gerando dentro de `node_modules`
- Versionar o client gerado no Git para dispensar o `postinstall`
- Gerar fora de `src` e apontar via alias de caminho

**Por quê:** o Prisma 7 removeu o query engine em Rust, então o adapter deixou
de ser preview e passou a ser obrigatório — `new PrismaClient()` sem adapter
lança em runtime. Como o adapter vive no código da aplicação e não na config,
a URL de conexão entra por injeção de dependência (`ConfigService`), o que
torna o `PrismaService` testável sem variável de ambiente. Ficar no 6 era
viável, mas seria escolher deliberadamente o major anterior no início do
projeto e pagar a migração depois.

Gerar dentro de `src` mantém o client no mesmo programa do TypeScript, então
`tsc` e o `nest build` o enxergam sem alias nem `paths` — configuração a menos
para dar errado. Em troca, o diretório precisa ser ignorado por Git, ESLint,
Prettier e cobertura de testes. Versionar o gerado foi descartado porque são
milhares de linhas derivadas do schema: poluiriam todo diff de migration e
poderiam divergir silenciosamente do `schema.prisma`. O `postinstall` garante
que qualquer clone — máquina nova ou runner de CI — tenha o client antes do
primeiro `typecheck`.

Um detalhe de configuração que custou tempo e vale registrar: o client gerado
importa com extensão `.js` (correto para `moduleResolution: NodeNext`), mas o
resolver do Jest não converte `.js` em `.ts`. Sem o `moduleNameMapper`
`^(\.{1,2}/.*)\.js$` → `$1`, toda suíte que toca o Prisma falha ao carregar.

## Modelagem de dados

**Decisão:** `transaction_types` como tabela de referência, `transactions` com
UUID v7 como chave primária e identificador público ao mesmo tempo, `status`
como enum do Postgres, `value` como `DECIMAL(18,2)`, datas em `TIMESTAMPTZ` e
nomes em snake_case plural via `@@map`/`@map`.

**Alternativas consideradas:**

- Tipo de transferência como enum, junto com o status
- Dois identificadores: chave primária interna e `transaction_external_id` público
- UUID v4 ou `bigserial` como chave primária
- `value` como `float`/`double` ou como inteiro de centavos
- `TIMESTAMP` sem fuso, o padrão do Prisma
- Manter os nomes PascalCase/camelCase que o Prisma gera por padrão

**Por quê — tipo é tabela, status é enum:** os dois parecem a mesma coisa e
não são. O status é um estado do domínio: são exatamente três, o código faz
`switch` em cima deles e um valor novo significa mudar regra de negócio. Enum
do banco dá integridade sem join e falha na escrita se alguém inventar um
quarto valor. Já o tipo de transferência é catálogo: nasce com três linhas,
cresce por decisão de produto, o contrato o expõe como `transferTypeId`
numérico e a listagem filtra por ele. Adicionar um tipo tem que ser `INSERT`,
não migration — e a chave estrangeira já rejeita `transferTypeId` inexistente,
que era a validação que a criação precisava.

**Por quê — um identificador só:** manter chave interna e externa separadas
existe para não vazar informação pela chave — com `bigserial`, o id conta
quantas transações o sistema tem e em que ordem nasceram. Isso não se aplica
aqui, porque a chave já é UUID: ela não é adivinhável nem revela cardinalidade.
Guardar duas colunas UUID por linha custaria 16 bytes e um índice único a mais
por transação para entregar a mesma garantia, além de forçar toda consulta a
decidir qual dos dois ids usar. O contrato continua chamando o campo de
`transactionExternalId` na resposta; a tradução acontece no DTO, não no banco.

**Por quê — UUID v7 e não v4:** os dois são opacos, mas o v7 tem prefixo de
timestamp, então valores próximos no tempo são próximos na ordenação. Numa
tabela que só recebe inserção, isso faz a escrita cair sempre na borda direita
do índice B-tree em vez de espalhar por páginas aleatórias — menos
fragmentação e menos I/O sob carga de escrita, que é justamente o cenário de
volume alto discutido no fim deste documento. O v4 daria a mesma opacidade com
pior localidade. `bigserial` teria a melhor localidade de todas, mas devolveria
o problema de vazamento de cardinalidade que o UUID resolve, e obrigaria a
segunda coluna descartada acima.

**Por quê — `DECIMAL` e não float:** dinheiro em ponto flutuante binário não
representa `0,1` exatamente, e a regra do desafio compara valor com 1000. Um
float transformaria a comparação de limite em loteria de arredondamento.
`DECIMAL(18,2)` é aritmética decimal exata no banco e chega no client como
objeto `Decimal`, não como `number` — o TypeScript impede o uso acidental em
conta binária. Inteiro de centavos também seria exato, mas espalha
multiplicação e divisão por 100 em toda a base, e cada esquecimento é um erro
de duas ordens de grandeza.

**Por quê — `TIMESTAMPTZ`:** o Prisma gera `TIMESTAMP(3)` sem fuso por padrão,
que grava o horário sem dizer de onde ele é. Basta a API rodar em UTC e o
Postgres em outro fuso para o filtro por período do dashboard devolver o
intervalo errado, silenciosamente. `TIMESTAMPTZ` normaliza em UTC na escrita e
elimina a ambiguidade.

**Por quê — snake_case:** o padrão do Prisma gera `"Transaction"` e
`"transactionExternalId"`, identificadores que o Postgres só reconhece entre
aspas duplas — todo `SELECT` manual, script de diagnóstico ou consulta de DBA
passa a exigir aspas, e esquecer uma devolve "column does not exist". O
`@@map`/`@map` mantém camelCase no TypeScript e snake_case no banco, cada lado
na convenção da sua linguagem. O custo é uma anotação por coluna no schema,
pago uma vez.

## Formato dos eventos

**Decisão:** envelope comum (`eventId`, `eventType`, `occurredAt`, `version`,
`data`) validado por Zod em `packages/contracts`, com os status em minúsculas
no contrato e mapeamento explícito para o enum do banco.

**Alternativas consideradas:**

- Publicar o payload cru, sem envelope
- Validar só com tipos do TypeScript, sem Zod
- Usar as mesmas maiúsculas do enum do Postgres no contrato, dispensando o mapeamento

**Por quê — envelope:** o payload cru resolve hoje e cobra depois. O `eventId`
é o que permite ao consumidor reconhecer reprocessamento, já que o Kafka
entrega pelo menos uma vez; o `occurredAt` separa quando o fato aconteceu de
quando a mensagem foi lida, o que muda tudo em reprocessamento de fila
acumulada; e o `version` é o que permite evoluir o formato sem parar os dois
serviços juntos — o consumidor passa a decidir por versão em vez de adivinhar
pelo formato.

**Por quê — Zod e não só tipos:** o tipo do TypeScript desaparece no build. O
que chega do Kafka é `Buffer`, e nada garante que o produtor da outra ponta
seja a versão que a gente compilou. O schema Zod valida em runtime na fronteira
e os tipos são derivados dele com `z.infer`, então contrato e validação não
podem divergir: são a mesma declaração.

**Por quê — status em minúsculas no contrato:** o contrato público e o enum do
Postgres seguem convenções diferentes de propósito — minúsculas na borda,
maiúsculas na coluna, como é idiomático em cada lado. O preço é uma tradução,
e tradução de status é lugar clássico de bug silencioso. Por isso o mapeamento
não é um `switch` nem `toUpperCase()`: são dois `Record` completos, um em cada
direção. Se alguém acrescentar um status em um dos lados e esquecer o outro, o
`Record` fica incompleto e o compilador recusa o build — o mesmo raciocínio de
"consistência vira regra do compilador" que justificou o monorepo.

## Falha na mensageria (outbox)

**Decisão:** gravar a transação e a mensagem na tabela `outbox_messages` na mesma
transação SQL; um worker periódico publica no Kafka e só então marca `published`.

**Alternativas consideradas:**

- Publicar no Kafka depois do `INSERT` (na mesma request)
- Publicar antes de gravar a transação
- CDC com Debezium lendo o WAL do Postgres

**Por quê:** Postgres e Kafka não compartilham transação. Publicar depois do
commit perde o evento se o processo cair ou o broker recusar — a transação
fica pendente para sempre, em silêncio. Publicar antes cria o inverso: o
antifraude processa um id que ainda não existe. O outbox não elimina a
dupla escrita: ele a move para um lugar que o banco já controla. Se o
commit falha, não existe transação nem evento. Se passa, os dois existem.
O preço é at-least-once (send ok + update falha = duplicata). A Fase 5
trata a duplicata com update idempotente. Perder evento é pior do que
duplicar.

CDC com Debezium seria o passo seguinte em produção (sem polling). No
prazo do desafio, uma tabela e um `setInterval` de 1s entregam a mesma
garantia com código que cabe na defesa.

## Servico antifraude sem banco

**Decisão:** o `anti-fraud` é um processo sem Postgres. Consome
`transaction.created`, aplica uma função pura (`value > 1000` → rejeitado)
e publica `transaction.status.updated`.

**Alternativas consideradas:**

- Avaliar a fraude no próprio serviço de transações, no request de criação
- O antifraude ler a transação no banco em vez de confiar no evento

**Por quê:** o enunciado pede dois serviços e comunicação por Kafka. Se a
regra morasse no `POST`, a criação deixaria de ser assíncrona e o diagrama
do desafio sumiria. Se o antifraude lesse o banco, os dois processos
compartilhariam schema e falhariam juntos — e o evento já carrega o `value`.
A função é pura para o limite de 1000 ser testável sem broker: 999,99 e
1000 aprovam; 1000,01 rejeita. Payload inválido é logado e descartado da
partição (não relança), para um JSON podre não travar o consumer; DLQ
formal entra na Fase 5 junto com o retry.

## Atualizacao de status idempotente

**Decisão:** o `transactions` consome `transaction.status.updated` e aplica
`UPDATE` só quando a linha ainda está `PENDING`. Payload inválido é logado e
não relançado, para não travar a partição.

**Alternativas consideradas:**

- `UPDATE` cego pelo id, sem filtrar status
- Ler o status e depois escrever (read-then-write)
- Relançar no consumer quando `count === 0` ou o JSON for inválido
- DLQ formal (tópico morto) neste mesmo passo

**Por quê:** o Kafka entrega pelo menos uma vez. Um `UPDATE` só pelo id
aceitaria um evento velho reescrever um status já final. `updateMany` com
`PENDING` no `WHERE` é atômico: a primeira mensagem muda a linha; a
duplicata altera zero linhas e não é erro. Read-then-write abre corrida
entre dois consumidores da mesma partição (hoje há um, o contrato do
grupo não garante isso para sempre).

`count === 0` também cobre id inexistente — o antifraude pode ter
publicado e o `INSERT` da transação ainda não ser visível em outro
cenário, ou a mensagem ser de um ambiente antigo. Relançar esses casos
prende o offset para sempre.

DLQ com tópico próprio e retry com backoff continua o passo seguinte:
hoje o descarte é consciente (log + commit do offset), o mesmo do
anti-fraud, para o GET sair de `pending` sem acoplar a entrega ao desenho
da fila morta.

## Listagem com offset

**Decisão:** `GET /transactions` com paginação por `page`/`pageSize` (offset),
filtros opcionais no `WHERE` e `count` na mesma ida ao banco. Teto de 50
itens por página.

**Alternativas consideradas:**

- Cursor (`createdAt` + id) em vez de offset
- Trazer a tabela inteira e paginar na API
- Dois requests separados para lista e total

**Por quê:** o dashboard pede página numerada. Offset mapeia direto para
`skip`/`take` e para `Math.ceil(total / pageSize)` na UI. Cursor é melhor
em feed infinito e em tabela que só cresce na ponta — aqui o filtro por
período e status muda o conjunto a cada request, e o enunciado não pede
scroll infinito.

Trazer tudo estoura memória no primeiro milhar de linhas. Os índices
`status+createdAt`, `transferTypeId+createdAt` e `createdAt` já existem
por isso: o `WHERE` tem que cair neles, não em seq scan.

`findMany` e `count` no mesmo `$transaction([...])` evitam a tela mostrar
cinco itens e `total` de um instante depois, se o antifraude gravar no
meio. Offset ainda sofre _drift_ entre páginas sob escrita alta; para o
volume do desafio e para a defesa, é o preço certo.

## Atualizacao de status na interface

**Decisão:** listagem e detalhe são client components que chamam a API
a cada 2s. Loading só na primeira busca; poll seguinte atualiza no lugar.
Valores em BRL e datas em `dd/mm/aaaa` (`America/Sao_Paulo`) — o contrato
da API continua número e ISO. Sem WebSocket e sem SSE.

**Alternativas consideradas:**

- Recarregar a página (F5) ou um botão "atualizar"
- WebSocket/SSE no servico de transacoes
- Invalidar cache do Next (server component + `revalidate`)

**Por quê:** o enunciado pede que a UI reflita um status que muda fora
do request do usuario. F5 funciona e esconde o problema. WebSocket e SSE
exigem um canal novo no Nest e outro modo de falha — para um poll de 2s
no `GET` que o dashboard ja precisa, e cerimonia. Server component com
revalidate atrasa a mudanca pelo periodo do cache.

Poll que falha depois da primeira carga nao apaga a tabela: perder a
lista a cada blip de rede e pior do que dado velho por mais 2s. A
primeira falha continua erro explicito (API fora, CORS). A formatacao
mora so na borda da UI para o JSON e os testes de contrato nao
dependerem de locale.
