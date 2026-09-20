import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { sql } from './db';
import { readSession, SESSION_COOKIE } from './session';

const derive = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Guarda "salt:hash" em hexadecimal. A senha em si nunca toca o banco. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = await derive(password, Buffer.from(saltHex, 'hex'), expected.length);

  // Comparação de tempo constante: não vaza informação pelo tempo de resposta.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export interface SessionUser {
  id: string;
  email: string;
  householdId: string;
}

/** Usuário da requisição atual, já com a casa ativa resolvida. */
export async function currentUser(): Promise<SessionUser | null> {
  const userId = await readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const rows = (await sql`
    select u.id, u.email, m.household_id
    from users u
    left join household_members m on m.user_id = u.id
    where u.id = ${userId}
    order by m.created_at desc
    limit 1
  `) as { id: string; email: string; household_id: string | null }[];

  const row = rows[0];
  if (!row) return null;

  // Conta sem casa (por exemplo, a casa foi apagada): recria uma na hora,
  // senão /painel e /entrar ficariam se redirecionando em círculo.
  if (!row.household_id) {
    const houses = (await sql`
      insert into households (name) values ('Minha casa') returning id
    `) as { id: string }[];
    await sql`
      insert into household_members (household_id, user_id) values (${houses[0].id}, ${row.id})
    `;
    return { id: row.id, email: row.email, householdId: houses[0].id };
  }

  return { id: row.id, email: row.email, householdId: row.household_id };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error('Sessão expirada. Entre de novo.');
  return user;
}
