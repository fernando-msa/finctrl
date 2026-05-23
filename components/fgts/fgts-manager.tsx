"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FgtsEntry } from "@/types/finance";
import { ListFilters } from "@/components/ui/list-filters";
import { useListFilters } from "@/components/ui/use-list-filters";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ExportCsvButton } from "@/components/ui/export-csv-button";

type FgtsForm = Omit<FgtsEntry, "id">;

const emptyForm: FgtsForm = {
  accountLabel: "",
  balance: 0,
  modality: "indefinido",
  updatedAt: ""
};

const modalityLabel: Record<FgtsEntry["modality"], string> = {
  saque_aniversario: "Saque-aniversário",
  saque_rescisao: "Saque-rescisão",
  indefinido: "Não informado"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function FgtsManager({ initialEntries }: { initialEntries: FgtsEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [form, setForm] = useState<FgtsForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const totals = useMemo(() => {
    const totalBalance = entries.reduce((acc, item) => acc + item.balance, 0);
    const birthdayModeCount = entries.filter((item) => item.modality === "saque_aniversario").length;
    return { totalBalance, count: entries.length, birthdayModeCount };
  }, [entries]);

  const exportRows = useMemo(() =>
    entries.map((e) => [
      e.accountLabel,
      modalityLabel[e.modality],
      e.balance,
      e.updatedAt
    ]),
  [entries]);

  const filterFns = useMemo(() => ({
    search: (item: FgtsEntry, values: Record<string, string>) =>
      item.accountLabel.toLowerCase().includes(values.search.toLowerCase()),
    modality: (item: FgtsEntry, values: Record<string, string>) => item.modality === values.modality
  }), []);

  const { filterValues, setFilterValues, applyFilters } = useListFilters(filterFns);
  const filteredEntries = useMemo(() => applyFilters(entries), [entries, applyFilters]);
  const { paginatedItems: paginatedEntries, totalPages, safePage } = usePagination(filteredEntries, page);

  useEffect(() => { setPage(1); }, [filterValues]);

  function startEdit(entry: FgtsEntry) {
    setEditingId(entry.id);
    setForm({
      accountLabel: entry.accountLabel,
      balance: entry.balance,
      modality: entry.modality,
      updatedAt: entry.updatedAt
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        const response = await fetch(`/api/fgts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!response.ok) throw new Error("Falha ao atualizar FGTS.");
        setEntries((current) => current.map((item) => (item.id === editingId ? { ...item, ...form } : item)));
      } else {
        const response = await fetch("/api/fgts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const payload = await response.json();
        if (!response.ok || !payload?.entry) throw new Error(payload?.error ?? "Falha ao criar registro de FGTS.");
        setEntries((current) => [payload.entry as FgtsEntry, ...current]);
      }
      setEditingId(null);
      setForm(emptyForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar FGTS.");
    }
  }

  async function removeEntry(id: string) {
    if (!window.confirm("Deseja excluir este registro de FGTS?")) return;
    const response = await fetch(`/api/fgts/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Falha ao excluir registro de FGTS.");
      return;
    }
    setEntries((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">FGTS</h1>
        <p className="mt-1 text-sm text-slate-600">Cadastre, edite e remova contas de FGTS.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Saldo total" value={formatCurrency(totals.totalBalance)} />
          <Kpi label="Contas vinculadas" value={String(totals.count)} />
          <Kpi label="Saque-aniversário" value={String(totals.birthdayModeCount)} />
        </div>
      </header>

      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Editar conta FGTS" : "Nova conta FGTS"}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Nome da conta" required value={form.accountLabel} onChange={(e) => setForm((c) => ({ ...c, accountLabel: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2" min={0} required step="0.01" type="number" value={form.balance} onChange={(e) => setForm((c) => ({ ...c, balance: Number(e.target.value) }))} />
          <select className="rounded-md border border-slate-300 px-3 py-2" value={form.modality} onChange={(e) => setForm((c) => ({ ...c, modality: e.target.value as FgtsEntry["modality"] }))}><option value="indefinido">Não informado</option><option value="saque_aniversario">Saque-aniversário</option><option value="saque_rescisao">Saque-rescisão</option></select>
          <input className="rounded-md border border-slate-300 px-3 py-2" required type="month" value={form.updatedAt} onChange={(e) => setForm((c) => ({ ...c, updatedAt: e.target.value }))} />
        </div>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="flex gap-2">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white" type="submit">{editingId ? "Salvar alterações" : "Adicionar conta FGTS"}</button>
          {editingId ? <button className="rounded-md border border-slate-300 px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar edição</button> : null}
        </div>
      </form>

      <ListFilters
        fields={[
          { key: "search", label: "Buscar", type: "text", placeholder: "Buscar por conta..." },
          { key: "modality", label: "Todas as modalidades", type: "select", options: Object.entries(modalityLabel).map(([value, label]) => ({ value, label })) }
        ]}
        values={filterValues}
        onChange={setFilterValues}
        resultCount={filteredEntries.length}
        totalCount={entries.length}
      />

      <div className="flex justify-end">
        <ExportCsvButton filename="fgts" headers={["Conta", "Modalidade", "Saldo", "Atualizado em"]} rows={exportRows} />
      </div>

      <ResponsiveTable
        columns={[
          { key: "account", label: "Conta", render: (entry: FgtsEntry) => entry.accountLabel },
          { key: "modality", label: "Modalidade", render: (entry: FgtsEntry) => modalityLabel[entry.modality] },
          { key: "balance", label: "Saldo", render: (entry: FgtsEntry) => formatCurrency(entry.balance), className: "font-medium text-slate-900" },
          { key: "updatedAt", label: "Atualizado em", render: (entry: FgtsEntry) => entry.updatedAt }
        ]}
        data={paginatedEntries}
        actions={[
          { label: "Editar", onClick: startEdit },
          { label: "Excluir", onClick: (entry: FgtsEntry) => removeEntry(entry.id), variant: "danger" }
        ]}
        emptyMessage={entries.length === 0 ? "Nenhum registro de FGTS cadastrado ainda." : "Nenhum registro encontrado com os filtros aplicados."}
        keyExtractor={(entry) => entry.id}
      />

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><strong className="text-lg text-brand-700">{value}</strong></div>;
}
