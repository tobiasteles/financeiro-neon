'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { createUserWithHousehold, findUserByEmail } from '@/lib/queries';
import { cookieOptions, signSession, SESSION_COOKIE } from '@/lib/session';

export type AuthState = { error?: string };

async function startSession(userId: string) {
  cookies().set(SESSION_COOKIE, await signSession(userId), cookieOptions);
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) return { error: 'Informe e-mail e senha.' };

  const user = await findUserByEmail(email);
  // Mesma mensagem nos dois casos: não revela se o e-mail existe.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: 'E-mail ou senha não conferem. Tente de novo.' };
  }

  await startSession(user.id);
  revalidatePath('/', 'layout');
  redirect('/painel');
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const householdName = String(formData.get('household') ?? '').trim() || 'Minha casa';

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'E-mail inválido.' };
  if (password.length < 8) return { error: 'A senha precisa de pelo menos 8 caracteres.' };

  if (await findUserByEmail(email)) {
    return { error: 'Já existe uma conta com este e-mail. Tente entrar.' };
  }

  const userId = await createUserWithHousehold(email, await hashPassword(password), householdName);

  await startSession(userId);
  revalidatePath('/', 'layout');
  redirect('/painel');
}

export async function signOut() {
  cookies().delete(SESSION_COOKIE);
  revalidatePath('/', 'layout');
  redirect('/entrar');
}
