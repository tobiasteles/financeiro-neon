import { sql } from "./db";
import type {
  CardInvoice,
  CardPurchaseTotal,
  CreditCard,
  Expense,
  Income,
} from "./types";

/**
 * Sem RLS no Neon, a dona da autorização é esta camada: TODA query filtra por
 * household_id, inclusive os UPDATE e DELETE. Assim um id adivinhado de outra
 * casa não afeta nenhuma linha.
 */

export interface Household {
  id: string;
  name: string;
  invite_code: string;
}

export async function getHousehold(householdId: string) {
  const rows = (await sql`
    select id, name, invite_code from households where id = ${householdId}
  `) as Household[];
  return rows[0] ?? null;
}

// ------------------------------------------------------------------ renda
export async function getIncome(householdId: string, month: string) {
  const rows = (await sql`
    select id, household_id, month::text, amount::float8 as amount, source
    from monthly_incomes
    where household_id = ${householdId} and month = ${month}
  `) as Income[];
  return rows[0] ?? null;
}

export async function upsertIncome(
  householdId: string,
  month: string,
  amount: number,
  source: string | null,
) {
  await sql`
    insert into monthly_incomes (household_id, month, amount, source)
    values (${householdId}, ${month}, ${amount}, ${source})
    on conflict (household_id, month)
    do update set amount = excluded.amount, source = excluded.source, updated_at = now()
  `;
}

// ------------------------------------------------------------------ gastos
export async function listExpenses(householdId: string, month: string) {
  return (await sql`
    select id, household_id, month::text, description, category, kind,
           amount::float8 as amount, paid, card_id, invoice_month::text
    from expenses
    where household_id = ${householdId} and month = ${month}
    order by created_at desc
  `) as Expense[];
}

export async function insertExpense(
  householdId: string,
  data: {
    month: string;
    description: string;
    category: string;
    kind: string;
    amount: number;
    cardId: string | null;
    invoiceMonth: string | null;
  },
) {
  await sql`
    insert into expenses (household_id, month, description, category, kind, amount, card_id, invoice_month)
    values (${householdId}, ${data.month}, ${data.description}, ${data.category},
            ${data.kind}, ${data.amount}, ${data.cardId}, ${data.invoiceMonth})
  `;
}

export async function deleteExpense(householdId: string, id: string) {
  await sql`delete from expenses where id = ${id} and household_id = ${householdId}`;
}

export async function setExpensePaid(
  householdId: string,
  id: string,
  paid: boolean,
) {
  await sql`
    update expenses set paid = ${paid}
    where id = ${id} and household_id = ${householdId}
  `;
}

// ----------------------------------------------------------------- cartões
export async function listCards(householdId: string) {
  return (await sql`
    select id, household_id, name, limit_amount::float8 as limit_amount
    from credit_cards
    where household_id = ${householdId}
    order by created_at
  `) as CreditCard[];
}

export async function insertCard(
  householdId: string,
  name: string,
  limitAmount: number,
) {
  const rows = (await sql`
    insert into credit_cards (household_id, name, limit_amount)
    values (${householdId}, ${name}, ${limitAmount})
    returning id
  `) as { id: string }[];
  return rows[0].id;
}

export async function deleteCard(householdId: string, id: string) {
  await sql`delete from credit_cards where id = ${id} and household_id = ${householdId}`;
}

// ----------------------------------------------------------------- faturas
export async function listInvoices(householdId: string, month: string) {
  return (await sql`
    select id, household_id, card_id, month::text, amount::float8 as amount,
           due_date::text, status
    from card_invoices
    where household_id = ${householdId} and month = ${month}
  `) as CardInvoice[];
}

export async function upsertInvoice(
  householdId: string,
  data: {
    cardId: string;
    month: string;
    amount: number;
    dueDate: string;
    status?: string;
  },
) {
  // O join com credit_cards garante que o cartão é mesmo desta casa.
  await sql`
    insert into card_invoices (household_id, card_id, month, amount, due_date, status)
    select ${householdId}, c.id, ${data.month}, ${data.amount}, ${data.dueDate},
           ${data.status ?? "pendente"}
    from credit_cards c
    where c.id = ${data.cardId} and c.household_id = ${householdId}
    on conflict (card_id, month)
    do update set amount = excluded.amount, due_date = excluded.due_date,
                  status = excluded.status
  `;
}

export async function setInvoiceStatus(
  householdId: string,
  id: string,
  status: string,
) {
  await sql`
    update card_invoices set status = ${status}
    where id = ${id} and household_id = ${householdId}
  `;
}

/**
 * Soma, por cartão, as compras que você já lançou marcando "vai para a
 * fatura de {month}" — serve só de referência para conferir com o valor
 * real da fatura, não substitui o campo digitado à mão.
 */
export async function listCardPurchaseTotals(householdId: string, invoiceMonth: string) {
  return (await sql`
    select card_id, sum(amount)::float8 as total
    from expenses
    where household_id = ${householdId}
      and invoice_month = ${invoiceMonth}
      and card_id is not null
    group by card_id
  `) as CardPurchaseTotal[];
}

// -------------------------------------------------------------- cadastro
export async function createUserWithHousehold(
  email: string,
  passwordHash: string,
  householdName: string,
) {
  const users = (await sql`
    insert into users (email, password_hash) values (${email}, ${passwordHash})
    returning id
  `) as { id: string }[];
  const userId = users[0].id;

  const houses = (await sql`
    insert into households (name) values (${householdName}) returning id
  `) as { id: string }[];

  await sql`
    insert into household_members (household_id, user_id) values (${houses[0].id}, ${userId})
  `;

  return userId;
}

export async function findUserByEmail(email: string) {
  const rows = (await sql`
    select id, email, password_hash from users where lower(email) = lower(${email})
  `) as { id: string; email: string; password_hash: string }[];
  return rows[0] ?? null;
}

export async function joinByInviteCode(userId: string, code: string) {
  const rows = (await sql`
    select id from households where invite_code = upper(${code.trim()})
  `) as { id: string }[];

  if (!rows[0]) throw new Error("Código de convite não encontrado.");

  await sql`
    insert into household_members (household_id, user_id)
    values (${rows[0].id}, ${userId})
    on conflict do nothing
  `;
}
