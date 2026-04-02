import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6">
      <h1 className="text-4xl font-bold text-brand-700">FinCtrl v2</h1>
      <p className="max-w-2xl text-lg text-slate-700">
        Plataforma de controle financeiro com foco em segurança, recomendações inteligentes e isolamento total de dados por usuário.
      </p>
      <div className="flex gap-4">
        <Link className="rounded bg-brand-500 px-4 py-2 font-semibold text-white" href="/login">
          Entrar com Google
        </Link>
        <Link className="rounded border border-slate-300 px-4 py-2 font-semibold" href="/dashboard">
          Ver dashboard
        </Link>
      </div>
    </main>
  );
}
