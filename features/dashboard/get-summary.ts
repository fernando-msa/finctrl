import { getSessionUid } from "@/lib/firebase/auth";
import { listDebts } from "@/server/repositories/debts-repository";
import { listExpenses } from "@/server/repositories/expenses-repository";
import { listGoals } from "@/server/repositories/goals-repository";

export async function getDashboardSummary() {
  const uid = await getSessionUid();
  const [expenses, debts, goals] = await Promise.all([listExpenses(uid), listDebts(uid), listGoals(uid)]);

  const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);
  const openDebts = debts.filter((debt) => debt.status !== "quitada");
  const totalOpenDebt = openDebts.reduce((acc, debt) => acc + debt.principal, 0);
  const totalGoalsTarget = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
  const totalGoalsCurrent = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
  const goalsProgress = totalGoalsTarget > 0 ? Math.min(100, Math.round((totalGoalsCurrent / totalGoalsTarget) * 100)) : 0;
  const monthlyBalance = -(totalExpenses + totalOpenDebt);
  const reserve = Math.max(0, monthlyBalance);

  return {
    monthlyBalance,
    totalExpenses,
    openDebts: openDebts.length,
    goalsProgress,
    chart: [
      { name: "Gastos", value: totalExpenses },
      { name: "Dívidas", value: totalOpenDebt },
      { name: "Metas", value: totalGoalsCurrent },
      { name: "Sobra", value: reserve }
    ]
  };
}
