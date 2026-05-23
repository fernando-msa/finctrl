import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionUid, UnauthenticatedError } from "@/lib/firebase/auth";
import { replicateRecurringExpenses } from "@/server/repositories/expenses-repository";

const replicateSchema = z.object({
  fromMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM"),
  toMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM")
});

export async function POST(request: NextRequest) {
  try {
    const uid = await getApiSessionUid();
    const { fromMonth, toMonth } = replicateSchema.parse(await request.json());

    if (fromMonth === toMonth) {
      return NextResponse.json({ ok: false, error: "Mês de origem e destino não podem ser iguais." }, { status: 400 });
    }

    const count = await replicateRecurringExpenses(uid, fromMonth, toMonth);

    return NextResponse.json({ ok: true, count, message: `${count} despesa(s) recorrente(s) replicada(s) para ${toMonth}.` });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/expenses/replicate] erro ao replicar despesas recorrentes", error);
    return NextResponse.json({ ok: false, error: "Não foi possível replicar as despesas recorrentes." }, { status: 400 });
  }
}
