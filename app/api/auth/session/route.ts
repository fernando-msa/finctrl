import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/auth";

const bodySchema = z.object({
  idToken: z.string().min(10)
});

export async function POST(request: NextRequest) {
  const body = bodySchema.parse(await request.json());
  const expiresIn = 1000 * 60 * 60 * 24 * 5;

  let sessionCookie: string;
  try {
    const adminAuth = getAdminAuth();
    sessionCookie = await adminAuth.createSessionCookie(body.idToken, { expiresIn });
  } catch (error) {
    console.error("[auth/session] Falha ao criar session cookie via Admin SDK. Aplicando fallback com idToken.", error);
    sessionCookie = body.idToken;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn / 1000
  });

  return response;
}
