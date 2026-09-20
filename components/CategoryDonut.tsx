import { money, percent } from '@/lib/format';

interface Slice {
  key: string;
  label: string;
  color: string;
  value: number;
  share: number;
}

/** Rosca desenhada com stroke-dasharray — sem biblioteca de gráficos. */
export default function CategoryDonut({ slices, total }: { slices: Slice[]; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90" role="img"
           aria-label="Distribuição dos gastos por categoria">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--line)" strokeWidth="18" />
        {slices.map((slice) => {
          const length = (slice.share / 100) * circumference;
          const dash = `${Math.max(length - 2, 0)} ${circumference - Math.max(length - 2, 0)}`;
          const element = (
            <circle
              key={slice.key}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return element;
        })}
      </svg>

      <ul className="w-full space-y-2">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-2.5 text-[14px]">
            <i className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color }} />
            <span className="text-ink">{slice.label}</span>
            <span className="tnum ml-auto text-soft">{percent(slice.share)}</span>
            <b className="tnum w-24 text-right font-semibold text-ink">{money(slice.value)}</b>
          </li>
        ))}
        <li className="flex items-center gap-2.5 border-t border-line pt-2 text-[14px]">
          <span className="text-soft">Total em gastos</span>
          <b className="tnum ml-auto font-semibold text-ink">{money(total)}</b>
        </li>
      </ul>
    </div>
  );
}
