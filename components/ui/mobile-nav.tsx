"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = { href: Route; label: string };

export function MobileNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-700">FinCtrl</h2>
        <button
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="rounded-md border border-slate-300 p-2 text-slate-700"
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <nav className="mt-3 space-y-1 border-t border-slate-200 pt-3">
          {links.map(({ href, label }) => (
            <Link
              className={`block rounded-md px-3 py-2 text-sm ${
                pathname === href
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
              href={href}
              key={href}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
