import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionUid, UnauthenticatedError } from "@/lib/firebase/auth";
import { createIncome } from "@/server/repositories/incomes-repository";

const incomeSchema = z.object({
  sourceCategory: z.enum(["salario", "freelance", "aluguel", "investimentos", "aposentadoria", "outros"]),
  sourceDescription: z.string(),
  amount: z.number().positive(),
  recurring: z.boolean(),
  competenceDate: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato YYYY-MM")
}).refine((data) => {
  if (data.sourceCategory === "outros") {
    return data.sourceDescription.trim().length > 0;
  }
  return true;
}, { message: "Informe a descrição da fonte de renda.", path: ["sourceDescription"] });

export async function POST(request: NextRequest) {
  try {
    const uid = await getApiSessionUid();
    const payload = incomeSchema.parse(await request.json());
    const income = await createIncome(uid, payload);

    return NextResponse.json({ ok: true, income });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/incomes] erro ao criar receita", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar a receita." }, { status: 400 });
  }
}
