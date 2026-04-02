import { requireSession } from "@/lib/firebase/auth";

export async function getDashboardSummary() {
  await requireSession();

  return {
    monthlyBalance: 4200,
    totalExpenses: 2800,
    openDebts: 3,
    goalsProgress: 47,
    chart: [
      { name: "Gastos", value: 2800 },
      { name: "Dívidas", value: 1700 },
      { name: "Metas", value: 900 },
      { name: "Sobra", value: 500 }
    ]
  };
}
