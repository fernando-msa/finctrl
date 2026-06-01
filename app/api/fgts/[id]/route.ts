import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSessionUid, UnauthenticatedError } from "@/lib/firebase/auth";
import { deleteFgtsEntry, updateFgtsEntry } from "@/server/repositories/fgts-repository";

const updateFgtsSchema = z.object({
  accountLabel: z.string().min(2).optional(),
  balance: z.number().min(0).optional(),
  modality: z.enum(["saque_aniversario", "saque_rescisao", "indefinido"]).optional(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Formato YYYY-MM-DD").optional()
});

export async function PATCH(request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getApiSessionUid();
    const { id } = await Promise.resolve(context.params);
    const payload = updateFgtsSchema.parse(await request.json());
    await updateFgtsEntry(uid, id, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/fgts/:id] erro ao atualizar registro", error);
    return NextResponse.json({ ok: false, error: "Não foi possível atualizar o registro de FGTS." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const uid = await getApiSessionUid();
    const { id } = await Promise.resolve(context.params);
    await deleteFgtsEntry(uid, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
    }
    console.error("[api/fgts/:id] erro ao excluir registro", error);
    return NextResponse.json({ ok: false, error: "Não foi possível excluir o registro de FGTS." }, { status: 400 });
  }
}
