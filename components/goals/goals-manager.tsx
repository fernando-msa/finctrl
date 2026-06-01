"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Goal } from "@/types/finance";
import { ListFilters } from "@/components/ui/list-filters";
import { useListFilters } from "@/components/ui/use-list-filters";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ExportCsvButton } from "@/components/ui/export-csv-button";

type GoalForm = Omit<Goal, "id">;

const emptyForm: GoalForm = {
  title: "",
  targetAmount: 0,
  currentAmount: 0,
  dueDate: ""
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function GoalsManager({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [form, setForm] = useState<GoalForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const totals = useMemo(() => {
    const totalTarget = goals.reduce((acc, item) => acc + item.targetAmount, 0);
    const totalCurrent = goals.reduce((acc, item) => acc + item.currentAmount, 0);
    const progress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return { totalTarget, totalCurrent, progress };
  }, [goals]);

  const exportRows = useMemo(() =>
    goals.map((g) => [
      g.title,
      g.currentAmount,
      g.targetAmount,
      g.dueDate
    ]),
  [goals]);

  const filterFns = useMemo(() => ({
    search: (item: Goal, values: Record<string, string>) =>
      item.title.toLowerCase().includes(values.search.toLowerCase())
  }), []);

  const { filterValues, setFilterValues, applyFilters } = useListFilters(filterFns);
  const filteredGoals = useMemo(() => applyFilters(goals), [goals, applyFilters]);
  const { paginatedItems: paginatedGoals, totalPages, safePage } = usePagination(filteredGoals, page);

  useEffect(() => { setPage(1); }, [filterValues]);

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      dueDate: goal.dueDate
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (editingId) {
        const response = await fetch(`/api/goals/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!response.ok) throw new Error("Falha ao atualizar meta.");
        setGoals((current) => current.map((item) => (item.id === editingId ? { ...item, ...form } : item)));
      } else {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        const payload = await response.json();
        if (!response.ok || !payload?.goal) throw new Error(payload?.error ?? "Falha ao criar meta.");
        setGoals((current) => [payload.goal as Goal, ...current]);
      }
      setEditingId(null);
      setForm(emptyForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar meta.");
    }
  }

  async function removeGoal(id: string) {
    if (!window.confirm("Deseja excluir esta meta?")) return;
    const response = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Falha ao excluir meta.");
      return;
    }
    setGoals((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Metas</h1>
        <p className="mt-1 text-sm text-slate-600">Cadastre, edite e remova metas financeiras.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Valor alvo total" value={formatCurrency(totals.totalTarget)} />
          <Kpi label="Acumulado atual" value={formatCurrency(totals.totalCurrent)} />
          <Kpi label="Progresso geral" value={`${totals.progress.toFixed(0)}%`} />
        </div>
      </header>

      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Editar meta" : "Nova meta"}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Título" required value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2" min={0} required step="0.01" type="number" value={form.targetAmount} onChange={(e) => setForm((c) => ({ ...c, targetAmount: Number(e.target.value) }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2" min={0} required step="0.01" type="number" value={form.currentAmount} onChange={(e) => setForm((c) => ({ ...c, currentAmount: Number(e.target.value) }))} />
          <input className="rounded-md border border-slate-300 px-3 py-2" required type="month" value={form.dueDate} onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} />
        </div>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <div className="flex gap-2">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white" type="submit">{editingId ? "Salvar alterações" : "Adicionar meta"}</button>
          {editingId ? <button className="rounded-md border border-slate-300 px-4 py-2" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar edição</button> : null}
        </div>
      </form>

      <ListFilters
        fields={[
          { key: "search", label: "Buscar", type: "text", placeholder: "Buscar por título..." }
        ]}
        values={filterValues}
        onChange={setFilterValues}
        resultCount={filteredGoals.length}
        totalCount={goals.length}
      />

      <div className="flex justify-end">
        <ExportCsvButton filename="metas" headers={["Meta", "Atual", "Alvo", "Prazo"]} rows={exportRows} />
      </div>

      <ResponsiveTable
        columns={[
          { key: "title", label: "Meta", render: (goal: Goal) => goal.title },
          { key: "current", label: "Atual", render: (goal: Goal) => formatCurrency(goal.currentAmount) },
          { key: "target", label: "Alvo", render: (goal: Goal) => formatCurrency(goal.targetAmount) },
          { key: "dueDate", label: "Prazo", render: (goal: Goal) => goal.dueDate }
        ]}
        data={paginatedGoals}
        actions={[
          { label: "Editar", onClick: startEdit },
          { label: "Excluir", onClick: (goal: Goal) => removeGoal(goal.id), variant: "danger" }
        ]}
        emptyMessage={goals.length === 0 ? "Nenhuma meta cadastrada ainda." : "Nenhuma meta encontrada com os filtros aplicados."}
        keyExtractor={(goal) => goal.id}
      />

      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} />
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><strong className="text-lg text-brand-700">{value}</strong></div>;
}
