import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { createFgtsEntry } from "@/server/repositories/fgts-repository";

const fgtsSchema = z.object({
  accountLabel: z.string().min(2),
  balance: z.number().min(0),
  modality: z.enum(["saque_aniversario", "saque_rescisao", "indefinido"]),
  updatedAt: z.string().min(7)
});

export async function POST(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    const payload = fgtsSchema.parse(await request.json());
    const entry = await createFgtsEntry(uid, payload);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    console.error("[api/fgts] erro ao criar registro", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar o registro de FGTS." }, { status: 400 });
  }
}
