-- =====================================================================
--  Orçamento Familiar — schema para Neon (Postgres)
--  Rode uma vez no SQL Editor do Neon, ou com:  npm run db:setup
-- =====================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------- usuários
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create unique index if not exists users_email_idx on users (lower(email));

-- ----------------------------------------------------------------- casas
create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Minha casa',
  invite_code text not null unique
                default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  created_at  timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists members_user_idx on household_members (user_id, created_at desc);

-- -------------------------------------------------------------- finanças
create table if not exists monthly_incomes (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month        date not null,                       -- sempre o dia 1 do mês
  amount       numeric(12, 2) not null default 0 check (amount >= 0),
  source       text,
  updated_at   timestamptz not null default now(),
  unique (household_id, month)
);

create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  month        date not null,
  description  text not null,
  category     text not null check (category in
                 ('moradia','alimentacao','transporte','lazer','saude','outros')),
  kind         text not null default 'variavel' check (kind in ('fixo','variavel')),
  amount       numeric(12, 2) not null check (amount > 0),
  paid         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists expenses_month_idx on expenses (household_id, month);

create table if not exists credit_cards (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  limit_amount numeric(12, 2) not null default 0 check (limit_amount >= 0),
  created_at   timestamptz not null default now()
);

create table if not exists card_invoices (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  card_id      uuid not null references credit_cards(id) on delete cascade,
  month        date not null,
  amount       numeric(12, 2) not null default 0 check (amount >= 0),
  due_date     date not null,
  status       text not null default 'pendente' check (status in ('pago','pendente')),
  created_at   timestamptz not null default now(),
  unique (card_id, month)
);

create index if not exists invoices_month_idx on card_invoices (household_id, month);

-- ------------------------------------------ compras feitas no cartão
-- Liga um gasto a um cartão e diz em qual fatura (mês) ele vai ser cobrado.
-- Quando preenchido, essa compra some do caixa do mês da compra e só entra
-- na conta quando a fatura escolhida vencer.
alter table expenses
  add column if not exists card_id uuid references credit_cards(id) on delete set null,
  add column if not exists invoice_month date;

create index if not exists expenses_invoice_idx on expenses (household_id, card_id, invoice_month); 
