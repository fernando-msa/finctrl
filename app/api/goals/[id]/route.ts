import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionUid, UnauthenticatedError } from "@/lib/firebase/auth";
import { deleteGoal, updateGoal } from "@/server/repositories/goals-repository";

const updateGoalSchema = z.object({
  title: z.string().min(2).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Formato YYYY-MM-DD").optional()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getApiSessionUid();
    const { id } = await Promise.resolve(context.params);
    const payload = updateGoalSchema.parse(await request.json());
    await updateGoal(uid, id, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/goals/:id] erro ao atualizar meta", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a meta." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getApiSessionUid();
    const { id } = await Promise.resolve(context.params);
    await deleteGoal(uid, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/goals/:id] erro ao excluir meta", error);
    return NextResponse.json({ ok: false, error: "Não foi possível excluir a meta." }, { status: 400 });
  }
}
