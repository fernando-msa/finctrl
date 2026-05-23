"use client";

import { exportToCsv } from "@/lib/export/csv";

type ExportCsvButtonProps = {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  label?: string;
};

export function ExportCsvButton({ filename, headers, rows, label = "Exportar CSV" }: ExportCsvButtonProps) {
  function handleExport() {
    exportToCsv(filename, headers, rows);
  }

  return (
    <button
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      type="button"
      onClick={handleExport}
    >
      {label}
    </button>
  );
}
