import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import * as db from "@/lib/queries";
import { summarize } from "@/lib/finance";
import { monthKey } from "@/lib/format";
import SummaryPanel from "@/components/SummaryPanel";
import MonthNav from "@/components/MonthNav";
import IncomeCard from "@/components/IncomeCard";
import ExpensesSection from "@/components/ExpensesSection";
import CardsSection from "@/components/CardsSection";
import RuleCard from "@/components/RuleCard";
import HouseholdBar from "@/components/HouseholdBar";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "gastos", label: "Gastos" },
  { key: "cartoes", label: "Cartões" },
  { key: "regra", label: "50/30/20" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default async function Painel({
  searchParams,
}: {
  searchParams: { mes?: string; aba?: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/entrar");

  const month = /^\d{4}-\d{2}-01$/.test(searchParams.mes ?? "")
    ? searchParams.mes!
    : monthKey();
  const tab: Tab = (TABS.find((t) => t.key === searchParams.aba)?.key ??
    "gastos") as Tab;

  const [household, income, expenses, cards, invoices, purchaseTotals] =
    await Promise.all([
      db.getHousehold(user.householdId),
      db.getIncome(user.householdId, month),
      db.listExpenses(user.householdId, month),
      db.listCards(user.householdId),
      db.listInvoices(user.householdId, month),
      db.listCardPurchaseTotals(user.householdId, month),
    ]);

  const summary = summarize(Number(income?.amount ?? 0), expenses, invoices);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-16 pt-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[20px] font-semibold text-ink">
          No Azul
        </h1>
        <MonthNav month={month} tab={tab} />
      </div>

      <HouseholdBar
        name={household?.name ?? "Minha casa"}
        inviteCode={household?.invite_code ?? "—"}
        email={user.email}
      />

      <SummaryPanel summary={summary} />

      <IncomeCard month={month} income={income} />

      <nav className="flex gap-1 rounded-lg border border-line bg-surface p-1">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/painel?mes=${month}&aba=${item.key}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={`flex-1 rounded-md px-3 py-2 text-center text-[14px] font-medium transition ${
              tab === item.key
                ? "bg-accent text-white"
                : "text-soft hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "gastos" && (
        <ExpensesSection month={month} expenses={expenses} cards={cards} />
      )}
      {tab === "cartoes" && (
        <CardsSection
          month={month}
          cards={cards}
          invoices={invoices}
          purchaseTotals={purchaseTotals}
        />
      )}
      {tab === "regra" && (
        <RuleCard
          income={summary.income}
          expenses={expenses}
          invoices={invoices}
        />
      )}
    </main>
  );
}
