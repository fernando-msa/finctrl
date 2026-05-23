import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppCheckError, validateAppCheck } from "@/lib/firebase/app-check";

const feedbackSchema = z.object({
  message: z.string().min(5).max(500),
  score: z.number().int().min(0).max(10)
});

export async function POST(request: NextRequest) {
  try {
    const appCheckToken = request.headers.get("x-firebase-appcheck") ?? undefined;
    await validateAppCheck(appCheckToken);

    const payload = feedbackSchema.parse(await request.json());

    return NextResponse.json({ ok: true, payload });
  } catch (error) {
    if (error instanceof AppCheckError) {
      return NextResponse.json({ ok: false, error: "App Check inválido." }, { status: 403 });
    }
    console.error("[api/diagnostics/feedback] erro:", error);
    return NextResponse.json({ ok: false, error: "Erro ao enviar feedback." }, { status: 400 });
  }
}
