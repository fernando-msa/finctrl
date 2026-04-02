import { SummaryChart } from "@/components/dashboard/summary-chart";
import { getDashboardSummary } from "@/features/dashboard/get-summary";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard inteligente</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi title="Saldo mensal" value={summary.monthlyBalance} />
        <Kpi title="Gastos totais" value={summary.totalExpenses} />
        <Kpi title="Dívidas abertas" value={summary.openDebts} />
        <Kpi title="Progresso de metas" value={summary.goalsProgress} suffix="%" />
      </div>
      <SummaryChart data={summary.chart} />
    </section>
  );
}

function Kpi({ title, value, suffix = "" }: { title: string; value: number; suffix?: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <strong className="text-2xl text-brand-700">
        {value}
        {suffix}
      </strong>
    </article>
  );
}
