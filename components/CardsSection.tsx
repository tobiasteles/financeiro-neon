import { addCard, removeCard, saveInvoice, toggleInvoiceStatus } from '@/app/painel/actions';
import { cardStatus } from '@/lib/finance';
import { dayLabel, money, percent } from '@/lib/format';
import type { CardInvoice, CardPurchaseTotal, CreditCard } from '@/lib/types';

const TONE = {
  ok: { ring: 'border-line', bar: 'var(--accent)', badge: 'border-line text-soft' },
  atencao: { ring: 'border-warn/50', bar: 'var(--warn)', badge: 'border-warn/40 text-warn bg-warn/10' },
  critico: { ring: 'border-alert/60', bar: 'var(--alert)', badge: 'border-alert/40 text-alert bg-alert/10' },
} as const;

function alertText(s: ReturnType<typeof cardStatus>) {
  if (s.overdue) return `Fatura venceu há ${Math.abs(s.days!)} dia(s)`;
  if (s.usage >= 100) return 'Limite do cartão estourado';
  if (s.dueSoon) return s.days === 0 ? 'Vence hoje' : `Vence em ${s.days} dia(s)`;
  if (s.overUsed) return `${percent(s.usage)} do limite em uso`;
  return null;
}

export default function CardsSection({
  month,
  cards,
  invoices,
  purchaseTotals,
}: {
  month: string;
  cards: CreditCard[];
  invoices: CardInvoice[];
  purchaseTotals: CardPurchaseTotal[];
}) {
  const defaultDue = `${month.slice(0, 8)}10`;
  const purchasedFor = (cardId: string) =>
    purchaseTotals.find((p) => p.card_id === cardId)?.total ?? 0;

  return (
    <div className="space-y-4">
      <form action={addCard} className="card">
        <input type="hidden" name="month" value={month} />
        <h2 className="font-display text-[17px] font-semibold text-ink">Novo cartão</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="card-name">
              Nome do cartão
            </label>
            <input id="card-name" name="name" required placeholder="Nubank roxinho" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="card-limit">
              Limite total
            </label>
            <input id="card-limit" name="limit_amount" inputMode="decimal" placeholder="3.000,00" className="input tnum" />
          </div>
          <div>
            <label className="label" htmlFor="card-amount">
              Fatura deste mês
            </label>
            <input id="card-amount" name="amount" inputMode="decimal" placeholder="0,00" className="input tnum" />
          </div>
          <div>
            <label className="label" htmlFor="card-due">
              Vencimento
            </label>
            <input id="card-due" name="due_date" type="date" defaultValue={defaultDue} className="input" />
          </div>
        </div>

        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto">
          Adicionar cartão
        </button>
      </form>

      {cards.length === 0 && (
        <p className="card text-[14px] text-soft">
          Cadastre os cartões da casa para acompanhar quanto do limite já foi usado e o que vence
          primeiro.
        </p>
      )}

      {cards.map((card) => {
        const invoice = invoices.find((i) => i.card_id === card.id);
        const status = cardStatus(card, invoice);
        const tone = TONE[status.health];
        const warning = alertText(status);

        return (
          <section key={card.id} className={`card ${tone.ring}`}>
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="font-display text-[17px] font-semibold text-ink">{card.name}</h3>
              <span
                className={`badge ${
                  invoice?.status === 'pago'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line text-soft'
                }`}
              >
                {invoice?.status === 'pago' ? 'Paga' : 'Pendente'}
              </span>
              {warning && <span className={`badge ${tone.badge}`}>{warning}</span>}

              <form action={removeCard} className="ml-auto">
                <input type="hidden" name="id" value={card.id} />
                <button
                  type="submit"
                  aria-label={`Remover ${card.name}`}
                  className="rounded-md px-2 py-1 text-soft transition hover:bg-alert/10 hover:text-alert"
                >
                  ✕
                </button>
              </form>
            </header>

            <div className="mt-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(status.usage, 100)}%`, background: tone.bar }}
                />
              </div>
              <p className="tnum mt-2 text-[13px] text-soft">
                {money(status.amount)} de {money(card.limit_amount)} ·{' '}
                <b className="font-semibold text-ink">{percent(status.usage)} do limite</b>
                {invoice && <> · vence {dayLabel(invoice.due_date)}</>}
              </p>
            </div>

            <form action={saveInvoice} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="card_id" value={card.id} />
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="status" value={invoice?.status ?? 'pendente'} />
              <div>
                <label className="label" htmlFor={`amount-${card.id}`}>
                  Valor da fatura
                </label>
                                <input
                  id={`amount-${card.id}`}
                  name="amount"
                  inputMode="decimal"
                  defaultValue={invoice?.amount ?? ''}
                  placeholder="0,00"
                  className="input tnum"
                />
                {purchasedFor(card.id) > 0 && (
                  <p className="mt-1 text-[12px] text-soft">
                    Você já lançou <b className="tnum text-ink">{money(purchasedFor(card.id))}</b> em
                    compras para esta fatura — confira com o valor real do banco.
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor={`due-${card.id}`}>
                  Vencimento
                </label>
                <input
                  id={`due-${card.id}`}
                  name="due_date"
                  type="date"
                  defaultValue={invoice?.due_date ?? defaultDue}
                  className="input"
                />
              </div>
              <button type="submit" className="btn-ghost">
                Atualizar fatura
              </button>
            </form>

            {invoice && (
              <form action={toggleInvoiceStatus} className="mt-3">
                <input type="hidden" name="id" value={invoice.id} />
                <input type="hidden" name="status" value={invoice.status === 'pago' ? 'pendente' : 'pago'} />
                <button type="submit" className="text-[13px] font-medium text-accent underline underline-offset-4">
                  {invoice.status === 'pago' ? 'Marcar como pendente' : 'Marcar fatura como paga'}
                </button>
              </form>
            )}
          </section>
        );
      })}
    </div>
  );
}
