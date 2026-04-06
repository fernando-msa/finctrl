import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listExpenses } from "@/server/repositories/expenses-repository";
import { Expense } from "@/types/finance";
import { ExpensesManager } from "@/components/expenses/expenses-manager";

export default async function ExpensesPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[expenses] sessão sem UID válido:", error);
    redirect("/login");
  }

  let expenses: Expense[] = [];
  let loadError = "";

  try {
    expenses = await listExpenses(uid);
  } catch (error) {
    console.error("[expenses] falha ao buscar despesas no Firestore:", error);
    loadError = "Não foi possível carregar suas despesas agora. Você pode tentar novamente em instantes.";
  }

  return (
    <>
      {loadError ? <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p> : null}
      <ExpensesManager initialExpenses={expenses} />
    </>
  );
}
