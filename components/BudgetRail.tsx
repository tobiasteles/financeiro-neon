import { money, percent } from '@/lib/format';
import type { Summary } from '@/lib/finance';

const SEGMENTS = [
  { key: 'fixed', label: 'Gastos fixos', color: 'var(--c-fixo)' },
  { key: 'variable', label: 'Gastos variáveis', color: 'var(--c-variavel)' },
  { key: 'invoices', label: 'Faturas de cartão', color: 'var(--c-fatura)' },
] as const;

/**
 * Uma barra única representando 100% da renda do mês, dividida entre
 * o que já foi comprometido e o que ainda sobra. Quando o comprometido
 * passa da renda, a barra inteira vira vermelha.
 */
export default function BudgetRail({ summary }: { summary: Summary }) {
  const base = Math.max(summary.income, summary.committed, 1);
  const parts = SEGMENTS.map((segment) => ({
    ...segment,
    value: summary[segment.key],
    width: (summary[segment.key] / base) * 100,
  })).filter((part) => part.value > 0);

  const leftover = Math.max(0, summary.balance);
  const incomeMark = (summary.income / base) * 100;

  return (
    <div>
      <div className="relative h-11 w-full overflow-hidden rounded-lg border border-line bg-raised">
        <div className="flex h-full w-full">
          {parts.map((part) => (
            <div
              key={part.key}
              title={`${part.label}: ${money(part.value)}`}
              style={{
                width: `${part.width}%`,
                background: summary.overLimit ? 'var(--alert)' : part.color,
                opacity: summary.overLimit ? (part.key === 'invoices' ? 0.72 : part.key === 'variable' ? 0.86 : 1) : 1,
              }}
            />
          ))}
          {leftover > 0 && (
            <div
              className="h-full border-l border-line bg-accent/12"
              style={{ width: `${(leftover / base) * 100}%` }}
              title={`Sobra: ${money(leftover)}`}
            />
          )}
        </div>

        {summary.income > 0 && summary.committed > summary.income && (
          <div
            className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-ink/70"
            style={{ left: `${incomeMark}%` }}
          >
            <span className="absolute -top-0.5 left-1 whitespace-nowrap text-[10px] font-semibold text-ink">
              renda
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-soft">
        {parts.map((part) => (
          <span key={part.key} className="inline-flex items-center gap-1.5">
            <i
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: summary.overLimit ? 'var(--alert)' : part.color }}
            />
            {part.label}
            <b className="tnum font-semibold text-ink">{money(part.value)}</b>
          </span>
        ))}
        {parts.length === 0 && <span>Nenhum gasto lançado neste mês ainda.</span>}
        {summary.income > 0 && (
          <span className="ml-auto tnum">{percent(summary.usage)} da renda comprometida</span>
        )}
      </div>
    </div>
  );
}
