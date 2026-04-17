import { getAdminDb } from "@/lib/firebase/admin";
import { UserSettingsProfile } from "@/types/finance";

const defaultSettings: UserSettingsProfile = {
  displayName: "",
  currency: "BRL",
  weeklyReminder: true,
  monthlyIncome: null
};

export async function getSettingsProfile(uid: string): Promise<UserSettingsProfile> {
  const adminDb = getAdminDb();
  const doc = await adminDb.collection("users").doc(uid).collection("settings").doc("profile").get();

  if (!doc.exists) {
    return defaultSettings;
  }

  const raw = doc.data() as Partial<UserSettingsProfile>;

  return {
    displayName: typeof raw.displayName === "string" ? raw.displayName : "",
    currency: raw.currency === "USD" || raw.currency === "EUR" ? raw.currency : "BRL",
    weeklyReminder: Boolean(raw.weeklyReminder),
    monthlyIncome: typeof raw.monthlyIncome === "number" && Number.isFinite(raw.monthlyIncome) ? raw.monthlyIncome : null,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined
  };
}

export async function updateSettingsProfile(
  uid: string,
  payload: Omit<UserSettingsProfile, "updatedAt">
): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb.collection("users").doc(uid).collection("settings").doc("profile").set({
    ...payload,
    updatedAt: new Date().toISOString()
  });
}
