import { getAdminDb } from "@/lib/firebase/admin";
import { Expense } from "@/types/finance";

export type ExpenseInput = Omit<Expense, "id">;

export async function listExpenses(uid: string): Promise<Expense[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("expenses").get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Expense, "id">)
  }));
}

export async function createExpense(uid: string, payload: ExpenseInput): Promise<Expense> {
  const adminDb = getAdminDb();
  const ref = adminDb.collection("users").doc(uid).collection("expenses").doc();
  await ref.set(payload);

  return {
    id: ref.id,
    ...payload
  };
}

export async function updateExpense(uid: string, expenseId: string, payload: Partial<ExpenseInput>): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("expenses").doc(expenseId).update(payload);
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("expenses").doc(expenseId).delete();
}
