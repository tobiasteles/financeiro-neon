/**
 * Cria as tabelas no Neon a partir de db/schema.sql.
 *   npm run db:setup
 * Precisa de DATABASE_URL em .env.local. Rodar de novo é seguro:
 * todo comando usa "if not exists".
 */
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL não encontrada. Copie .env.example para .env.local e preencha.');
  process.exit(1);
}

const sql = neon(url);
const statements = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((line) => line.trim().startsWith('--')));

for (const statement of statements) {
  const label = statement.replace(/\s+/g, ' ').slice(0, 64);
  try {
    await sql(statement, []);
    console.log('ok  ', label);
  } catch (error) {
    console.error('erro', label, '\n  ', error.message);
    process.exit(1);
  }
}

console.log(`\n${statements.length} comandos aplicados. Banco pronto.`);
