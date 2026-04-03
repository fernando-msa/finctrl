import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "finctrl_session";

export async function requireSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    redirect("/login");
  }

  return session;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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
  const payload = decodeJwtPayload(session);

  const uid = payload?.uid ?? payload?.user_id ?? payload?.sub;
  if (!uid || typeof uid !== "string") {
    throw new Error("Não foi possível identificar o usuário autenticado pela sessão.");
  }

  return uid;
}

export { SESSION_COOKIE_NAME };
