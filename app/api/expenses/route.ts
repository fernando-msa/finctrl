import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { createExpense } from "@/server/repositories/expenses-repository";

const expenseSchema = z.object({
  category: z.enum(["moradia", "transporte", "alimentacao", "saude", "educacao", "lazer", "outros"]),
  amount: z.number().positive(),
  recurring: z.boolean(),
  competenceDate: z.string().min(7)
});

export async function POST(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    const payload = expenseSchema.parse(await request.json());
    const expense = await createExpense(uid, payload);

    return NextResponse.json({ ok: true, expense });
  } catch (error) {
    console.error("[api/expenses] erro ao criar despesa", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar a despesa." }, { status: 400 });
  }
}
