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

export async function listExpensesByMonth(uid: string, month: string): Promise<Expense[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("expenses")
    .where("competenceDate", "==", month)
    .get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Expense, "id">)
  }));
}

export async function replicateRecurringExpenses(uid: string, fromMonth: string, toMonth: string): Promise<number> {
  const allExpenses = await listExpenses(uid);
  const recurring = allExpenses.filter((e) => e.recurring && e.competenceDate === fromMonth);

  if (recurring.length === 0) return 0;

  const existing = allExpenses.filter((e) => e.competenceDate === toMonth);
  const existingKeys = new Set(existing.map((e) => e.category));

  let replicated = 0;
  for (const expense of recurring) {
    if (existingKeys.has(expense.category)) continue;
    await createExpense(uid, {
      category: expense.category,
      description: expense.description ?? "",
      amount: expense.amount,
      recurring: true,
      competenceDate: toMonth
    });
    replicated++;
  }

  return replicated;
}
