import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { deleteDebt, updateDebt } from "@/server/repositories/debts-repository";

const updateDebtSchema = z.object({
  creditor: z.string().min(2).optional(),
  principal: z.number().positive().optional(),
  annualInterestRate: z.number().min(0).max(500).optional(),
  status: z.enum(["ativa", "quitada", "atraso"]).optional()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    const uid = await getSessionUid();
    const { id } = context.params;
    const payload = updateDebtSchema.parse(await request.json());
    await updateDebt(uid, id, payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/debts/:id] erro ao atualizar dívida", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar a dívida." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const uid = await getSessionUid();
    const { id } = context.params;
    await deleteDebt(uid, id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/debts/:id] erro ao excluir dívida", error);
    return NextResponse.json({ ok: false, error: "Não foi possível excluir a dívida." }, { status: 400 });
  }
}
