# Práticas de Desenvolvimento

Estas são as práticas que seguimos no dia a dia da BIUD. Neste desafio elas são
**requisitos**: montar as ferramentas que as garantem faz parte da entrega, e o resultado
disso é avaliado junto com o código.

- [Quality gate](#quality-gate)
- [Integração contínua](#integração-contínua)
- [Commits](#commits)
- [Branches](#branches)
- [Pull requests](#pull-requests)
- [Testes](#testes)
- [Registro de decisões](#registro-de-decisões)
- [Código](#código)

---

## Quality gate

Um único comando precisa rodar tudo que valida o projeto:

```bash
pnpm quality
```

Ele deve cobrir, no mínimo: **lint**, **checagem de tipos**, **formatação**, **testes** e
**build**. Cada etapa também precisa rodar isolada, para o ciclo curto do dia a dia.

Antes de o commit se formar, lint e formatação devem rodar sobre os arquivos alterados. A
ferramenta é sua escolha; o efeito é obrigatório.

## Integração contínua

O repositório precisa ter um workflow no GitHub Actions rodando o mesmo quality gate a cada
push e a cada pull request. **Ele precisa estar verde na entrega.**

Se falha localmente, falha lá — e o contrário também vale: CI que não roda o que você roda
na sua máquina não serve para nada.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/). A
validação precisa ser automática, no hook de `commit-msg`: mensagem fora do padrão não
entra.

```
<tipo>(<escopo opcional>): <descrição no imperativo>
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`.

```bash
feat(transactions): adiciona endpoint de criacao de transacao
fix(anti-fraud): corrige rejeicao no valor limite de 1000
test(web): cobre estado vazio da listagem
docs: registra decisao sobre atualizacao de status na ui
```

**Commits pequenos e incrementais.** Um commit único com tudo pronto no último dia diz muito
pouco sobre como você trabalha — e o histórico faz parte do que avaliamos. Queremos ver o
projeto nascer.

## Branches

O trabalho sai de `develop`, nunca direto nela. O nome da branch começa pelo mesmo tipo do
commit, seguido de uma descrição em kebab-case:

```
feat/criacao-de-transacao
fix/status-nao-atualiza
test/cobertura-listagem
docs/decisoes-de-arquitetura
```

## Pull requests

Mesmo em um repositório individual, o trabalho entra por pull request para `develop`. O
template em `.github/pull_request_template.md` é preenchido em todos eles — inclusive o
checklist.

O PR descreve **o que mudou e por quê**, não apenas o que o diff já mostra.

## Testes

Testamos comportamento, não implementação.

- **Backend**: regras de negócio e o tratamento dos eventos são o mínimo
- **Frontend**: as telas principais e seus estados de carregamento, erro e vazio

Consultamos a interface pelo papel acessível (`getByRole`) antes de recorrer a `data-testid`
— se o elemento não é alcançável por papel, normalmente o problema está na marcação, não no
teste.

Não perseguimos um número de cobertura. Perseguimos testes que quebram quando o
comportamento quebra.

## Registro de decisões

Decisão de arquitetura vai para o `DECISIONS.md`, na raiz. O formato é curto e direto:

```markdown
## Atualização de status na interface

**Decisão:** polling a cada 3 segundos enquanto houver transação pendente na tela.

**Alternativas consideradas:** SSE e WebSocket.

**Por quê:** o volume de transações pendentes simultâneas é baixo e o polling não exige
estado de conexão no servidor. Com volume maior, SSE passa a valer o custo.
```

## Código

- **TypeScript estrito.** `any` é sinal de que o tipo ainda não foi entendido.
- **Nomes explícitos.** O nome diz o que a coisa faz, não como foi implementada.
- **Arquivos focados.** Arquivo grande costuma ser arquivo fazendo mais de uma coisa.
- **Comentário explica o porquê.** O quê já está no código; se não estiver, o problema é o código.
- **Erro tratado onde há o que fazer com ele.** Mensageria falha, banco cai, rede oscila — o caminho triste é parte da funcionalidade.
- **Configuração vem do ambiente.** Nada de credencial, host ou porta fixos no código.
