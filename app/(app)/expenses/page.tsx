import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listExpenses } from "@/server/repositories/expenses-repository";
import { Expense } from "@/types/finance";

const categoryLabel: Record<string, string> = {
  moradia: "Moradia",
  transporte: "Transporte",
  alimentacao: "Alimentação",
  saude: "Saúde",
  educacao: "Educação",
  lazer: "Lazer",
  outros: "Outros"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ExpensesPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[expenses] sessão sem UID válido, fallback para legado:", error);
    redirect("/dashboard");
  }

  let expenses: Expense[] = [];
  try {
    expenses = await listExpenses(uid);
  } catch (error) {
    console.error("[expenses] falha ao buscar despesas no Firestore, fallback para legado:", error);
    redirect("/dashboard");
  }

  const total = expenses.reduce((acc, item) => acc + item.amount, 0);
  const recurring = expenses.filter((item) => item.recurring).reduce((acc, item) => acc + item.amount, 0);

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Despesas</h1>
        <p className="mt-1 text-sm text-slate-600">Resumo das despesas cadastradas no seu perfil.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Total cadastrado" value={formatCurrency(total)} />
          <Kpi label="Recorrentes" value={formatCurrency(recurring)} />
          <Kpi label="Itens" value={String(expenses.length)} />
        </div>
      </header>

      <article className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Competência</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                  Nenhuma despesa cadastrada ainda.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr className="border-t border-slate-100" key={expense.id}>
                  <td className="px-4 py-3">{categoryLabel[expense.category] ?? expense.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3">{expense.competenceDate}</td>
                  <td className="px-4 py-3">{expense.recurring ? "Recorrente" : "Pontual"}</td>
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
