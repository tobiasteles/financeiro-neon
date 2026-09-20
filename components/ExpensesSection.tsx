import {
  addExpense,
  removeExpense,
  toggleExpensePaid,
} from "@/app/painel/actions";
import { byCategory } from "@/lib/finance";
import { money, monthLabel, shiftMonth } from "@/lib/format";
import {
  CATEGORIES,
  CATEGORY_LIST,
  type CreditCard,
  type Expense,
} from "@/lib/types";
import CategoryDonut from "./CategoryDonut";

export default function ExpensesSection({
  month,
  expenses,
  cards,
}: {
  month: string;
  expenses: Expense[];
  cards: CreditCard[];
}) {
  const slices = byCategory(expenses);
  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  // Opções de "vai para a fatura de": este mês, o próximo e o seguinte.
  const invoiceOptions = [0, 1, 2].map((n) => {
    const value = shiftMonth(month, n);
    return { value, label: monthLabel(value) };
  });

  return (
    <div className="space-y-4">
      <form action={addExpense} className="card">
        <input type="hidden" name="month" value={month} />
        <h2 className="font-display text-[17px] font-semibold text-ink">
          Novo gasto
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="label" htmlFor="description">
              O que foi
            </label>
            <input
              id="description"
              name="description"
              required
              placeholder="Aluguel, feira, gasolina…"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="amount">
              Valor
            </label>
            <input
              id="amount"
              name="amount"
              inputMode="decimal"
              required
              placeholder="0,00"
              className="input tnum"
            />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              className="input"
              defaultValue="moradia"
            >
              {CATEGORY_LIST.map((key) => (
                <option key={key} value={key}>
                  {CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="kind">
              Tipo
            </label>
            <select id="kind" name="kind" className="input" defaultValue="fixo">
              <option value="fixo">Fixo (todo mês)</option>
              <option value="variavel">Variável</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="card_id">
              Cartão
            </label>
            <select
              id="card_id"
              name="card_id"
              className="input"
              defaultValue=""
            >
              <option value="">
                — Pagamento direto (dinheiro, débito, pix) —
              </option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="invoice_month">
              Se foi no cartão, vai para a fatura de
            </label>
            <select
              id="invoice_month"
              name="invoice_month"
              className="input"
              defaultValue={invoiceOptions[1].value}
            >
              {invoiceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-1.5 text-[13px] text-soft">
          Compra no cartão não entra no gasto deste mês — ela só pesa quando a
          fatura escolhida vencer.
        </p>

        <button type="submit" className="btn-primary mt-4 w-full sm:w-auto">
          Adicionar gasto
        </button>
      </form>

      {expenses.length === 0 ? (
        <p className="card text-[14px] text-soft">
          Comece pelos gastos fixos: aluguel, contas de casa, escola,
          transporte. Eles são a base do seu mês.
        </p>
      ) : (
        <>
          <section className="card">
            <h2 className="font-display text-[17px] font-semibold text-ink">
              Para onde foi o dinheiro
            </h2>
            <div className="mt-4">
              <CategoryDonut slices={slices} total={total} />
            </div>
          </section>

          <section className="card !p-0">
            <h2 className="border-b border-line px-4 py-3.5 font-display text-[17px] font-semibold text-ink sm:px-5">
              Lançamentos do mês
            </h2>
            <ul className="divide-y divide-line">
              {expenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  {expense.card_id ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[13px] text-fatura"
                      title="Compra no cartão — controlada pela fatura, não por aqui"
                      aria-hidden="true"
                    >
                      ◆
                    </span>
                  ) : (
                    <form action={toggleExpensePaid} className="flex shrink-0">
                      <input type="hidden" name="id" value={expense.id} />
                      <input
                        type="hidden"
                        name="paid"
                        value={String(!expense.paid)}
                      />
                      <button
                        type="submit"
                        aria-label={
                          expense.paid
                            ? "Marcar como não pago"
                            : "Marcar como pago"
                        }
                        className={`flex h-6 w-6 items-center justify-center rounded-md border text-[13px] transition ${
                          expense.paid
                            ? "border-accent bg-accent text-white"
                            : "border-line bg-raised text-transparent hover:border-soft/60"
                        }`}
                      >
                        ✓
                      </button>
                    </form>
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[15px] ${expense.paid ? "text-soft line-through" : "text-ink"}`}
                    >
                      {expense.description}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-soft">
                      <i
                        className="h-2 w-2 rounded-[2px]"
                        style={{
                          background: CATEGORIES[expense.category].color,
                        }}
                      />
                      {CATEGORIES[expense.category].label}
                      <span aria-hidden>·</span>
                      {expense.kind === "fixo" ? "Fixo" : "Variável"}
                      {expense.card_id && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="text-fatura">
                            {cards.find((c) => c.id === expense.card_id)
                              ?.name ?? "Cartão"}
                            {expense.invoice_month &&
                              ` · fatura de ${monthLabel(expense.invoice_month)}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <b className="tnum shrink-0 text-[15px] font-semibold text-ink">
                    {money(Number(expense.amount))}
                  </b>

                  <form action={removeExpense} className="shrink-0">
                    <input type="hidden" name="id" value={expense.id} />
                    <button
                      type="submit"
                      aria-label={`Remover ${expense.description}`}
                      className="rounded-md px-2 py-1 text-soft transition hover:bg-alert/10 hover:text-alert"
                    >
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
