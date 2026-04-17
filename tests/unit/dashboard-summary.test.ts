import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardSummary } from "@/features/dashboard/get-summary";

const getSessionUidMock = vi.fn();
const listExpensesMock = vi.fn();
const listDebtsMock = vi.fn();
const listGoalsMock = vi.fn();
const getSettingsProfileMock = vi.fn();

vi.mock("@/lib/firebase/auth", () => ({
  getSessionUid: getSessionUidMock
}));

vi.mock("@/server/repositories/expenses-repository", () => ({
  listExpenses: listExpensesMock
}));

vi.mock("@/server/repositories/debts-repository", () => ({
  listDebts: listDebtsMock
}));

vi.mock("@/server/repositories/goals-repository", () => ({
  listGoals: listGoalsMock
}));

vi.mock("@/server/repositories/settings-repository", () => ({
  getSettingsProfile: getSettingsProfileMock
}));

describe("getDashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses configured monthly income when present", async () => {
    getSessionUidMock.mockResolvedValue("uid-1");
    listExpensesMock.mockResolvedValue([
      { id: "e1", category: "moradia", amount: 1000, recurring: true, competenceDate: "2026-04" }
    ]);
    listDebtsMock.mockResolvedValue([
      { id: "d1", creditor: "Banco A", principal: 5000, annualInterestRate: 10, status: "ativa" }
    ]);
    listGoalsMock.mockResolvedValue([
      { id: "g1", title: "Reserva", targetAmount: 10000, currentAmount: 5000, dueDate: "2027-12-01" }
    ]);
    getSettingsProfileMock.mockResolvedValue({
      displayName: "Joao",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: 5000
    });

    const result = await getDashboardSummary();

    expect(result.totalExpenses).toBe(1000);
    expect(result.openDebts).toBe(1);
    expect(result.goalsProgress).toBe(50);
    expect(result.monthlyBalance).toBe(3600);
    expect(result.chart[3]).toEqual({ name: "Sobra", value: 3600 });
  });

  it("falls back to baseline income when monthly income is null", async () => {
    getSessionUidMock.mockResolvedValue("uid-2");
    listExpensesMock.mockResolvedValue([
      { id: "e1", category: "alimentacao", amount: 2000, recurring: true, competenceDate: "2026-04" }
    ]);
    listDebtsMock.mockResolvedValue([
      { id: "d1", creditor: "Banco B", principal: 1000, annualInterestRate: 5, status: "ativa" }
    ]);
    listGoalsMock.mockResolvedValue([]);
    getSettingsProfileMock.mockResolvedValue({
      displayName: "",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: null
    });

    const result = await getDashboardSummary();

    expect(result.monthlyBalance).toBe(520);
    expect(result.chart[3]).toEqual({ name: "Sobra", value: 520 });
  });

  it("returns empty summary when auth fails", async () => {
    getSessionUidMock.mockRejectedValue(new Error("sem sessão"));

    const result = await getDashboardSummary();

    expect(result).toEqual({
      monthlyBalance: 0,
      totalExpenses: 0,
      openDebts: 0,
      goalsProgress: 0,
      chart: [
        { name: "Gastos", value: 0 },
        { name: "Dívidas", value: 0 },
        { name: "Metas", value: 0 },
        { name: "Sobra", value: 0 }
      ]
    });
  });
});
