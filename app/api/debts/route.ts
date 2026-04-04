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
  let uid: string;

  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[api/debts] usuário não autenticado", error);
    return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
  }

  const parsedPayload = debtSchema.safeParse(await request.json());
  if (!parsedPayload.success) {
    return NextResponse.json({ ok: false, error: "Payload inválido." }, { status: 400 });
  }

  try {
    const debt = await createDebt(uid, parsedPayload.data);
    return NextResponse.json({ ok: true, debt });
  } catch (error) {
    console.error("[api/debts] erro ao criar dívida", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar a dívida." }, { status: 500 });
  }
}
