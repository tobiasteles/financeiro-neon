'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { toNumber } from '@/lib/format';
import * as db from '@/lib/queries';

const done = () => revalidatePath('/painel');

export async function saveIncome(formData: FormData) {
  const { householdId } = await requireUser();

  await db.upsertIncome(
    householdId,
    String(formData.get('month')),
    toNumber(formData.get('amount')),
    String(formData.get('source') ?? '').trim() || null,
  );

  done();
}

export async function addExpense(formData: FormData) {
  const { householdId } = await requireUser();
  const amount = toNumber(formData.get('amount'));
  const description = String(formData.get('description') ?? '').trim();
  const cardId = String(formData.get('card_id') ?? '').trim() || null;
  const invoiceMonth = cardId ? String(formData.get('invoice_month') ?? '').trim() || null : null;

  if (!description || amount <= 0) return;

  await db.insertExpense(householdId, {
    month: String(formData.get('month')),
    description,
    category: String(formData.get('category')),
    kind: String(formData.get('kind')),
    amount,
    cardId,
    invoiceMonth,
  });

  done();
}

export async function removeExpense(formData: FormData) {
  const { householdId } = await requireUser();
  await db.deleteExpense(householdId, String(formData.get('id')));
  done();
}

export async function toggleExpensePaid(formData: FormData) {
  const { householdId } = await requireUser();
  await db.setExpensePaid(householdId, String(formData.get('id')), formData.get('paid') === 'true');
  done();
}

export async function addCard(formData: FormData) {
  const { householdId } = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const cardId = await db.insertCard(householdId, name, toNumber(formData.get('limit_amount')));

  const amount = toNumber(formData.get('amount'));
  const dueDate = String(formData.get('due_date') ?? '');

  if (amount > 0 && dueDate) {
    await db.upsertInvoice(householdId, {
      cardId,
      month: String(formData.get('month')),
      amount,
      dueDate,
    });
  }

  done();
}

export async function removeCard(formData: FormData) {
  const { householdId } = await requireUser();
  await db.deleteCard(householdId, String(formData.get('id')));
  done();
}

/** Cria ou atualiza a fatura do cartão no mês selecionado. */
export async function saveInvoice(formData: FormData) {
  const { householdId } = await requireUser();

  await db.upsertInvoice(householdId, {
    cardId: String(formData.get('card_id')),
    month: String(formData.get('month')),
    amount: toNumber(formData.get('amount')),
    dueDate: String(formData.get('due_date')),
    status: String(formData.get('status') ?? 'pendente'),
  });

  done();
}

export async function toggleInvoiceStatus(formData: FormData) {
  const { householdId } = await requireUser();
  await db.setInvoiceStatus(
    householdId,
    String(formData.get('id')),
    formData.get('status') === 'pago' ? 'pago' : 'pendente',
  );
  done();
}

export async function joinHousehold(formData: FormData) {
  const { id } = await requireUser();
  await db.joinByInviteCode(id, String(formData.get('code') ?? ''));
  revalidatePath('/', 'layout');
}
