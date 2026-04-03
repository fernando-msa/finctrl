import { getAdminDb } from "@/lib/firebase/admin";
import { Debt } from "@/types/finance";

export async function listDebts(uid: string): Promise<Debt[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("debts").get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Debt, "id">)
  }));
}
