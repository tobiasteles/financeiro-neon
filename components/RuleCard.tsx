import { rule503020 } from '@/lib/finance';
import { money, percent } from '@/lib/format';
import type { CardInvoice, Expense } from '@/lib/types';

export default function RuleCard({
  income,
  expenses,
  invoices,
}: {
  income: number;
  expenses: Expense[];
  invoices: CardInvoice[];
}) {
  const rows = rule503020(income, expenses, invoices);

  return (
    <section className="card">
      <h2 className="font-display text-[17px] font-semibold text-ink">A regra 50/30/20</h2>
      <p className="mt-1 max-w-[62ch] text-[14px] leading-relaxed text-soft">
        Uma divisão simples da renda: metade para o que você precisa, um terço para o que você
        quer, e o restante para guardar ou quitar dívidas. Não é lei — é um ponto de referência
        para perceber onde seu mês está desequilibrado.
      </p>

      {income <= 0 ? (
        <p className="mt-4 rounded-lg border border-line bg-raised px-3.5 py-3 text-[14px] text-soft">
          Informe a renda do mês para comparar seus gastos com a regra.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {rows.map((row) => {
            const excess = row.current - row.ideal;
            const off = Math.abs(excess) > 5;
            const isSavings = row.key === 'futuro';
            const bad = isSavings ? excess < -5 : excess > 5;

            return (
              <div key={row.key}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="text-[15px] font-semibold text-ink">{row.label}</h3>
                  <span className="text-[13px] text-soft">ideal {row.ideal}%</span>
                  <b className={`tnum ml-auto text-[15px] font-semibold ${bad ? 'text-alert' : 'text-accent'}`}>
                    {percent(row.current)}
                  </b>
                </div>

                <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(row.current, 100)}%`,
                      background: bad ? 'var(--alert)' : 'var(--accent)',
                    }}
                  />
                  <span
                    className="absolute inset-y-0 w-px bg-ink/45"
                    style={{ left: `${row.ideal}%` }}
                    aria-hidden
                  />
                </div>

                <p className="mt-1.5 text-[13px] text-soft">
                  {money(row.value)} · {row.hint}
                  {off && (
                    <>
                      {' '}
                      —{' '}
                      <b className={bad ? 'font-semibold text-alert' : 'font-semibold text-accent'}>
                        {excess > 0 ? `${percent(excess)} acima` : `${percent(Math.abs(excess))} abaixo`} do
                        ideal
                      </b>
                    </>
                  )}
                </p>
              </div>
            );
          })}

          <p className="border-t border-line pt-4 text-[13px] leading-relaxed text-soft">
            Se as necessidades passam de 50%, o caminho costuma ser reduzir um custo grande e fixo —
            moradia ou transporte. Se os desejos passam de 30%, o ajuste é mais rápido: são as
            despesas que você controla no dia a dia.
          </p>
        </div>
      )}
    </section>
  );
}
