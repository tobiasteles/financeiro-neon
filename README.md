# Orçamento Familiar — Neon

Controle de renda, gastos e faturas de cartão, mês a mês. Next.js 14 (App Router),
React, TypeScript, Tailwind CSS e **Neon** (Postgres serverless).

Sem serviço de autenticação externo: as contas ficam na tabela `users` do próprio Neon,
com senha em scrypt e sessão em cookie httpOnly assinado (JWT HS256).

## Como rodar

**1. Crie o banco no Neon** em neon.tech e copie a *connection string* em
*Dashboard → Connection Details*. Use a opção **Pooled connection** — o driver HTTP do Neon
trabalha melhor com ela em ambiente serverless.

**2. Configure as variáveis.**

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — a connection string do Neon (mantenha o `?sslmode=require`).
- `AUTH_SECRET` — gere com:
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

**3. Crie as tabelas.**

```bash
npm install
npm run db:setup    # aplica db/schema.sql; pode rodar de novo sem problema
```

Se preferir, cole `db/schema.sql` direto no SQL Editor do Neon.

**4. Suba o app.**

```bash
npm run dev
```

Abra http://localhost:3000, crie uma conta e comece a lançar. Não há confirmação de
e-mail: o cadastro já entra direto.

## Deploy

Na Vercel, cadastre `DATABASE_URL` e `AUTH_SECRET` nas variáveis de ambiente. Se usar a
integração oficial Vercel + Neon, a `DATABASE_URL` é injetada sozinha — só falta o
`AUTH_SECRET`. Nada mais muda: o driver HTTP funciona em Node e em Edge.

## Como os dados ficam privados

Neon é Postgres puro, sem a camada de RLS acoplada ao login que o Supabase oferece. A
autorização, portanto, mora no código, em um lugar só: **`lib/queries.ts`**. Toda query —
inclusive `update` e `delete` — carrega `where household_id = $1`, com o id vindo da sessão,
nunca do formulário. Um id de outra casa chutado na requisição simplesmente não afeta
nenhuma linha.

A regra prática ao adicionar uma funcionalidade: se a query nova não tem `household_id` na
cláusula `where`, ela está errada.

Se quiser RLS de verdade mais tarde, dá para criar um role por requisição e usar
`set local app.household_id` — mas para um app familiar a checagem na camada de dados é
suficiente e bem mais simples de auditar.

## Autenticação

- **Senha:** scrypt com salt de 16 bytes por usuário, guardada como `salt:hash`. A
  comparação usa `timingSafeEqual`.
- **Sessão:** JWT HS256 assinado com `AUTH_SECRET`, válido por 30 dias, em cookie
  `httpOnly` + `sameSite=lax` + `secure` em produção.
- **Middleware:** confere só a assinatura do cookie (roda no Edge, sem tocar o banco). A
  identidade real é resolvida em `requireUser()` dentro de cada server action.
- O login responde a mesma mensagem para e-mail inexistente e senha errada, para não
  revelar quais e-mails estão cadastrados.

## Estrutura

```
app/
  entrar/        login e cadastro (server actions de auth)
  painel/        dashboard + server actions de escrita
components/      UI: resumo, trilho da renda, gastos, cartões, regra 50/30/20
lib/
  db.ts          conexão com o Neon (driver serverless HTTP)
  queries.ts     todas as queries, sempre escopadas por household_id
  auth.ts        scrypt + usuário da requisição atual
  session.ts     assinatura/leitura do cookie (compatível com Edge)
  finance.ts     totais, alerta de déficit, uso de limite, regra 50/30/20
  format.ts      moeda BRL, datas, parse de valores digitados
db/
  schema.sql     tabelas e índices
scripts/
  setup-db.mjs   aplica o schema
```

## Regras de negócio

- **Déficit:** quando gastos fixos + variáveis + faturas passam da renda do mês, o painel de
  resumo fica vermelho e mostra o quanto falta para fechar o mês.
- **Cartão:** aviso âmbar quando o uso do limite chega a 80% ou a fatura vence em até 5 dias;
  aviso vermelho quando o limite estoura ou a fatura já venceu sem pagamento.
- **50/30/20:** necessidades = moradia, alimentação, transporte e saúde; desejos = lazer e
  outros; poupança e dívidas = faturas de cartão + o que sobra no fim do mês.

## Compartilhar com a família

Cada conta nasce com uma casa própria. Em *Ajustes* aparece o código de convite: quem colar
esse código em *Entrar em outra casa* passa a ver e editar os mesmos lançamentos.
