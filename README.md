<div align="center">

# 💰 Orçamento Familiar Neon

**Controle de renda, gastos e faturas de cartão, mês a mês. Importe a fatura em PDF e compartilhe o orçamento com a família.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?logo=postgresql&logoColor=white)](https://neon.tech)

[**🔗 Ver online**](https://financeiro-neon-phi.vercel.app/) · [Reportar um bug](../../issues)

<img src="https://i.imgur.com/MGjUA1a.png" alt="Painel do Orçamento Familiar" width="720" />

</div>

---

## ✨ O que é

Um painel simples para a família enxergar para onde o dinheiro vai. Você lança a renda do mês, os gastos fixos e variáveis e as faturas dos cartões, e o app mostra quanto sobra, quanto falta e onde há risco.

## 🚀 Funcionalidades

- **Navegação mês a mês** com renda, gastos fixos, variáveis e faturas
- **Importação de fatura em PDF:** lê o extrato, ignora linhas de resumo (saldo anterior, juros, pagamentos) e categoriza as compras
- **Alertas inteligentes**
  - Déficit: o resumo fica vermelho e mostra quanto falta para fechar o mês
  - Cartão: aviso quando o uso do limite chega a 80% ou a fatura vence em até 5 dias
- **Regra 50/30/20** calculada automaticamente (necessidades, desejos e poupança/dívidas)
- **Gráfico por categoria** (donut) e trilho de comprometimento da renda
- **Casa compartilhada:** convide familiares com um código e vejam os mesmos lançamentos

## 🔐 Segurança por design

Neon é Postgres puro, sem RLS acoplado ao login. Por isso a autorização vive em **um lugar só**, `lib/queries.ts`:

- Toda query, inclusive `update` e `delete`, carrega `where household_id = $1`, com o id vindo da **sessão**, nunca do formulário. Um id de outra casa enviado na requisição não afeta nenhuma linha
- Senhas com **scrypt** (salt por usuário) e comparação com `timingSafeEqual`
- Sessão em **JWT HS256** (`jose`), cookie `httpOnly`, `sameSite=lax` e `secure` em produção
- Middleware valida só a assinatura (roda no Edge, sem tocar o banco); a identidade real é resolvida em cada Server Action
- O login responde igual para e-mail inexistente e senha errada, para não revelar quem tem conta

## 🛠️ Stack

| Camada         | Tecnologias                                         |
| -------------- | --------------------------------------------------- |
| Framework      | Next.js 14 (App Router, Server Actions) e React 18  |
| Linguagem      | TypeScript                                          |
| Estilo         | Tailwind CSS 3                                      |
| Banco de dados | PostgreSQL no Neon (driver serverless HTTP)         |
| Autenticação   | `jose` (JWT) e scrypt, sem serviço externo          |
| PDF            | `pdf-parse`                                         |

## 🧪 Rodando localmente

```bash
git clone https://github.com/tobiasteles/financeiro-neon.git
cd financeiro-neon
npm install

cp .env.example .env.local   # preencha DATABASE_URL e AUTH_SECRET
npm run db:setup             # aplica db/schema.sql (pode rodar de novo)
npm run dev                  # http://localhost:3000
```

| Variável       | Descrição                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Connection string do Neon (use a **pooled connection**)                     |
| `AUTH_SECRET`  | Segredo da sessão: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

## 📁 Estrutura

```
app/          # login/cadastro e painel (Server Actions)
components/   # resumo, renda, gastos, cartões, regra 50/30/20, importação de fatura
lib/          # db, queries (sempre escopadas), auth, session, finance, invoiceParser
db/           # schema.sql
scripts/      # setup-db.mjs
```

## 👤 Autor

**Tobias Teles** · [Portfólio](https://tobiasteles.vercel.app) · [LinkedIn](https://www.linkedin.com/in/tobias-teles/)
