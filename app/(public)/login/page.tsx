"use client";

import { signInWithGoogle } from "@/features/auth/sign-in";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Autenticação</h1>
      <p className="text-slate-600">Faça login com sua conta Google para acessar seus dados financeiros.</p>
      <button
        className="rounded bg-brand-500 px-4 py-2 font-semibold text-white"
        onClick={() => void signInWithGoogle()}
        type="button"
      >
        Continuar com Google
      </button>
    </main>
  );
}
