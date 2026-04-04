import Link from "next/link";
import { requireSession } from "@/lib/firebase/auth";

export const dynamic = "force-dynamic";

const links: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
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
        <h2 className="mb-3 text-lg font-bold text-brand-700 md:mb-6">FinCtrl</h2>
        <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-visible">
          {links.map(({ href, label }) => (
            <Link
              className="whitespace-nowrap rounded border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 md:block md:border-transparent"
              href={href as any}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
