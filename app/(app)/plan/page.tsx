import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listDebts } from "@/server/repositories/debts-repository";
import { generateFinancialPlan } from "@/server/use-cases/generate-plan";
import { Debt } from "@/types/finance";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function PlanPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[plan] sessão sem UID válido, fallback para legado:", error);
    redirect("/dashboard");
  }

  let debts: Debt[] = [];
  try {
    debts = await listDebts(uid);
  } catch (error) {
    console.error("[plan] falha ao buscar dívidas no Firestore, fallback para legado:", error);
    redirect("/dashboard");
  }

  const monthlyDebtCommitment = debts
    .filter((debt) => debt.status !== "quitada")
    .reduce((acc, debt) => acc + debt.principal * 0.08, 0);
  const assumedIncome = Math.max(monthlyDebtCommitment * 5, 2000);

  const plan = await generateFinancialPlan({
    uid,
    debts,
    income: assumedIncome
  });

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Plano</h1>
        <p className="mt-1 text-sm text-slate-600">Plano automático para priorização de dívidas e organização do caixa.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Fluxo de caixa livre" value={formatCurrency(plan.freeCashFlow)} />
          <Kpi label="Aporte sugerido em metas" value={formatCurrency(plan.suggestedInvestmentForGoals)} />
          <Kpi label="Dívidas priorizadas" value={String(plan.recommendations.length)} />
        </div>
      </header>

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ordem de priorização (método avalanche)</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {plan.recommendations.length === 0 ? (
            <li>Nenhuma dívida elegível para priorização no momento.</li>
          ) : (
            plan.recommendations.map((item) => (
              <li key={item.debtId}>
                <span className="font-medium">{item.creditor}</span> · posição {item.position}
              </li>
            ))
          )}
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
