import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listFgtsEntries } from "@/server/repositories/fgts-repository";
import { FgtsEntry } from "@/types/finance";
import { FgtsManager } from "@/components/fgts/fgts-manager";

export default async function FgtsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[fgts] sessão sem UID válido:", error);
    redirect("/login");
  }

  let entries: FgtsEntry[] = [];
  let loadError = "";

  try {
    entries = await listFgtsEntries(uid);
  } catch (error) {
    console.error("[fgts] falha ao buscar dados de FGTS no Firestore:", error);
    loadError = "Não foi possível carregar seus registros de FGTS agora. Você pode tentar novamente em instantes.";
  }

  return (
    <>
      {loadError ? <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p> : null}
      <FgtsManager initialEntries={entries} />
    </>
  );
}
