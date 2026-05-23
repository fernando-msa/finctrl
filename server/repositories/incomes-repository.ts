import { getAdminDb } from "@/lib/firebase/admin";
import { Income } from "@/types/finance";

export type IncomeInput = Omit<Income, "id">;

export async function listIncomes(uid: string): Promise<Income[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("incomes").get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Income, "id">)
  }));
}

export async function createIncome(uid: string, payload: IncomeInput): Promise<Income> {
  const adminDb = getAdminDb();
  const ref = adminDb.collection("users").doc(uid).collection("incomes").doc();
  await ref.set(payload);

  return {
    id: ref.id,
    ...payload
  };
}

export async function updateIncome(uid: string, incomeId: string, payload: Partial<IncomeInput>): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("incomes").doc(incomeId).update(payload);
}

export async function deleteIncome(uid: string, incomeId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("incomes").doc(incomeId).delete();
}
