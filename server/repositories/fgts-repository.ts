import { getAdminDb } from "@/lib/firebase/admin";
import { FgtsEntry } from "@/types/finance";

export async function listFgtsEntries(uid: string): Promise<FgtsEntry[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("fgts").get();

  return snapshot.docs.map((doc: any) => {
    const raw = doc.data() as Partial<FgtsEntry> & { accountLabel?: string; updatedAt?: string };

    return {
      id: doc.id,
      accountLabel: raw.accountLabel ?? "Conta FGTS",
      balance: typeof raw.balance === "number" ? raw.balance : 0,
      modality: raw.modality ?? "indefinido",
      updatedAt: raw.updatedAt ?? "—"
    };
  });
}
