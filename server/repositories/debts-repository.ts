import { getAdminDb } from "@/lib/firebase/admin";
import { Debt } from "@/types/finance";

export type DebtInput = Omit<Debt, "id">;

export async function listDebts(uid: string): Promise<Debt[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("debts").get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Debt, "id">)
  }));
}

export async function createDebt(uid: string, payload: DebtInput): Promise<Debt> {
  const adminDb = getAdminDb();
  const ref = adminDb.collection("users").doc(uid).collection("debts").doc();
  await ref.set(payload);

  return {
    id: ref.id,
    ...payload
  };
}

export async function updateDebt(uid: string, debtId: string, payload: Partial<DebtInput>): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("debts").doc(debtId).update(payload);
}

export async function deleteDebt(uid: string, debtId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("debts").doc(debtId).delete();
}
