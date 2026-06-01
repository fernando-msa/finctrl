"use client";

import { ReactNode } from "react";

type Column<T> = {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  className?: string;
};

type Action<T> = {
  label: string;
  onClick: (item: T) => void;
  variant?: "default" | "danger";
};

type ResponsiveTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  emptyMessage: string;
  keyExtractor: (item: T) => string;
};

export function ResponsiveTable<T>({
  columns,
  data,
  actions,
  emptyMessage,
  keyExtractor
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        {emptyMessage}
      </article>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <article className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              {columns.map((col) => (
                <th className="px-4 py-3 font-medium" key={col.key}>
                  {col.label}
                </th>
              ))}
              {actions && actions.length > 0 ? (
                <th className="px-4 py-3 font-medium">Ações</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr className="border-t border-slate-100" key={keyExtractor(item)}>
                {columns.map((col) => (
                  <td className={`px-4 py-3 ${col.className ?? ""}`} key={col.key}>
                    {col.render(item)}
                  </td>
                ))}
                {actions && actions.length > 0 ? (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {actions.map((action) => (
                        <button
                          className={`rounded-md border px-2 py-1 text-sm ${
                            action.variant === "danger"
                              ? "border-red-300 text-red-700"
                              : "border-slate-300"
                          }`}
                          key={action.label}
                          type="button"
                          onClick={() => action.onClick(item)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={keyExtractor(item)}>
            <dl className="space-y-2">
              {columns.map((col) => (
                <div className="flex items-baseline justify-between gap-2" key={col.key}>
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {col.label}
                  </dt>
                  <dd className={`text-right text-sm ${col.className ?? "text-slate-900"}`}>
                    {col.render(item)}
                  </dd>
                </div>
              ))}
            </dl>
            {actions && actions.length > 0 ? (
              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                {actions.map((action) => (
                  <button
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      action.variant === "danger"
                        ? "border-red-300 text-red-700"
                        : "border-slate-300"
                    }`}
                    key={action.label}
                    type="button"
                    onClick={() => action.onClick(item)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
