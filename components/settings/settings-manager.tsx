"use client";

import { FormEvent, useEffect, useState } from "react";

type SettingsForm = {
  displayName: string;
  currency: "BRL" | "USD" | "EUR";
  weeklyReminder: boolean;
  monthlyIncome: string;
};

const defaultForm: SettingsForm = {
  displayName: "",
  currency: "BRL",
  weeklyReminder: true,
  monthlyIncome: ""
};

export function SettingsManager() {
  const [form, setForm] = useState<SettingsForm>(defaultForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/settings/profile");
        const payload = await response.json();
        if (response.ok && payload?.settings) {
          setForm({
            displayName: payload.settings.displayName ?? "",
            currency: payload.settings.currency ?? "BRL",
            weeklyReminder: Boolean(payload.settings.weeklyReminder),
            monthlyIncome:
              typeof payload.settings.monthlyIncome === "number" && Number.isFinite(payload.settings.monthlyIncome)
                ? String(payload.settings.monthlyIncome)
                : ""
          });
        }
      } catch {
        setMessage("Não foi possível carregar configurações agora.");
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/settings/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        monthlyIncome: form.monthlyIncome.trim() === "" ? null : Number(form.monthlyIncome)
      })
    });

    if (!response.ok) {
      setMessage("Falha ao salvar configurações.");
      return;
    }

    setMessage("Configurações salvas com sucesso.");
  }

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
        <p className="mt-1 text-sm text-slate-600">Personalize preferências do seu perfil.</p>
      </header>

      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-700">Nome de exibição
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required type="text" value={form.displayName} onChange={(e) => setForm((current) => ({ ...current, displayName: e.target.value }))} />
        </label>

        <label className="block text-sm text-slate-700">Moeda padrão
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.currency} onChange={(e) => setForm((current) => ({ ...current, currency: e.target.value as SettingsForm["currency"] }))}>
            <option value="BRL">Real (BRL)</option>
            <option value="USD">Dólar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </label>

        <label className="block text-sm text-slate-700">Renda mensal (opcional)
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            inputMode="decimal"
            min={0}
            step="0.01"
            type="number"
            value={form.monthlyIncome}
            onChange={(e) => setForm((current) => ({ ...current, monthlyIncome: e.target.value }))}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input checked={form.weeklyReminder} type="checkbox" onChange={(e) => setForm((current) => ({ ...current, weeklyReminder: e.target.checked }))} />
          Receber lembrete semanal para atualizar dados financeiros.
        </label>

        <button className="rounded-md bg-brand-600 px-4 py-2 text-white" type="submit">Salvar configurações</button>

        {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      </form>
    </section>
  );
}
