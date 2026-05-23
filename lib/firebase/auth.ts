import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";

const SESSION_COOKIE_NAME = "finctrl_session";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated");
    this.name = "UnauthenticatedError";
  }
}

export async function requireSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    redirect("/login");
  }

  return session;
}

async function verifySessionToken(token: string): Promise<string> {
  if (isAdminConfigured()) {
    const adminAuth = getAdminAuth();
    try {
      const decoded = await adminAuth.verifySessionCookie(token, true);
      return decoded.uid;
    } catch {
      const decoded = await adminAuth.verifyIdToken(token);
      return decoded.uid;
    }
  }

  const decoded = await verifyIdTokenViaJwks(token);
  return decoded;
}

async function verifyIdTokenViaJwks(token: string): Promise<string> {
  const { createRemoteJWKSet, jwtVerify } = await import("jose");

  const payload = decodeJwtPayloadUnsafe(token);
  const projectId = typeof payload?.aud === "string" ? payload.aud : null;
  if (!projectId) {
    throw new UnauthenticatedError();
  }

  const jwks = createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
  );

  const { payload: verified } = await jwtVerify(token, jwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId
  });

  const uid = verified.uid ?? verified.user_id ?? verified.sub;
  if (!uid || typeof uid !== "string") {
    throw new UnauthenticatedError();
  }

  return uid;
}

function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getSessionUid() {
  const session = await requireSession();

  try {
    return await verifySessionToken(session);
  } catch {
    throw new Error("Não foi possível identificar o usuário autenticado pela sessão.");
  }
}

/**
 * API-safe version of getSessionUid. Returns the authenticated user's UID or
 * throws UnauthenticatedError when the session cookie is missing or invalid.
 * Must only be used inside Route Handlers (never redirects).
 */
export async function getApiSessionUid(): Promise<string> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    throw new UnauthenticatedError();
  }

  try {
    return await verifySessionToken(session);
  } catch {
    throw new UnauthenticatedError();
  }
}

export { SESSION_COOKIE_NAME };
