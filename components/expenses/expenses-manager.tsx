"use client";

import { FormEvent, useMemo, useState } from "react";
import { Expense } from "@/types/finance";

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

  const totals = useMemo(() => {
    const total = expenses.reduce((acc, item) => acc + item.amount, 0);
    const recurring = expenses.filter((item) => item.recurring).reduce((acc, item) => acc + item.amount, 0);
    return { total, recurring, count: expenses.length };
  }, [expenses]);

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
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
              placeholder="2026-04"
              required
              type="month"
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

      <article className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Competência</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  Nenhuma despesa cadastrada ainda.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr className="border-t border-slate-100" key={expense.id}>
                  <td className="px-4 py-3">{categoryLabel[expense.category] ?? expense.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3">{expense.competenceDate}</td>
                  <td className="px-4 py-3">{expense.recurring ? "Recorrente" : "Pontual"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="rounded-md border border-slate-300 px-2 py-1" type="button" onClick={() => startEdit(expense)}>
                        Editar
                      </button>
                      <button className="rounded-md border border-red-300 px-2 py-1 text-red-700" type="button" onClick={() => removeExpense(expense.id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
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
