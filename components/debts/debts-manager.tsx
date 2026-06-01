"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Debt } from "@/types/finance";
import { ListFilters } from "@/components/ui/list-filters";
import { useListFilters } from "@/components/ui/use-list-filters";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ExportCsvButton } from "@/components/ui/export-csv-button";

type DebtForm = Omit<Debt, "id">;

const statusLabel: Record<Debt["status"], string> = {
  ativa: "Ativa",
  quitada: "Quitada",
  atraso: "Em atraso"
};

const emptyForm: DebtForm = {
  creditor: "",
  principal: 0,
  annualInterestRate: 0,
  status: "ativa"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function DebtsManager({ initialDebts }: { initialDebts: Debt[] }) {
  const [debts, setDebts] = useState(initialDebts);
  const [form, setForm] = useState<DebtForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const totals = useMemo(() => {
    const openDebts = debts.filter((debt) => debt.status !== "quitada");
    const openPrincipal = openDebts.reduce((acc, debt) => acc + debt.principal, 0);
    const averageRate = openDebts.length ? openDebts.reduce((acc, debt) => acc + debt.annualInterestRate, 0) / openDebts.length : 0;

    return { openPrincipal, openCount: openDebts.length, averageRate };
  }, [debts]);

  const exportRows = useMemo(() =>
    debts.map((d) => [
      d.creditor,
      d.principal,
      `${d.annualInterestRate.toFixed(2)}%`,
      statusLabel[d.status]
    ]),
  [debts]);

  const filterFns = useMemo(() => ({
    search: (item: Debt, values: Record<string, string>) =>
      item.creditor.toLowerCase().includes(values.search.toLowerCase()),
    status: (item: Debt, values: Record<string, string>) => item.status === values.status
  }), []);

  const { filterValues, setFilterValues, applyFilters } = useListFilters(filterFns);
  const filteredDebts = useMemo(() => applyFilters(debts), [debts, applyFilters]);
  const { paginatedItems: paginatedDebts, totalPages, safePage } = usePagination(filteredDebts, page);

  useEffect(() => { setPage(1); }, [filterValues]);

  function startEdit(debt: Debt) {
    setEditingId(debt.id);
    setForm({
      creditor: debt.creditor,
      principal: debt.principal,
      annualInterestRate: debt.annualInterestRate,
      status: debt.status
    });
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.creditor.trim()) {
        throw new Error("Informe o nome do credor.");
      }

      if (editingId) {
        const response = await fetch(`/api/debts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });

        if (!response.ok) {
          throw new Error("Falha ao atualizar dívida.");
        }

        setDebts((current) => current.map((item) => (item.id === editingId ? { ...item, ...form } : item)));
      } else {
        const response = await fetch("/api/debts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });

        const payload = await response.json();
        if (!response.ok || !payload?.debt) {
          throw new Error(payload?.error ?? "Falha ao criar dívida.");
        }

        setDebts((current) => [payload.debt as Debt, ...current]);
      }

      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar dívida.");
    } finally {
      setLoading(false);
    }
  }

  async function removeDebt(id: string) {
    const confirmed = window.confirm("Deseja realmente excluir esta dívida?");
    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Falha ao excluir dívida.");
      }

      setDebts((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erro inesperado ao excluir dívida.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dívidas</h1>
        <p className="mt-1 text-sm text-slate-600">Acompanhe, cadastre e atualize dívidas do seu perfil.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Total em aberto" value={formatCurrency(totals.openPrincipal)} />
          <Kpi label="Dívidas abertas" value={String(totals.openCount)} />
          <Kpi label="Taxa média anual" value={`${totals.averageRate.toFixed(2)}%`} />
        </div>
      </header>

      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submitForm}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Editar dívida" : "Nova dívida"}</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Credor
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              required
              type="text"
              value={form.creditor}
              onChange={(event) => setForm((current) => ({ ...current, creditor: event.target.value }))}
            />
          </label>

          <label className="text-sm text-slate-700">
            Principal
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              min={0}
              required
              step="0.01"
              type="number"
              value={form.principal}
              onChange={(event) => setForm((current) => ({ ...current, principal: Number(event.target.value) }))}
            />
          </label>

          <label className="text-sm text-slate-700">
            Taxa anual (%)
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              min={0}
              required
              step="0.01"
              type="number"
              value={form.annualInterestRate}
              onChange={(event) => setForm((current) => ({ ...current, annualInterestRate: Number(event.target.value) }))}
            />
          </label>

          <label className="text-sm text-slate-700">
            Status
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Debt["status"] }))}
            >
              <option value="ativa">Ativa</option>
              <option value="quitada">Quitada</option>
              <option value="atraso">Em atraso</option>
            </select>
          </label>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex gap-2">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar dívida"}
          </button>
          {editingId ? (
            <button className="rounded-md border border-slate-300 px-4 py-2" type="button" onClick={resetForm}>
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>

      <ListFilters
        fields={[
          { key: "search", label: "Buscar", type: "text", placeholder: "Buscar por credor..." },
          { key: "status", label: "Todos os status", type: "select", options: Object.entries(statusLabel).map(([value, label]) => ({ value, label })) }
        ]}
        values={filterValues}
        onChange={setFilterValues}
        resultCount={filteredDebts.length}
        totalCount={debts.length}
      />

      <div className="flex justify-end">
        <ExportCsvButton filename="dividas" headers={["Credor", "Principal", "Taxa anual", "Status"]} rows={exportRows} />
      </div>

      <ResponsiveTable
        columns={[
          { key: "creditor", label: "Credor", render: (debt: Debt) => debt.creditor },
          { key: "principal", label: "Principal", render: (debt: Debt) => formatCurrency(debt.principal), className: "font-medium text-slate-900" },
          { key: "rate", label: "Taxa anual", render: (debt: Debt) => `${debt.annualInterestRate.toFixed(2)}%` },
          { key: "status", label: "Status", render: (debt: Debt) => statusLabel[debt.status] }
        ]}
        data={paginatedDebts}
        actions={[
          { label: "Editar", onClick: startEdit },
          { label: "Excluir", onClick: (debt: Debt) => removeDebt(debt.id), variant: "danger" }
        ]}
        emptyMessage={debts.length === 0 ? "Nenhuma dívida cadastrada ainda." : "Nenhuma dívida encontrada com os filtros aplicados."}
        keyExtractor={(debt) => debt.id}
      />

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <strong className="text-lg text-brand-700">{value}</strong>
    </div>
  );
}
