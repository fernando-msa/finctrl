import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listGoals } from "@/server/repositories/goals-repository";
import { Goal } from "@/types/finance";
import { GoalsManager } from "@/components/goals/goals-manager";

export default async function GoalsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[goals] sessão sem UID válido:", error);
    redirect("/login");
  }

  let goals: Goal[] = [];
  let loadError = "";
  try {
    goals = await listGoals(uid);
  } catch (error) {
    console.error("[goals] falha ao buscar metas no Firestore:", error);
    loadError = "Não foi possível carregar suas metas agora. Você pode tentar novamente em instantes.";
  }

  return (
    <>
      {loadError ? <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p> : null}
      <GoalsManager initialGoals={goals} />
    </>
  );
}
