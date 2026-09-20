import { money } from '@/lib/format';
import type { Summary } from '@/lib/finance';
import BudgetRail from './BudgetRail';

function Figure({
  label,
  value,
  hint,
  tone = 'neutro',
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: 'neutro' | 'positivo' | 'negativo';
}) {
  const color =
    tone === 'negativo' ? 'text-alert' : tone === 'positivo' ? 'text-accent' : 'text-ink';

  return (
    <div className="rounded-lg border border-line bg-raised px-3.5 py-3">
      <p className="text-[13px] text-soft">{label}</p>
      <p className={`tnum mt-1 font-display text-[19px] font-semibold sm:text-[21px] ${color}`}>
        {money(value)}
      </p>
      {hint && <p className="mt-0.5 text-[12px] text-soft">{hint}</p>}
    </div>
  );
}

export default function SummaryPanel({ summary }: { summary: Summary }) {
  const { overLimit, balance } = summary;

  return (
    <section
      className={`rounded-card border p-4 transition-colors sm:p-5 ${
        overLimit ? 'border-alert/50 bg-alert/[0.07]' : 'border-line bg-surface'
      }`}
      aria-live="polite"
    >
      {overLimit && (
        <div className="mb-4 flex items-start gap-3 rounded-lg bg-alert px-3.5 py-3 text-white">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2.5 1.6 20.5h20.8L12 2.5Zm0 5.7 6.6 11.4H5.4L12 8.2Zm-.95 3.6v3.9h1.9v-3.9h-1.9Zm0 5.1v1.9h1.9v-1.9h-1.9Z"
            />
          </svg>
          <div>
            <p className="font-display text-[15px] font-semibold">Limite ultrapassado · déficit financeiro</p>
            <p className="mt-0.5 text-[13px] text-white/90">
              Os gastos e faturas passam da renda deste mês em{' '}
              <b className="tnum">{money(Math.abs(balance))}</b>. Corte algo na lista ou negocie uma
              fatura antes do vencimento.
            </p>
          </div>
        </div>
      )}

      <BudgetRail summary={summary} />

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Figure label="Renda do mês" value={summary.income} tone={summary.noIncome ? 'neutro' : 'positivo'} />
        <Figure
          label="Gastos fixos e variáveis"
          value={summary.expenses}
          hint={`${money(summary.fixed)} fixos`}
          tone={overLimit ? 'negativo' : 'neutro'}
        />
        <Figure
          label="Faturas de cartão"
          value={summary.invoices}
          tone={overLimit ? 'negativo' : 'neutro'}
        />
        <Figure
          label={balance < 0 ? 'Falta para fechar o mês' : 'Saldo restante'}
          value={Math.abs(balance)}
          hint={balance < 0 ? 'Déficit' : 'Superávit'}
          tone={balance < 0 ? 'negativo' : 'positivo'}
        />
      </div>

      {summary.noIncome && (
        <p className="mt-3 text-[13px] text-soft">
          Informe a renda do mês para ver o quanto ainda pode gastar.
        </p>
      )}
    </section>
  );
}
