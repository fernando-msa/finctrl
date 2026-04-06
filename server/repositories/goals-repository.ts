import { getAdminDb } from "@/lib/firebase/admin";
import { Goal } from "@/types/finance";

export type GoalInput = Omit<Goal, "id">;

export async function listGoals(uid: string): Promise<Goal[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb.collection("users").doc(uid).collection("goals").get();

  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as Omit<Goal, "id">)
  }));
}

export async function createGoal(uid: string, payload: GoalInput): Promise<Goal> {
  const adminDb = getAdminDb();
  const ref = adminDb.collection("users").doc(uid).collection("goals").doc();
  await ref.set(payload);
  return { id: ref.id, ...payload };
}

export async function updateGoal(uid: string, goalId: string, payload: Partial<GoalInput>): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("goals").doc(goalId).update(payload);
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("goals").doc(goalId).delete();
}
