import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listIncomes } from "@/server/repositories/incomes-repository";
import { Income } from "@/types/finance";
import { IncomesManager } from "@/components/incomes/incomes-manager";

export default async function IncomesPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[incomes] sessão sem UID válido:", error);
    redirect("/login");
  }

  let incomes: Income[] = [];
  let loadError = "";

  try {
    incomes = await listIncomes(uid);
  } catch (error) {
    console.error("[incomes] falha ao buscar receitas no Firestore:", error);
    loadError = "Não foi possível carregar suas receitas agora. Você pode tentar novamente em instantes.";
  }

  return (
    <>
      {loadError ? <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p> : null}
      <IncomesManager initialIncomes={incomes} />
    </>
  );
}
