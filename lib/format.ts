const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export const money = (value: number) => brl.format(Number.isFinite(value) ? value : 0);

export const percent = (value: number) =>
  `${(Math.round(value * 10) / 10).toLocaleString('pt-BR')}%`;

/** '2026-09-14' -> Date local (evita o deslocamento de fuso do construtor ISO). */
export function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Primeiro dia do mês em formato ISO, usado como chave de todos os registros. */
export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function shiftMonth(key: string, delta: number) {
  const d = parseDate(key);
  d.setMonth(d.getMonth() + delta);
  return monthKey(d);
}

export function monthLabel(key: string) {
  const label = parseDate(key).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayLabel(iso: string) {
  return parseDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/** Dias que faltam até a data (negativo = já venceu). */
export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(iso).getTime() - today.getTime()) / 86_400_000);
}

/** Converte "1.234,56" ou "1234.56" em número. */
export function toNumber(raw: FormDataEntryValue | null) {
  if (raw == null) return 0;
  const text = String(raw).trim().replace(/[^\d,.-]/g, '');
  const normalized =
    text.includes(',') && text.lastIndexOf(',') > text.lastIndexOf('.')
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}
