import { getAdminDb } from "@/lib/firebase/admin";
import { Expense } from "@/types/finance";

export async function listExpenses(uid: string): Promise<Expense[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("expenses").get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Expense, "id">)
  }));
}
