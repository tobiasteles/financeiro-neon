import { CATEGORIES, type CardInvoice, type Category, type CreditCard, type Expense } from './types';
import { daysUntil } from './format';

export interface Summary {
  income: number;
  fixed: number;
  variable: number;
  expenses: number;
  invoices: number;
  committed: number;
  balance: number;
  usage: number; // % da renda já comprometido
  overLimit: boolean;
  noIncome: boolean;
}

export function summarize(income: number, expenses: Expense[], invoices: CardInvoice[]): Summary {
  const direct = expenses.filter((e) => !e.card_id);
  const fixed = sum(direct.filter((e) => e.kind === 'fixo').map((e) => e.amount));
  const variable = sum(direct.filter((e) => e.kind === 'variavel').map((e) => e.amount));
  const invoiceTotal = sum(invoices.map((i) => i.amount));
  const committed = fixed + variable + invoiceTotal;

  return {
    income,
    fixed,
    variable,
    expenses: fixed + variable,
    invoices: invoiceTotal,
    committed,
    balance: income - committed,
    usage: income > 0 ? (committed / income) * 100 : 0,
    overLimit: income > 0 && committed > income,
    noIncome: income <= 0,
  };
}

export function byCategory(expenses: Expense[]) {
  const total = sum(expenses.map((e) => e.amount));
  return (Object.keys(CATEGORIES) as Category[])
    .map((key) => {
      const value = sum(expenses.filter((e) => e.category === key).map((e) => e.amount));
      return {
        key,
        label: CATEGORIES[key].label,
        color: CATEGORIES[key].color,
        value,
        share: total > 0 ? (value / total) * 100 : 0,
      };
    })
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Comparação 50/30/20: necessidades, desejos, poupança e dívidas. */
export function rule503020(income: number, expenses: Expense[], invoices: CardInvoice[]) {
  const needs = sum(
    expenses.filter((e) => CATEGORIES[e.category].bucket === 'necessidades').map((e) => e.amount),
  );
  const wants = sum(
    expenses.filter((e) => CATEGORIES[e.category].bucket === 'desejos').map((e) => e.amount),
  );
  const invoiceTotal = sum(invoices.map((i) => i.amount));
  const leftover = Math.max(0, income - needs - wants - invoiceTotal);
  const future = invoiceTotal + leftover;

  const pct = (v: number) => (income > 0 ? (v / income) * 100 : 0);

  return [
    {
      key: 'necessidades' as const,
      label: 'Necessidades',
      hint: 'Moradia, alimentação, transporte e saúde',
      ideal: 50,
      value: needs,
      current: pct(needs),
    },
    {
      key: 'desejos' as const,
      label: 'Desejos',
      hint: 'Lazer e gastos da categoria Outros',
      ideal: 30,
      value: wants,
      current: pct(wants),
    },
    {
      key: 'futuro' as const,
      label: 'Poupança e dívidas',
      hint: 'Faturas de cartão mais o que sobra no fim do mês',
      ideal: 20,
      value: future,
      current: pct(future),
    },
  ];
}

export type CardHealth = 'ok' | 'atencao' | 'critico';

export function cardStatus(card: CreditCard, invoice?: CardInvoice) {
  const amount = invoice?.amount ?? 0;
  const usage = card.limit_amount > 0 ? (amount / card.limit_amount) * 100 : 0;
  const days = invoice ? daysUntil(invoice.due_date) : null;
  const open = invoice?.status !== 'pago';

  const overdue = open && days !== null && days < 0;
  const dueSoon = open && days !== null && days >= 0 && days <= 5;
  const overUsed = usage >= 80;

  const health: CardHealth = overdue || usage >= 100 ? 'critico' : dueSoon || overUsed ? 'atencao' : 'ok';

  return { amount, usage, days, open, overdue, dueSoon, overUsed, health };
}

export const sum = (values: number[]) => values.reduce((acc, v) => acc + Number(v || 0), 0);
