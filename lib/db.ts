import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida. Copie .env.example para .env.local.');
}

/**
 * Driver HTTP do Neon: cada query é uma requisição isolada, sem pool para
 * gerenciar. Funciona tanto no runtime Node quanto no Edge.
 *
 * Uso: const rows = await sql`select * from expenses where id = ${id}`;
 * Os valores interpolados viram parâmetros ($1, $2...), então não há
 * risco de SQL injection.
 */
export const sql = neon(process.env.DATABASE_URL);

/** Executa a query e devolve as linhas já tipadas. */
export async function query<T>(promise: Promise<Record<string, unknown>[]>) {
  return (await promise) as T[];
}
