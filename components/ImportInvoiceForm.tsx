'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { importInvoice, type ImportState } from '@/app/painel/actions';
import { monthLabel, shiftMonth } from '@/lib/format';
import type { CreditCard } from '@/lib/types';

const empty: ImportState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
      {pending ? 'Lendo o PDF…' : 'Importar lançamentos'}
    </button>
  );
}

export default function ImportInvoiceForm({ month, cards }: { month: string; cards: CreditCard[] }) {
  const [state, action] = useFormState(importInvoice, empty);
  const invoiceOptions = [0, 1, 2].map((n) => {
    const value = shiftMonth(month, n);
    return { value, label: monthLabel(value) };
  });

  if (cards.length === 0) return null;

  return (
    <details className="card">
      <summary className="cursor-pointer font-display text-[17px] font-semibold text-ink">
        Importar fatura em PDF
      </summary>

      <p className="mt-2 text-[13px] leading-relaxed text-soft">
        Funciona melhor com PDFs simples, em texto (não digitalizados). Cada linha reconhecida
        como compra entra automaticamente marcada nesse cartão — confira a lista depois e apague
        o que não fizer sentido.
      </p>

      <form action={action} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="import-card">
              Cartão
            </label>
            <select id="import-card" name="card_id" className="input" required defaultValue="">
              <option value="" disabled>
                Escolha o cartão
              </option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="import-month">
              Essa fatura é de
            </label>
            <select id="import-month" name="invoice_month" className="input" defaultValue={invoiceOptions[0].value}>
              {invoiceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="import-file">
            Arquivo PDF
          </label>
          <input id="import-file" name="file" type="file" accept="application/pdf" required className="input" />
        </div>

        {state.error && (
          <p className="rounded-lg border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
            {state.error}
          </p>
        )}
        {typeof state.count === 'number' && (
          <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {state.count} lançamento{state.count === 1 ? '' : 's'} importado{state.count === 1 ? '' : 's'}.
            Veja e confira na aba Gastos.
          </p>
        )}

        <Submit />
      </form>
    </details>
  );
}