import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateAppCheck } from "@/lib/firebase/app-check";

const feedbackSchema = z.object({
  message: z.string().min(5).max(500),
  score: z.number().int().min(0).max(10)
});

export async function POST(request: NextRequest) {
  const appCheckToken = request.headers.get("x-firebase-appcheck") ?? undefined;
  validateAppCheck(appCheckToken);

  const payload = feedbackSchema.parse(await request.json());

  return NextResponse.json({ ok: true, payload });
}
