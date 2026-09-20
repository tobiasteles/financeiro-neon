export type Category =
  | "moradia"
  | "alimentacao"
  | "transporte"
  | "lazer"
  | "saude"
  | "outros";

export type Kind = "fixo" | "variavel";
export type InvoiceStatus = "pago" | "pendente";

export interface Expense {
  id: string;
  household_id: string;
  month: string;
  description: string;
  category: Category;
  kind: Kind;
  amount: number;
  paid: boolean;
  card_id: string | null;
  invoice_month: string | null;
}

export interface CreditCard {
  id: string;
  household_id: string;
  name: string;
  limit_amount: number;
}

export interface CardInvoice {
  id: string;
  household_id: string;
  card_id: string;
  month: string;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
}

/** Soma das compras já lançadas para um cartão, na fatura de um mês. */
export interface CardPurchaseTotal {
  card_id: string;
  total: number;
}

export interface Income {
  id: string;
  household_id: string;
  month: string;
  amount: number;
  source: string | null;
}

/** Rótulo, cor e papel de cada categoria na regra 50/30/20. */
export const CATEGORIES: Record<
  Category,
  { label: string; color: string; bucket: "necessidades" | "desejos" }
> = {
  moradia: { label: "Moradia", color: "#1f6f8b", bucket: "necessidades" },
  alimentacao: {
    label: "Alimentação",
    color: "#4a8f3c",
    bucket: "necessidades",
  },
  transporte: { label: "Transporte", color: "#b07a1e", bucket: "necessidades" },
  saude: { label: "Saúde", color: "#c0555f", bucket: "necessidades" },
  lazer: { label: "Lazer", color: "#8a5bb5", bucket: "desejos" },
  outros: { label: "Outros", color: "#6b7b82", bucket: "desejos" },
};

export const CATEGORY_LIST = Object.keys(CATEGORIES) as Category[];
