import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionUid, UnauthenticatedError } from "@/lib/firebase/auth";
import { createGoal } from "@/server/repositories/goals-repository";

const goalSchema = z.object({
  title: z.string().min(2),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0),
  dueDate: z.string().min(7)
});

export async function POST(request: NextRequest) {
  try {
    const uid = await getApiSessionUid();
    const payload = goalSchema.parse(await request.json());
    const goal = await createGoal(uid, payload);
    return NextResponse.json({ ok: true, goal });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/goals] erro ao criar meta", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar a meta." }, { status: 400 });
  }
}
