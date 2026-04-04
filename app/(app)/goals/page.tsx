import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listGoals } from "@/server/repositories/goals-repository";
import { Goal } from "@/types/finance";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export default async function GoalsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[goals] sessão sem UID válido, fallback para legado:", error);
    redirect("/pages/metas.html" as any);
  }

  let goals: Goal[] = [];
  try {
    goals = await listGoals(uid);
  } catch (error) {
    console.error("[goals] falha ao buscar metas no Firestore, fallback para legado:", error);
    redirect("/pages/metas.html" as any);
  }

  const totalTarget = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const globalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Metas</h1>
        <p className="mt-1 text-sm text-slate-600">Acompanhe o progresso das suas metas financeiras.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Valor alvo total" value={formatCurrency(totalTarget)} />
          <Kpi label="Acumulado atual" value={formatCurrency(totalCurrent)} />
          <Kpi label="Progresso geral" value={formatPercent(globalProgress)} />
        </div>
      </header>

      <article className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Meta</th>
              <th className="px-4 py-3 font-medium">Atual</th>
              <th className="px-4 py-3 font-medium">Alvo</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3 font-medium">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  Nenhuma meta cadastrada ainda.
                </td>
              </tr>
            ) : (
              goals.map((goal) => {
                const progress = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;

                return (
                  <tr className="border-t border-slate-100" key={goal.id}>
                    <td className="px-4 py-3">{goal.title}</td>
                    <td className="px-4 py-3">{formatCurrency(goal.currentAmount)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(goal.targetAmount)}</td>
                    <td className="px-4 py-3">{goal.dueDate}</td>
                    <td className="px-4 py-3">{formatPercent(progress)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
