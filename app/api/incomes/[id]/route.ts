import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionUid, UnauthenticatedError } from "@/lib/firebase/auth";
import { deleteIncome, updateIncome } from "@/server/repositories/incomes-repository";

const updateIncomeSchema = z.object({
  sourceCategory: z.enum(["salario", "freelance", "aluguel", "investimentos", "aposentadoria", "outros"]).optional(),
  sourceDescription: z.string().optional(),
  amount: z.number().positive().optional(),
  recurring: z.boolean().optional(),
  competenceDate: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM").optional()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getApiSessionUid();
    const { id } = await Promise.resolve(context.params);
    const payload = updateIncomeSchema.parse(await request.json());
    await updateIncome(uid, id, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/incomes/:id] erro ao atualizar receita", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a receita." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getApiSessionUid();
    const { id } = await Promise.resolve(context.params);
    await deleteIncome(uid, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/incomes/:id] erro ao excluir receita", error);
    return NextResponse.json({ ok: false, error: "Não foi possível excluir a receita." }, { status: 400 });
  }
}
