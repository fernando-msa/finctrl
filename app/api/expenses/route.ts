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

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

export async function POST(request: NextRequest) {
  let uid: string;

  try {
    uid = await getSessionUid();
  } catch (error) {
    if (isNextRedirectError(error)) {
      return NextResponse.json({ ok: false, error: "Não autenticado." }, { status: 401 });
    }

    console.error("[api/expenses] erro de autenticação ao criar despesa", error);
    return NextResponse.json({ ok: false, error: "Não foi possível autenticar o usuário." }, { status: 500 });
  }

  let payload: z.infer<typeof expenseSchema>;

  try {
    payload = expenseSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Dados inválidos para criar a despesa." }, { status: 400 });
    }

    console.error("[api/expenses] erro ao ler payload da despesa", error);
    return NextResponse.json({ ok: false, error: "Não foi possível ler os dados da despesa." }, { status: 400 });
  }

  try {
    const expense = await createExpense(uid, payload);
    return NextResponse.json({ ok: true, expense });
  } catch (error) {
    console.error("[api/expenses] erro ao criar despesa", error);
    return NextResponse.json({ ok: false, error: "Não foi possível criar a despesa." }, { status: 500 });
  }
}
