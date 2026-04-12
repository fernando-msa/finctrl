import Link from "next/link";
import { OnboardingChecklist } from "@/components/getting-started/onboarding-checklist";

export default function GettingStartedPage() {
  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Primeiros passos no FinCtrl</h1>
        <p className="mt-1 text-sm text-slate-600">
          Guia rápido para o primeiro uso: configure sua base, cadastre dados e acompanhe evolução financeira.
        </p>
      </header>

      <OnboardingChecklist />

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Passo a passo inicial</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Acesse <strong>Despesas</strong> e registre seus gastos recorrentes e pontuais.</li>
          <li>Acesse <strong>Dívidas</strong> e inclua credor, principal, taxa e status de cada dívida.</li>
          <li>Acesse <strong>Metas</strong> e cadastre objetivos com valor-alvo e prazo.</li>
          <li>Acesse <strong>FGTS</strong> e registre saldo/modalidade para visão consolidada.</li>
          <li>Vá para <strong>Plano</strong> para visualizar priorização de quitação e aporte sugerido.</li>
          <li>Abra <strong>Diagnóstico</strong> para conferir score e recomendações prioritárias.</li>
          <li>Use o <strong>Dashboard</strong> semanalmente para monitorar evolução e ajustar estratégia.</li>
        </ol>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Boas práticas para o cliente</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Atualizar dados ao menos 1x por semana.</li>
          <li>Registrar mudanças de renda e despesas no mesmo dia.</li>
          <li>Revisar plano de ação quinzenalmente.</li>
          <li>Conferir a página <Link className="underline" href="/releases">Novidades da versão</Link> a cada release.</li>
        </ul>
      </article>
    </section>
  );
}
