import Link from "next/link";
import { requireSession } from "@/lib/firebase/auth";

export const dynamic = "force-dynamic";

const links = [
  ["/dashboard", "Dashboard"],
  ["/expenses", "Despesas"],
  ["/debts", "Dívidas"],
  ["/goals", "Metas"],
  ["/fgts", "FGTS"],
  ["/plan", "Plano"],
  ["/diagnostics", "Diagnóstico"],
  ["/settings", "Configurações"]
] as const;

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-4">
        <h2 className="mb-6 text-lg font-bold text-brand-700">FinCtrl</h2>
        <nav className="space-y-2">
          {links.map(([href, label]) => (
            <Link className="block rounded px-3 py-2 text-sm hover:bg-slate-100" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
