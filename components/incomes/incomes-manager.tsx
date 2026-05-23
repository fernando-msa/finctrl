"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Income } from "@/types/finance";
import { ListFilters } from "@/components/ui/list-filters";
import { useListFilters } from "@/components/ui/use-list-filters";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ExportCsvButton } from "@/components/ui/export-csv-button";

const categoryLabel: Record<string, string> = {
  salario: "Salário",
  freelance: "Freelance",
  aluguel: "Aluguel",
  investimentos: "Investimentos",
  aposentadoria: "Aposentadoria",
  outros: "Outros"
};

type IncomeForm = Omit<Income, "id">;

const emptyForm: IncomeForm = {
  sourceCategory: "salario",
  sourceDescription: "",
  amount: 0,
  recurring: false,
  competenceDate: ""
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function getSourceLabel(income: Income): string {
  if (income.sourceCategory === "outros" && income.sourceDescription) {
    return income.sourceDescription;
  }
  return categoryLabel[income.sourceCategory] ?? income.sourceCategory;
}

export function IncomesManager({ initialIncomes }: { initialIncomes: Income[] }) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [form, setForm] = useState<IncomeForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const totals = useMemo(() => {
    const total = incomes.reduce((acc, item) => acc + item.amount, 0);
    const recurring = incomes.filter((item) => item.recurring).reduce((acc, item) => acc + item.amount, 0);
    return { total, recurring, count: incomes.length };
  }, [incomes]);

  const exportRows = useMemo(() =>
    incomes.map((i) => [
      getSourceLabel(i),
      i.amount,
      i.competenceDate,
      i.recurring ? "Recorrente" : "Pontual"
    ]),
  [incomes]);

  const filterFns = useMemo(() => ({
    search: (item: Income, values: Record<string, string>) =>
      getSourceLabel(item).toLowerCase().includes(values.search.toLowerCase()),
    sourceCategory: (item: Income, values: Record<string, string>) => item.sourceCategory === values.sourceCategory,
    competence: (item: Income, values: Record<string, string>) => item.competenceDate === values.competence
  }), []);

  const { filterValues, setFilterValues, applyFilters } = useListFilters(filterFns);
  const filteredIncomes = useMemo(() => applyFilters(incomes), [incomes, applyFilters]);
  const { paginatedItems: paginatedIncomes, totalPages, safePage } = usePagination(filteredIncomes, page);

  useEffect(() => { setPage(1); }, [filterValues]);

  function startEdit(income: Income) {
    setEditingId(income.id);
    setForm({
      sourceCategory: income.sourceCategory,
      sourceDescription: income.sourceDescription,
      amount: income.amount,
      recurring: income.recurring,
      competenceDate: income.competenceDate
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

      if (form.sourceCategory === "outros" && !form.sourceDescription.trim()) {
        throw new Error("Informe a descrição da fonte de renda.");
      }

      const payload = {
        ...form,
        sourceDescription: form.sourceCategory === "outros" ? form.sourceDescription.trim() : ""
      };

      if (editingId) {
        const response = await fetch(`/api/incomes/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Falha ao atualizar receita.");
        }

        setIncomes((current) => current.map((item) => (item.id === editingId ? { ...item, ...payload } : item)));
      } else {
        const response = await fetch("/api/incomes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result?.income) {
          throw new Error(result?.error ?? "Falha ao criar receita.");
        }

        setIncomes((current) => [result.income as Income, ...current]);
      }

      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar receita.");
    } finally {
      setLoading(false);
    }
  }

  async function removeIncome(id: string) {
    const confirmed = window.confirm("Deseja realmente excluir esta receita?");
    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Falha ao excluir receita.");
      }

      setIncomes((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erro inesperado ao excluir receita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Receitas</h1>
        <p className="mt-1 text-sm text-slate-600">Cadastre, edite e remova suas fontes de renda.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Total cadastrado" value={formatCurrency(totals.total)} />
          <Kpi label="Recorrentes" value={formatCurrency(totals.recurring)} />
          <Kpi label="Itens" value={String(totals.count)} />
        </div>
      </header>

      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={submitForm}>
        <h2 className="text-lg font-semibold text-slate-900">{editingId ? "Editar receita" : "Nova receita"}</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Fonte de renda
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.sourceCategory}
              onChange={(event) => setForm((current) => ({ ...current, sourceCategory: event.target.value as IncomeForm["sourceCategory"] }))}
            >
              {Object.entries(categoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {form.sourceCategory === "outros" ? (
            <label className="text-sm text-slate-700">
              Descreva a fonte
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Ex: Pensão, Venda de produto..."
                required
                type="text"
                value={form.sourceDescription}
                onChange={(event) => setForm((current) => ({ ...current, sourceDescription: event.target.value }))}
              />
            </label>
          ) : null}

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
            Receita recorrente
          </label>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex gap-2">
          <button className="rounded-md bg-brand-600 px-4 py-2 text-white disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar receita"}
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
          { key: "search", label: "Buscar", type: "text", placeholder: "Buscar por fonte..." },
          { key: "sourceCategory", label: "Todas as fontes", type: "select", options: Object.entries(categoryLabel).map(([value, label]) => ({ value, label })) },
          { key: "competence", label: "Todas as competências", type: "select", options: [...new Set(incomes.map((i) => i.competenceDate))].sort().reverse().map((d) => ({ value: d, label: d })) }
        ]}
        values={filterValues}
        onChange={setFilterValues}
        resultCount={filteredIncomes.length}
        totalCount={incomes.length}
      />

      <div className="flex justify-end">
        <ExportCsvButton filename="receitas" headers={["Fonte", "Valor", "Competência", "Tipo"]} rows={exportRows} />
      </div>

      <ResponsiveTable
        columns={[
          { key: "source", label: "Fonte", render: (income: Income) => getSourceLabel(income) },
          { key: "amount", label: "Valor", render: (income: Income) => formatCurrency(income.amount), className: "font-medium text-slate-900" },
          { key: "competence", label: "Competência", render: (income: Income) => income.competenceDate },
          { key: "type", label: "Tipo", render: (income: Income) => income.recurring ? "Recorrente" : "Pontual" }
        ]}
        data={paginatedIncomes}
        actions={[
          { label: "Editar", onClick: startEdit },
          { label: "Excluir", onClick: (income: Income) => removeIncome(income.id), variant: "danger" }
        ]}
        emptyMessage={incomes.length === 0 ? "Nenhuma receita cadastrada ainda." : "Nenhuma receita encontrada com os filtros aplicados."}
        keyExtractor={(income) => income.id}
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
