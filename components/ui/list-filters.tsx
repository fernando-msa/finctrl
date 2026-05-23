"use client";

import { useMemo } from "react";

export type FilterField = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
};

type ListFiltersProps = {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  resultCount: number;
  totalCount: number;
};

export function ListFilters({ fields, values, onChange, resultCount, totalCount }: ListFiltersProps) {
  const hasActiveFilters = useMemo(
    () => Object.values(values).some((v) => v.trim() !== ""),
    [values]
  );

  function updateFilter(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  function clearFilters() {
    const cleared: Record<string, string> = {};
    for (const field of fields) {
      cleared[field.key] = "";
    }
    onChange(cleared);
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {fields.map((field) =>
          field.type === "select" ? (
            <label className="text-sm text-slate-700" key={field.key}>
              <span className="sr-only">{field.label}</span>
              <select
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                value={values[field.key] ?? ""}
                onChange={(e) => updateFilter(field.key, e.target.value)}
              >
                <option value="">{field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              key={field.key}
              placeholder={field.placeholder ?? field.label}
              type="text"
              value={values[field.key] ?? ""}
              onChange={(e) => updateFilter(field.key, e.target.value)}
            />
          )
        )}

        {hasActiveFilters ? (
          <button
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            type="button"
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      {hasActiveFilters && resultCount !== totalCount ? (
        <p className="text-xs text-slate-500">
          Exibindo {resultCount} de {totalCount} itens
        </p>
      ) : null}
    </div>
  );
}
