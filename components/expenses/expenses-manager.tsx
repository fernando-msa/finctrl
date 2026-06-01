"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Expense } from "@/types/finance";
import { ListFilters } from "@/components/ui/list-filters";
import { useListFilters } from "@/components/ui/use-list-filters";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ExportCsvButton } from "@/components/ui/export-csv-button";

const categoryLabel: Record<string, string> = {
  moradia: "Moradia",
  transporte: "Transporte",
  alimentacao: "Alimentação",
  saude: "Saúde",
  educacao: "Educação",
  lazer: "Lazer",
  outros: "Outros"
};

type ExpenseForm = Omit<Expense, "id">;

const emptyForm: ExpenseForm = {
  category: "moradia",
  description: "",
  amount: 0,
  recurring: false,
  competenceDate: ""
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function ExpensesManager({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showReplicate, setShowReplicate] = useState(false);
  const [replicateFrom, setReplicateFrom] = useState("");
  const [replicateTo, setReplicateTo] = useState("");
  const [replicateMessage, setReplicateMessage] = useState("");
  const [page, setPage] = useState(1);

  const filterFns = useMemo(() => ({
    search: (item: Expense, values: Record<string, string>) => {
      const q = values.search.toLowerCase();
      return (item.description ?? "").toLowerCase().includes(q)
        || (categoryLabel[item.category] ?? "").toLowerCase().includes(q);
    },
    category: (item: Expense, values: Record<string, string>) => item.category === values.category,
    competence: (item: Expense, values: Record<string, string>) => item.competenceDate === values.competence
  }), []);

  const { filterValues, setFilterValues, applyFilters } = useListFilters(filterFns);
  const filteredExpenses = useMemo(() => applyFilters(expenses), [expenses, applyFilters]);
  const { paginatedItems: paginatedExpenses, totalPages, safePage } = usePagination(filteredExpenses, page);

  useEffect(() => { setPage(1); }, [filterValues]);

  const totals = useMemo(() => {
    const total = expenses.reduce((acc, item) => acc + item.amount, 0);
    const recurring = expenses.filter((item) => item.recurring).reduce((acc, item) => acc + item.amount, 0);
    return { total, recurring, count: expenses.length };
  }, [expenses]);

  const exportRows = useMemo(() =>
    expenses.map((e) => [
      categoryLabel[e.category] ?? e.category,
      e.description ?? "",
      e.amount,
      e.competenceDate,
      e.recurring ? "Recorrente" : "Pontual"
    ]),
  [expenses]);

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      description: expense.description ?? "",
      amount: expense.amount,
      recurring: expense.recurring,
      competenceDate: expense.competenceDate
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
      if (!form.competenceDate) {
        throw new Error("Informe a competência.");
      }

      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(form.competenceDate)) {
        throw new Error("Use o formato de competência YYYY-MM.");
      }

      if (editingId) {
        const response = await fetch(`/api/expenses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });

        if (!response.ok) {
          throw new Error("Falha ao atualizar despesa.");
        }

        setExpenses((current) => current.map((item) => (item.id === editingId ? { ...item, ...form } : item)));
      } else {
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });

        const payload = await response.json();
        if (!response.ok || !payload?.expense) {
          throw new Error(payload?.error ?? "Falha ao criar despesa.");
        }

        setExpenses((current) => [payload.expense as Expense, ...current]);
      }

      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar despesa.");
    } finally {
      setLoading(false);
    }
  }

  async function removeExpense(id: string) {
    const confirmed = window.confirm("Deseja realmente excluir esta despesa?");
    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Falha ao excluir despesa.");
      }

      setExpenses((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erro inesperado ao excluir despesa.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReplicate() {
    if (!replicateFrom || !replicateTo) {
      setError("Preencha os meses de origem e destino.");
      return;
    }

    setLoading(true);
    setError("");
    setReplicateMessage("");

    try {
      const response = await fetch("/api/expenses/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromMonth: replicateFrom, toMonth: replicateTo })
      });

      const result = await response.json();
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Falha ao replicar despesas.");
      }

      setReplicateMessage(result.message);
      setShowReplicate(false);
      setReplicateFrom("");
      setReplicateTo("");

      window.location.reload();
    } catch (replicateError) {
      setError(replicateError instanceof Error ? replicateError.message : "Erro inesperado ao replicar despesas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Despesas</h1>
        <p className="mt-1 text-sm text-slate-600">Cadastre, edite e remova despesas do seu perfil.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Total cadastrado" value={formatCurrency(totals.total)} />
          <Kpi label="Recorrentes" value={formatCurrency(totals.recurring)} />
          <Kpi label="Itens" value={String(totals.count)} />
        </div>
      </header>

      {replicateMessage ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{replicateMessage}</p> : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={() => setShowReplicate((v) => !v)}
        >
          {showReplicate ? "Fechar replicação" : "Replicar recorrentes"}
        </button>

        {showReplicate ? (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-slate-700">
              Mês origem
              <input
                className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5"
                inputMode="numeric"
                pattern="\\d{4}-(0[1-9]|1[0-2])"
                placeholder="2026-04"
                title="Formato YYYY-MM"
                type="text"
                value={replicateFrom}
                onChange={(e) => setReplicateFrom(e.target.value)}
              />
            </label>
            <label className="text-sm text-slate-700">
              Mês destino
              <input
                className="mt-1 block rounded-md border border-slate-300 px-3 py-1.5"
                inputMode="numeric"
                pattern="\\d{4}-(0[1-9]|1[0-2])"
                placeholder="2026-05"
                title="Formato YYYY-MM"
                type="text"
                value={replicateTo}
                onChange={(e) => setReplicateTo(e.target.value)}
              />
            </label>
            <button
              className="rounded-md bg-brand-600 px-4 py-1.5 text-sm text-white disabled:opacity-60"
              disabled={loading}
              type="button"
              onClick={handleReplicate}
            >
              {loading ? "Replicando..." : "Replicar"}
            </button>
          </div>
        ) : null}
      </div>

      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submitForm}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Editar despesa" : "Nova despesa"}</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Categoria
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as ExpenseForm["category"] }))}
            >
              {Object.entries(categoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Descrição
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Ex: Aluguel apto 301, Mercado semanal..."
              type="text"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label className="text-sm text-slate-700">
            Valor
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              min={0}
              required
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))}
            />
          </label>

          <label className="text-sm text-slate-700">
            Competência
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              inputMode="numeric"
              pattern="\\d{4}-(0[1-9]|1[0-2])"
              placeholder="2026-04"
              required
              title="Use o formato YYYY-MM"
              type="text"
              value={form.competenceDate}
              onChange={(event) => setForm((current) => ({ ...current, competenceDate: event.target.value }))}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 md:pt-7">
            <input
              checked={form.recurring}
              type="checkbox"
              onChange={(event) => setForm((current) => ({ ...current, recurring: event.target.checked }))}
            />
            Despesa recorrente
          </label>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex gap-2">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar despesa"}
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
          { key: "search", label: "Buscar", type: "text", placeholder: "Buscar por descrição ou categoria..." },
          { key: "category", label: "Todas as categorias", type: "select", options: Object.entries(categoryLabel).map(([value, label]) => ({ value, label })) },
          { key: "competence", label: "Todas as competências", type: "select", options: [...new Set(expenses.map((e) => e.competenceDate))].sort().reverse().map((d) => ({ value: d, label: d })) }
        ]}
        values={filterValues}
        onChange={setFilterValues}
        resultCount={filteredExpenses.length}
        totalCount={expenses.length}
      />

      <div className="flex justify-end">
        <ExportCsvButton filename="despesas" headers={["Categoria", "Descrição", "Valor", "Competência", "Tipo"]} rows={exportRows} />
      </div>

      <ResponsiveTable
        columns={[
          { key: "category", label: "Categoria", render: (expense: Expense) => categoryLabel[expense.category] ?? expense.category },
          { key: "description", label: "Descrição", render: (expense: Expense) => expense.description || "—", className: "text-slate-600" },
          { key: "amount", label: "Valor", render: (expense: Expense) => formatCurrency(expense.amount), className: "font-medium text-slate-900" },
          { key: "competence", label: "Competência", render: (expense: Expense) => expense.competenceDate },
          { key: "type", label: "Tipo", render: (expense: Expense) => expense.recurring ? "Recorrente" : "Pontual" }
        ]}
        data={paginatedExpenses}
        actions={[
          { label: "Editar", onClick: startEdit },
          { label: "Excluir", onClick: (expense: Expense) => removeExpense(expense.id), variant: "danger" }
        ]}
        emptyMessage={expenses.length === 0 ? "Nenhuma despesa cadastrada ainda." : "Nenhuma despesa encontrada com os filtros aplicados."}
        keyExtractor={(expense) => expense.id}
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
