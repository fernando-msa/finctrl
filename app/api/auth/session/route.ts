import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/auth";

const bodySchema = z.object({
  idToken: z.string().min(10)
});

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

async function verifyFirebaseIdToken(token: string) {
  const payload = decodeJwt(token);
  const projectId = typeof payload.aud === "string" ? payload.aud : null;

  if (!projectId) {
    throw new Error("Token sem audience/aud válido.");
  }

  await jwtVerify(token, GOOGLE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId
  });

  return { projectId };
}

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

    if (!isAdminConfigured()) {
      try {
        const verified = await verifyFirebaseIdToken(body.idToken);
        console.warn(
          `[auth/session] Admin SDK indisponível; fallback com ID token verificado via JWKS para projeto ${verified.projectId}.`
        );

        const response = NextResponse.json({
          ok: true,
          warning: "Sessão criada com fallback de ID token verificado. Configure Firebase Admin SDK para sessão server completa."
        });
        setSessionCookie(response, body.idToken);
        return response;
      } catch (verifyError) {
        console.error("[auth/session] Falha ao verificar ID token via JWKS.", verifyError);
      }
    }

    if (!isProduction && !isAdminConfigured()) {
      console.warn("[auth/session] Admin SDK indisponível em ambiente local; aplicando fallback temporário sem verificação.");
      const response = NextResponse.json({
        ok: true,
        warning: "Sessão local em modo fallback sem verificação. Configure FIREBASE_* do Admin SDK para validação completa."
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
