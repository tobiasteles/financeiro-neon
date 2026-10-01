"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { toNumber } from "@/lib/format";
import { extractTransactions } from "@/lib/invoiceParser";
import * as db from "@/lib/queries";

const done = () => revalidatePath("/painel");

export type ImportState = { count?: number; error?: string };

export async function saveIncome(formData: FormData) {
  const { householdId } = await requireUser();

  await db.upsertIncome(
    householdId,
    String(formData.get("month")),
    toNumber(formData.get("amount")),
    String(formData.get("source") ?? "").trim() || null,
  );

  done();
}

export async function addExpense(formData: FormData) {
  const { householdId } = await requireUser();
  const amount = toNumber(formData.get("amount"));
  const description = String(formData.get("description") ?? "").trim();
  const cardId = String(formData.get("card_id") ?? "").trim() || null;
  const invoiceMonth = cardId
    ? String(formData.get("invoice_month") ?? "").trim() || null
    : null;

  if (!description || amount <= 0) return;

  await db.insertExpense(householdId, {
    month: String(formData.get("month")),
    description,
    category: String(formData.get("category")),
    kind: String(formData.get("kind")),
    amount,
    cardId,
    invoiceMonth,
  });

  done();
}

export async function removeExpense(formData: FormData) {
  const { householdId } = await requireUser();
  await db.deleteExpense(householdId, String(formData.get("id")));
  done();
}

export async function toggleExpensePaid(formData: FormData) {
  const { householdId } = await requireUser();
  await db.setExpensePaid(
    householdId,
    String(formData.get("id")),
    formData.get("paid") === "true",
  );
  done();
}

export async function addCard(formData: FormData) {
  const { householdId } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const cardId = await db.insertCard(
    householdId,
    name,
    toNumber(formData.get("limit_amount")),
  );

  const amount = toNumber(formData.get("amount"));
  const dueDate = String(formData.get("due_date") ?? "");

  if (amount > 0 && dueDate) {
    await db.upsertInvoice(householdId, {
      cardId,
      month: String(formData.get("month")),
      amount,
      dueDate,
    });
  }

  done();
}

export async function removeCard(formData: FormData) {
  const { householdId } = await requireUser();
  await db.deleteCard(householdId, String(formData.get("id")));
  done();
}

/** Cria ou atualiza a fatura do cartão no mês selecionado. */
export async function saveInvoice(formData: FormData) {
  const { householdId } = await requireUser();

  await db.upsertInvoice(householdId, {
    cardId: String(formData.get("card_id")),
    month: String(formData.get("month")),
    amount: toNumber(formData.get("amount")),
    dueDate: String(formData.get("due_date")),
    status: String(formData.get("status") ?? "pendente"),
  });

  done();
}

export async function toggleInvoiceStatus(formData: FormData) {
  const { householdId } = await requireUser();
  await db.setInvoiceStatus(
    householdId,
    String(formData.get("id")),
    formData.get("status") === "pago" ? "pago" : "pendente",
  );
  done();
}

export async function importInvoice(
  _prev: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const { householdId } = await requireUser();

  const file = formData.get("file") as File | null;
  const cardId = String(formData.get("card_id") ?? "");
  const invoiceMonth = String(formData.get("invoice_month") ?? "");

  if (!file || file.size === 0)
    return { error: "Escolha o arquivo PDF da fatura." };
  if (!cardId || !invoiceMonth)
    return { error: "Escolha o cartão e o mês da fatura." };
  if (file.type !== "application/pdf")
    return { error: "O arquivo precisa ser um PDF." };

  const cards = await db.listCards(householdId);
  if (!cards.some((c) => c.id === cardId)) return { error: "Cartão inválido." };

  let text: string;
  try {
    const { PDFParse } = await import("pdf-parse");
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    text = (await parser.getText()).text;
  } catch (error) {
    console.error("Falha ao ler PDF da fatura:", error);
    return {
      error:
        "Não consegui abrir esse PDF. Ele pode estar protegido por senha ou corrompido.",
    };
  }

  const items = extractTransactions(text, invoiceMonth);
  if (items.length === 0) {
    return {
      error:
        "Não reconheci nenhuma compra nesse PDF. O formato desse banco pode ser diferente do esperado — vale lançar manualmente.",
    };
  }

  await db.insertExpensesBulk(householdId, cardId, invoiceMonth, items);
  done();
  return { count: items.length };
}

export async function joinHousehold(formData: FormData) {
  const { id } = await requireUser();
  await db.joinByInviteCode(id, String(formData.get("code") ?? ""));
  revalidatePath("/", "layout");
}
