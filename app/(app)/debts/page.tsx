import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listDebts } from "@/server/repositories/debts-repository";
import { Debt } from "@/types/finance";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const statusLabel: Record<string, string> = {
  ativa: "Ativa",
  quitada: "Quitada",
  atraso: "Em atraso"
};

export default async function DebtsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[debts] sessão sem UID válido, fallback para legado:", error);
    redirect("/pages/dividas.html" as any);
  }

  let debts: Debt[] = [];
  try {
    debts = await listDebts(uid);
  } catch (error) {
    console.error("[debts] falha ao buscar dívidas no Firestore, fallback para legado:", error);
    redirect("/pages/dividas.html" as any);
  }

  const openDebts = debts.filter((debt) => debt.status !== "quitada");
  const openPrincipal = openDebts.reduce((acc, debt) => acc + debt.principal, 0);
  const averageRate = openDebts.length
    ? openDebts.reduce((acc, debt) => acc + debt.annualInterestRate, 0) / openDebts.length
    : 0;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dívidas</h1>
        <p className="mt-1 text-sm text-slate-600">Acompanhe status, principal e taxa média das suas dívidas.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Total em aberto" value={formatCurrency(openPrincipal)} />
          <Kpi label="Dívidas abertas" value={String(openDebts.length)} />
          <Kpi label="Taxa média anual" value={`${averageRate.toFixed(2)}%`} />
        </div>
      </header>

      <article className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Credor</th>
              <th className="px-4 py-3 font-medium">Principal</th>
              <th className="px-4 py-3 font-medium">Taxa anual</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {debts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                  Nenhuma dívida cadastrada ainda.
                </td>
              </tr>
            ) : (
              debts.map((debt) => (
                <tr className="border-t border-slate-100" key={debt.id}>
                  <td className="px-4 py-3">{debt.creditor}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(debt.principal)}</td>
                  <td className="px-4 py-3">{debt.annualInterestRate.toFixed(2)}%</td>
                  <td className="px-4 py-3">{statusLabel[debt.status] ?? debt.status}</td>
                </tr>
              ))
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
