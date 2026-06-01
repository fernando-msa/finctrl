import { getAdminAppCheck, isAdminConfigured } from "@/lib/firebase/admin";

export class AppCheckError extends Error {
  constructor(message = "App Check token inválido ou ausente") {
    super(message);
    this.name = "AppCheckError";
  }
}

/**
 * Valida o token de App Check.
 * Se Admin SDK estiver configurado, valida o token contra o Firebase.
 * Caso contrário, rejeita em produção ou aceita em desenvolvimento.
 */
export async function validateAppCheck(token?: string): Promise<void> {
  if (!token) {
    throw new AppCheckError();
  }

  if (isAdminConfigured()) {
    try {
      const appCheck = getAdminAppCheck();
      await appCheck.verifyToken(token);
    } catch {
      throw new AppCheckError("Token App Check inválido ou expirado");
    }
    return;
  }

  // Sem Admin SDK: em dev apenas loga, em produção rejeita
  if (process.env.NODE_ENV === "production") {
    throw new AppCheckError("App Check não pode ser validado sem Admin SDK configurado");
  }

  console.warn("[App Check] Validação em modo desenvolvimento (Admin SDK ausente)");
}

export function withAppCheck(handler: (token: string) => Promise<Response>) {
  return async (request: Request) => {
    const token = request.headers.get("x-firebase-appcheck") ?? undefined;
    await validateAppCheck(token);
    return handler(token!);
  };
}
