import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/auth";

const bodySchema = z.object({
  idToken: z.string().min(10)
});

export async function POST(request: NextRequest) {
  const body = bodySchema.parse(await request.json());
  const expiresIn = 1000 * 60 * 60 * 24 * 5;
  const isHttps = request.nextUrl.protocol === "https:";
  const isProduction = process.env.NODE_ENV === "production";
  const secureCookie = isProduction || isHttps;

  const setSessionCookie = (response: NextResponse, token: string) => {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000
    });
  };

  try {
    const adminAuth = getAdminAuth();
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, sessionCookie);

    return response;
  } catch (error) {
    console.error("[auth/session] Falha ao criar session cookie via Admin SDK.", error);

    if (!isProduction && !isAdminConfigured()) {
      console.warn("[auth/session] Admin SDK indisponível em ambiente local; aplicando fallback temporário com idToken.");
      const response = NextResponse.json({
        ok: true,
        warning: "Sessão local em modo fallback. Configure FIREBASE_* do Admin SDK para validação completa."
      });
      setSessionCookie(response, body.idToken);
      return response;
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Não foi possível iniciar a sessão no momento. Verifique configuração do Firebase Admin SDK."
      },
      { status: 500 }
    );
  }
}
