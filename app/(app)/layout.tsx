import Link from "next/link";
import type { Route } from "next";
import { requireSession } from "@/lib/firebase/auth";
import { MobileNav } from "@/components/ui/mobile-nav";

export const dynamic = "force-dynamic";

const links: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/incomes", label: "Receitas" },
  { href: "/expenses", label: "Despesas" },
  { href: "/debts", label: "Dívidas" },
  { href: "/goals", label: "Metas" },
  { href: "/fgts", label: "FGTS" },
  { href: "/plan", label: "Plano" },
  { href: "/diagnostics", label: "Diagnóstico" },
  { href: "/settings", label: "Configurações" },
  { href: "/getting-started", label: "Primeiros passos" }
];

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r">
        {/* Desktop: visible. Mobile: hidden, replaced by MobileNav */}
        <h2 className="mb-3 hidden text-lg font-bold text-brand-700 md:block md:mb-6">FinCtrl</h2>
        <nav className="hidden space-y-2 md:block">
          {links.map(({ href, label }) => (
            <Link
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <MobileNav links={links} />
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
