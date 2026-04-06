import { getAdminDb } from "@/lib/firebase/admin";
import { FgtsEntry } from "@/types/finance";

export type FgtsEntryInput = Omit<FgtsEntry, "id">;

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

export async function createFgtsEntry(uid: string, payload: FgtsEntryInput): Promise<FgtsEntry> {
  const adminDb = getAdminDb();
  const ref = adminDb.collection("users").doc(uid).collection("fgts").doc();
  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function updateFgtsEntry(uid: string, entryId: string, payload: Partial<FgtsEntryInput>): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("fgts").doc(entryId).update(payload);
}

export async function deleteFgtsEntry(uid: string, entryId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("fgts").doc(entryId).delete();
}
