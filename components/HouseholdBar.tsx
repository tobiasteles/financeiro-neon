import { signOut } from '@/app/entrar/actions';
import { joinHousehold } from '@/app/painel/actions';

export default function HouseholdBar({
  name,
  inviteCode,
  email,
}: {
  name: string;
  inviteCode: string;
  email: string;
}) {
  return (
    <details className="card !p-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-ink">{name}</p>
          <p className="truncate text-[12px] text-soft">{email}</p>
        </div>
        <span className="ml-auto text-[13px] text-soft">Ajustes</span>
      </summary>

      <div className="space-y-4 border-t border-line px-4 py-4 sm:px-5">
        <div>
          <p className="text-[13px] text-soft">Código de convite da casa</p>
          <p className="tnum mt-1 font-display text-[20px] font-semibold tracking-[0.12em] text-ink">
            {inviteCode}
          </p>
          <p className="mt-1 text-[13px] text-soft">
            Quem usar este código passa a ver e editar os mesmos lançamentos.
          </p>
        </div>

        <form action={joinHousehold} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <label className="label" htmlFor="code">
              Entrar em outra casa
            </label>
            <input id="code" name="code" placeholder="Cole o código aqui" className="input uppercase" />
          </div>
          <button type="submit" className="btn-ghost">
            Entrar na casa
          </button>
        </form>

        <form action={signOut} className="border-t border-line pt-4">
          <button type="submit" className="text-[14px] font-medium text-alert underline underline-offset-4">
            Sair da conta
          </button>
        </form>
      </div>
    </details>
  );
}
