import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { getAdminDb } from "@/lib/firebase/admin";

const onboardingEventSchema = z.object({
  name: z.enum(["onboarding_started", "onboarding_step_completed", "onboarding_completed"]),
  stepId: z.string().min(1).max(64).optional(),
  source: z.string().min(2).max(64).default("getting-started")
});

export async function POST(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    const payload = onboardingEventSchema.parse(await request.json());

    const adminDb = getAdminDb();
    const ref = adminDb.collection("users").doc(uid).collection("metricsEvents").doc();

    await ref.set({
      ...payload,
      uid,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, eventId: ref.id });
  } catch (error) {
    console.error("[api/metrics/events] falha ao registrar evento", error);
    return NextResponse.json({ ok: false, error: "Não foi possível registrar o evento." }, { status: 400 });
  }
}
