import { getAdminDb } from "@/lib/firebase/admin";
import { Goal } from "@/types/finance";

export async function listGoals(uid: string): Promise<Goal[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("goals").get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Goal, "id">)
  }));
}
