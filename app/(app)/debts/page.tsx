import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listDebts } from "@/server/repositories/debts-repository";
import { Debt } from "@/types/finance";
import { DebtsManager } from "@/components/debts/debts-manager";

export default async function DebtsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[debts] sessão sem UID válido:", error);
    redirect("/login");
  }

  let debts: Debt[] = [];
  let loadError = "";

  try {
    debts = await listDebts(uid);
  } catch (error) {
    console.error("[debts] falha ao buscar dívidas no Firestore:", error);
    loadError = "Não foi possível carregar suas dívidas agora. Você pode tentar novamente em instantes.";
  }

  return (
    <>
      {loadError ? <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p> : null}
      <DebtsManager initialDebts={debts} />
    </>
  );
}
