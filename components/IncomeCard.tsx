import { saveIncome } from '@/app/painel/actions';
import type { Income } from '@/lib/types';

export default function IncomeCard({ month, income }: { month: string; income: Income | null }) {
  return (
    <form action={saveIncome} className="card">
      <input type="hidden" name="month" value={month} />

      <h2 className="font-display text-[17px] font-semibold text-ink">Renda do mês</h2>
      <p className="mt-0.5 text-[13px] text-soft">
        Salário, pró-labore, aluguel recebido — tudo o que entra neste mês.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="income-amount">
            Valor
          </label>
          <input
            id="income-amount"
            name="amount"
            inputMode="decimal"
            defaultValue={income?.amount ?? ''}
            placeholder="4.500,00"
            className="input tnum"
          />
        </div>
        <div>
          <label className="label" htmlFor="income-source">
            De onde vem
          </label>
          <input
            id="income-source"
            name="source"
            defaultValue={income?.source ?? ''}
            placeholder="Salário + freelas"
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary sm:w-auto">
          Salvar renda
        </button>
      </div>
    </form>
  );
}
