import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUid } from "@/lib/firebase/auth";
import { createDebt } from "@/server/repositories/debts-repository";

const debtSchema = z.object({
  creditor: z.string().min(2),
  principal: z.number().positive(),
  annualInterestRate: z.number().min(0).max(500),
  status: z.enum(["ativa", "quitada", "atraso"])
});

export async function POST(request: NextRequest) {
  try {
    const uid = await getSessionUid();
    const payload = debtSchema.parse(await request.json());
    const debt = await createDebt(uid, payload);

    return NextResponse.json({ ok: true, debt });
  } catch (error) {
    console.error("[api/debts] erro ao criar dívida", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar a dívida." }, { status: 400 });
  }
}
