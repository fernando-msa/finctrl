import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { getSettingsProfile, updateSettingsProfile } from "@/server/repositories/settings-repository";

const settingsSchema = z.object({
  displayName: z.string().min(2).max(80),
  currency: z.enum(["BRL", "USD", "EUR"]),
  weeklyReminder: z.boolean(),
  monthlyIncome: z.number().nonnegative().nullable()
});

export async function GET() {
  try {
    const uid = await getSessionUid();
    const settings = await getSettingsProfile(uid);
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[api/settings/profile] erro ao carregar", error);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar as configurações." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    const payload = settingsSchema.parse(await request.json());
    await updateSettingsProfile(uid, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/settings/profile] erro ao salvar", error);
    return NextResponse.json({ ok: false, error: "Não foi possível salvar as configurações." }, { status: 400 });
  }
}
