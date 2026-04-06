import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { deleteExpense, updateExpense } from "@/server/repositories/expenses-repository";

const updateExpenseSchema = z.object({
  category: z.enum(["moradia", "transporte", "alimentacao", "saude", "educacao", "lazer", "outros"]).optional(),
  amount: z.number().positive().optional(),
  recurring: z.boolean().optional(),
  competenceDate: z.string().min(7).optional()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getSessionUid();
    const { id } = await Promise.resolve(context.params);
    const payload = updateExpenseSchema.parse(await request.json());
    await updateExpense(uid, id, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/expenses/:id] erro ao atualizar despesa", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a despesa." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getSessionUid();
    const { id } = await Promise.resolve(context.params);
    await deleteExpense(uid, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/expenses/:id] erro ao excluir despesa", error);
    return NextResponse.json({ ok: false, error: "Não foi possível excluir a despesa." }, { status: 400 });
  }
}
