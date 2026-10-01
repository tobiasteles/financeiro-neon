import { CATEGORY_LIST, type Category } from "./types";

export interface ParsedTransaction {
  description: string;
  amount: number;
  category: Category;
  month: string; // 'YYYY-MM-01', mês em que a compra foi feita
}

// Linhas de resumo que não são compras — mesmo que comecem com uma data.
// Linhas de resumo que não são compras — mesmo que comecem com uma data.
const NOISE_WORDS = [
  "saldo anterior",
  "pagamento efetuado",
  "pagamento recebido",
  "limite dispon",
  "total da fatura",
  "total desta fatura",
  "encargos",
  "juros rotativo",
  "multa",
  "iof",
  "anuidade diferenciada",
  // Movimentações de conta que às vezes aparecem no mesmo PDF da fatura —
  // nomenclatura padronizada pelo Banco Central, vale pra qualquer banco.
  "pix enviado",
  "pix recebido",
  "pix - enviado",
  "pix - recebido",
  "compra no débito",
  "compra no debito",
  "débito em conta",
  "debito em conta",
  "transferência enviada",
  "transferencia enviada",
  "transferência recebida",
  "transferencia recebida",
  "ted enviada",
  "ted recebida",
  "doc enviado",
  "pagamento de boleto",
  "boleto pago",
  "saque",
  "depósito",
  "deposito",
  "resgate",
  "aplicação",
  "aplicacao",
];

const CATEGORY_KEYWORDS: Partial<Record<Category, string[]>> = {
  moradia: [
    "aluguel",
    "condomin",
    "energia",
    "luz",
    "copel",
    "cemig",
    "enel",
    "sabesp",
    "agua",
    "água",
    "internet",
    "vivo fibra",
    "claro",
    "net virtua",
    "iptu",
    "gas natural",
  ],
  alimentacao: [
    "mercado",
    "supermerc",
    "ifood",
    "restaurant",
    "lanchonete",
    "padaria",
    "acougue",
    "açougue",
    "hortifruti",
    "pao de acucar",
    "carrefour",
    "assai",
    "extra",
    "mcdonalds",
    "mcdonald's",
    "burger",
    "pizza",
    "habib",
  ],
  transporte: [
    "posto",
    "combustivel",
    "combustível",
    "gasolina",
    "uber",
    "99app",
    "taxi",
    "estacionamento",
    "pedagio",
    "pedágio",
    "sem parar",
    "veloe",
    "localiza",
    "mecanica",
    "oficina",
  ],
  saude: [
    "farmacia",
    "farmácia",
    "drogaria",
    "drogasil",
    "raia",
    "hospital",
    "clinica",
    "clínica",
    "laboratorio",
    "laboratório",
    "unimed",
    "amil",
    "dentista",
  ],
  lazer: [
    "cinema",
    "netflix",
    "spotify",
    "steam",
    "playstation",
    "ingresso",
    "balada",
    "viagem",
    "booking",
    "airbnb",
    "academia",
    "smart fit",
  ],
};

// "12/09  UBER *TRIP 8321  R$ 35,90"  ->  dia, mês, descrição, valor
const LINE =
  /^(\d{2})\/(\d{2})(?:\/\d{2,4})?\s+(.+?)\s+(?:R\$\s*)?(-?\d{1,3}(?:\.\d{3})*,\d{2})$/;

function guessCategory(description: string): Category {
  const text = description.toLowerCase();
  for (const category of CATEGORY_LIST) {
    if (CATEGORY_KEYWORDS[category]?.some((word) => text.includes(word)))
      return category;
  }
  return "outros";
}

function toAmount(raw: string) {
  const value = Number.parseFloat(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** Descobre o ano da compra a partir do mês da fatura (lida com virada dez/jan). */
function resolveMonth(day: number, month: number, invoiceMonth: string) {
  const [invoiceYear, invoiceMonthNum] = invoiceMonth.split("-").map(Number);
  let year = invoiceYear;
  if (month !== invoiceMonthNum) {
    const previous = invoiceMonthNum === 1 ? 12 : invoiceMonthNum - 1;
    if (month === previous && invoiceMonthNum === 1) year = invoiceYear - 1;
  }
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * Lê o texto extraído de uma fatura em PDF e devolve as linhas que parecem
 * compras: data + descrição + valor. Ignora linhas de saldo, pagamento e
 * limite. Funciona melhor com faturas simples em texto — extratos muito
 * visuais (com colunas, tabelas complexas) podem não ser reconhecidos
 * direito, por isso vale sempre conferir a lista depois de importar.
 */
export function extractTransactions(
  text: string,
  invoiceMonth: string,
): ParsedTransaction[] {
  const items: ParsedTransaction[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const match = line.match(LINE);
    if (!match) continue;

    const [, dd, mm, description, amountRaw] = match;
    if (NOISE_WORDS.some((word) => description.toLowerCase().includes(word)))
      continue;

    const amount = toAmount(amountRaw);
    if (amount === null || amount <= 0) continue; // ignora estornos e valores zerados

    items.push({
      description: description.trim(),
      amount,
      category: guessCategory(description),
      month: resolveMonth(Number(dd), Number(mm), invoiceMonth),
    });
  }

  return items;
}
