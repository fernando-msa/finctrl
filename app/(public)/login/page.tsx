"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/features/auth/sign-in";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível concluir o login.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Autenticação</h1>
      <p className="text-slate-600">Faça login com sua conta Google para acessar seus dados financeiros.</p>

      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        className="rounded bg-brand-500 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void handleGoogleLogin()}
        type="button"
        disabled={loading}
      >
        {loading ? "Conectando..." : "Continuar com Google"}
      </button>
    </main>
  );
}
