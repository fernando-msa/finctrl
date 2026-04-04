"use client";

import { useEffect, useMemo, useState } from "react";

type ChecklistItem = {
  id: string;
  label: string;
};

const checklist: ChecklistItem[] = [
  { id: "expenses", label: "Cadastrar ao menos 1 despesa" },
  { id: "debts", label: "Cadastrar ao menos 1 dívida" },
  { id: "goals", label: "Cadastrar 1 meta financeira" },
  { id: "fgts", label: "Registrar saldo/modalidade do FGTS" },
  { id: "plan", label: "Revisar a página de Plano" },
  { id: "diagnostics", label: "Abrir Diagnóstico e revisar recomendações" }
];

const STORAGE_KEY = "finctrl_onboarding_checklist_v1";

async function trackEvent(name: "onboarding_started" | "onboarding_step_completed" | "onboarding_completed", stepId?: string) {
  try {
    await fetch("/api/metrics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stepId, source: "getting-started" })
    });
  } catch (error) {
    console.warn("[onboarding] falha ao enviar métrica", error);
  }
}

function loadInitialChecklist(): Record<string, boolean> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function OnboardingChecklist() {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => loadInitialChecklist());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedMap));
  }, [checkedMap]);

  useEffect(() => {
    const alreadyStarted = window.sessionStorage.getItem("finctrl_onboarding_started");
    if (!alreadyStarted) {
      trackEvent("onboarding_started");
      window.sessionStorage.setItem("finctrl_onboarding_started", "1");
    }
  }, []);

  const completedCount = useMemo(() => checklist.filter((item) => checkedMap[item.id]).length, [checkedMap]);
  const total = checklist.length;
  const completionRate = Math.round((completedCount / total) * 100);

  useEffect(() => {
    if (completedCount !== total) return;

    const completedKey = "finctrl_onboarding_completed";
    const alreadyCompleted = window.localStorage.getItem(completedKey);
    if (!alreadyCompleted) {
      trackEvent("onboarding_completed");
      window.localStorage.setItem(completedKey, "1");
    }
  }, [completedCount, total]);

  function handleToggle(stepId: string, nextValue: boolean) {
    setCheckedMap((current) => ({ ...current, [stepId]: nextValue }));
    if (nextValue) {
      trackEvent("onboarding_step_completed", stepId);
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Checklist de ativação</h2>
      <p className="mt-1 text-sm text-slate-600">
        Progresso atual: <strong>{completedCount}</strong>/{total} ({completionRate}%).
      </p>

      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {checklist.map((item) => (
          <li className="flex items-center gap-2" key={item.id}>
            <input
              checked={Boolean(checkedMap[item.id])}
              id={`check-${item.id}`}
              type="checkbox"
              onChange={(event) => handleToggle(item.id, event.target.checked)}
            />
            <label htmlFor={`check-${item.id}`}>{item.label}</label>
          </li>
        ))}
      </ul>

      {completedCount === total ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Parabéns! Onboarding concluído. Continue registrando dados semanalmente para manter seu plano atualizado.
        </p>
      ) : null}
    </article>
  );
}
