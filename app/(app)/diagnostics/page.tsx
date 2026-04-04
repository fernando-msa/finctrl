import { redirect } from "next/navigation";
import { calculateFinancialScore } from "@/features/diagnostics/score";
import { getSessionUid } from "@/lib/firebase/auth";
import { listDebts } from "@/server/repositories/debts-repository";
import { listExpenses } from "@/server/repositories/expenses-repository";
import { Debt, Expense } from "@/types/finance";

function buildRecommendations(params: {
  overdueDebts: number;
  debtRatio: number;
  commitment: number;
  score: number;
}) {
  const items: string[] = [];

  if (params.overdueDebts > 0) {
    items.push("Priorize renegociação das dívidas em atraso ainda nesta semana.");
  }
  if (params.commitment > 0.6) {
    items.push("Seu comprometimento mensal está alto; revise despesas fixas e parcelamentos.");
  }
  if (params.debtRatio > 0.5) {
    items.push("Direcione aportes extras para reduzir principal das dívidas com maior taxa.");
  }
  if (params.score >= 70) {
    items.push("Mantenha consistência dos aportes e monte reserva para metas de médio prazo.");
  }

  if (items.length < 3) {
    items.push("Revise seu plano quinzenalmente para manter o progresso financeiro.");
  }

  return items.slice(0, 3);
}

export default async function DiagnosticsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[diagnostics] sessão sem UID válido, fallback para legado:", error);
    redirect("/pages/diagnostico.html" as any);
  }

  let debts: Debt[] = [];
  let expenses: Expense[] = [];
  try {
    [debts, expenses] = await Promise.all([listDebts(uid), listExpenses(uid)]);
  } catch (error) {
    console.error("[diagnostics] falha ao buscar dados no Firestore, fallback para legado:", error);
    redirect("/pages/diagnostico.html" as any);
  }

  const totalDebt = debts.filter((debt) => debt.status !== "quitada").reduce((acc, debt) => acc + debt.principal, 0);
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const assumedIncome = Math.max(totalExpenses * 1.3, 1);
  const debtRatio = Math.min(1, totalDebt / (assumedIncome * 12));
  const avgInterestRate = debts.length > 0 ? debts.reduce((acc, debt) => acc + debt.annualInterestRate, 0) / debts.length : 0;
  const incomeCommitted = Math.min(1, totalExpenses / assumedIncome);
  const savingsCapacity = Math.max(0, 1 - incomeCommitted);

  const score = calculateFinancialScore({
    debtRatio,
    avgInterestRate,
    incomeCommitted,
    savingsCapacity
  });

  const overdueDebts = debts.filter((debt) => debt.status === "atraso").length;
  const recommendations = buildRecommendations({ overdueDebts, debtRatio, commitment: incomeCommitted, score });

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Diagnóstico</h1>
        <p className="mt-1 text-sm text-slate-600">Score e recomendações baseadas no seu retrato financeiro atual.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Kpi label="Score" value={`${score}/100`} />
          <Kpi label="Dívidas em atraso" value={String(overdueDebts)} />
          <Kpi label="Comprometimento" value={`${(incomeCommitted * 100).toFixed(1)}%`} />
          <Kpi label="Capacidade de poupar" value={`${(savingsCapacity * 100).toFixed(1)}%`} />
        </div>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recomendações prioritárias</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </article>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <strong className="text-lg text-brand-700">{value}</strong>
    </div>
  );
}
