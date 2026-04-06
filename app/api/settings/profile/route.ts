import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { getAdminDb } from "@/lib/firebase/admin";

const settingsSchema = z.object({
  displayName: z.string().min(2).max(80),
  currency: z.enum(["BRL", "USD", "EUR"]),
  weeklyReminder: z.boolean()
});

export async function GET() {
  try {
    const uid = await getSessionUid();
    const adminDb = getAdminDb();
    const doc = await adminDb.collection("users").doc(uid).collection("settings").doc("profile").get();
    return NextResponse.json({ ok: true, settings: doc.exists ? doc.data() : null });
  } catch (error) {
    console.error("[api/settings/profile] erro ao carregar", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar as configurações." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    const payload = settingsSchema.parse(await request.json());
    const adminDb = getAdminDb();
    await adminDb.collection("users").doc(uid).collection("settings").doc("profile").set({
      ...payload,
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/settings/profile] erro ao salvar", error);
    return NextResponse.json({ ok: false, error: "Não foi possível salvar as configurações." }, { status: 400 });
  }
}
