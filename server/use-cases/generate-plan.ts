import { listExpenses } from "@/server/repositories/expenses-repository";
import { prioritizeDebts } from "@/server/services/plan-service";
import { Debt } from "@/types/finance";

export async function generateFinancialPlan(input: { uid: string; debts: Debt[]; income: number }) {
  const expenses = await listExpenses(input.uid);
  const totalExpenses = expenses.reduce((acc, current) => acc + current.amount, 0);
  const freeCashFlow = Math.max(input.income - totalExpenses, 0);

  return {
    freeCashFlow,
    recommendations: prioritizeDebts(input.debts, "avalanche"),
    suggestedInvestmentForGoals: Math.round(freeCashFlow * 0.4)
  };
}
