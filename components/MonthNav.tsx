import Link from 'next/link';
import { monthLabel, shiftMonth } from '@/lib/format';

export default function MonthNav({ month, tab }: { month: string; tab: string }) {
  const href = (value: string) => `/painel?mes=${value}&aba=${tab}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={href(shiftMonth(month, -1))}
        aria-label="Mês anterior"
        className="btn-ghost h-10 w-10 !px-0"
      >
        ‹
      </Link>
      <span className="min-w-[9.5rem] text-center font-display text-[15px] font-semibold text-ink">
        {monthLabel(month)}
      </span>
      <Link
        href={href(shiftMonth(month, 1))}
        aria-label="Próximo mês"
        className="btn-ghost h-10 w-10 !px-0"
      >
        ›
      </Link>
    </div>
  );
}
