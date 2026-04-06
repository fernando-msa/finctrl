"use client";

import { FormEvent, useMemo, useState } from "react";
import { Goal } from "@/types/finance";

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

  const totals = useMemo(() => {
    const totalTarget = goals.reduce((acc, item) => acc + item.targetAmount, 0);
    const totalCurrent = goals.reduce((acc, item) => acc + item.currentAmount, 0);
    const progress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return { totalTarget, totalCurrent, progress };
  }, [goals]);

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

      <article className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Atual</th><th className="px-4 py-3">Alvo</th><th className="px-4 py-3">Prazo</th><th className="px-4 py-3">Ações</th></tr></thead>
          <tbody>
            {goals.length === 0 ? <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={5}>Nenhuma meta cadastrada ainda.</td></tr> : goals.map((goal) => (
              <tr className="border-t border-slate-100" key={goal.id}>
                <td className="px-4 py-3">{goal.title}</td><td className="px-4 py-3">{formatCurrency(goal.currentAmount)}</td><td className="px-4 py-3">{formatCurrency(goal.targetAmount)}</td><td className="px-4 py-3">{goal.dueDate}</td>
                <td className="px-4 py-3"><div className="flex gap-2"><button className="rounded-md border border-slate-300 px-2 py-1" type="button" onClick={() => { setEditingId(goal.id); setForm({ title: goal.title, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount, dueDate: goal.dueDate }); }}>Editar</button><button className="rounded-md border border-red-300 px-2 py-1 text-red-700" type="button" onClick={() => removeGoal(goal.id)}>Excluir</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><strong className="text-lg text-brand-700">{value}</strong></div>;
}
