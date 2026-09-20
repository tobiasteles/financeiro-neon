'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signIn, signUp, type AuthState } from './actions';

const empty: AuthState = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? 'Só um instante…' : label}
    </button>
  );
}

export default function EntrarPage() {
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [signInState, signInAction] = useFormState(signIn, empty);
  const [signUpState, signUpAction] = useFormState(signUp, empty);
  const state = mode === 'entrar' ? signInState : signUpState;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <header>
               <p className="text-sm text-soft">No Azul</p>
        <h1 className="mt-1 font-display text-[28px] font-semibold leading-tight text-ink">
          Quanto entra, quanto sai e quanto sobra — sem planilha.
        </h1>
      </header>

      <div className="card">
        <div className="mb-5 flex gap-1 rounded-lg border border-line bg-raised p-1">
          {(['entrar', 'criar'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === value ? 'bg-surface text-ink shadow-sm' : 'text-soft'
              }`}
            >
              {value === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form action={mode === 'entrar' ? signInAction : signUpAction} className="space-y-4">
          {mode === 'criar' && (
            <div>
              <label className="label" htmlFor="household">
                Nome da casa
              </label>
              <input id="household" name="household" className="input" placeholder="Casa da Ana e do Léo" />
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="input" />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
              className="input"
            />
          </div>

          {state.error && (
            <p className="rounded-lg border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
              {state.error}
            </p>
          )}

          <Submit label={mode === 'entrar' ? 'Entrar' : 'Criar conta'} />
        </form>
      </div>

      <p className="text-center text-[13px] leading-relaxed text-soft">
        Os lançamentos ficam guardados na conta da sua casa. Quem tem o código de convite vê os
        mesmos números que você.
      </p>
    </main>
  );
}
