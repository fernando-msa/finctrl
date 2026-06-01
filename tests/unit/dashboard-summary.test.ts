import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardSummary } from "@/features/dashboard/get-summary";

const mocks = vi.hoisted(() => ({
  getSessionUidMock: vi.fn(),
  listExpensesMock: vi.fn(),
  listDebtsMock: vi.fn(),
  listGoalsMock: vi.fn(),
  listIncomesMock: vi.fn(),
  getSettingsProfileMock: vi.fn()
}));

vi.mock("@/lib/firebase/auth", () => ({
  getSessionUid: mocks.getSessionUidMock
}));

vi.mock("@/server/repositories/expenses-repository", () => ({
  listExpenses: mocks.listExpensesMock
}));

vi.mock("@/server/repositories/debts-repository", () => ({
  listDebts: mocks.listDebtsMock
}));

vi.mock("@/server/repositories/goals-repository", () => ({
  listGoals: mocks.listGoalsMock
}));

vi.mock("@/server/repositories/incomes-repository", () => ({
  listIncomes: mocks.listIncomesMock
}));

vi.mock("@/server/repositories/settings-repository", () => ({
  getSettingsProfile: mocks.getSettingsProfileMock
}));

describe("getDashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses configured monthly income when present", async () => {
    mocks.getSessionUidMock.mockResolvedValue("uid-1");
    mocks.listExpensesMock.mockResolvedValue([
      { id: "e1", category: "moradia", amount: 1000, recurring: true, competenceDate: "2026-04" }
    ]);
    mocks.listDebtsMock.mockResolvedValue([
      { id: "d1", creditor: "Banco A", principal: 5000, annualInterestRate: 10, status: "ativa" }
    ]);
    mocks.listGoalsMock.mockResolvedValue([
      { id: "g1", title: "Reserva", targetAmount: 10000, currentAmount: 5000, dueDate: "2027-12-01" }
    ]);
    mocks.listIncomesMock.mockResolvedValue([]);
    mocks.getSettingsProfileMock.mockResolvedValue({
      displayName: "Joao",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: 5000
    });

    const result = await getDashboardSummary();

    expect(result.totalExpenses).toBe(1000);
    expect(result.totalIncomes).toBe(0);
    expect(result.openDebts).toBe(1);
    expect(result.goalsProgress).toBe(50);
    expect(result.monthlyBalance).toBe(3600);
    expect(result.chart[4]).toEqual({ name: "Sobra", value: 3600 });
  });

  it("falls back to baseline income when monthly income is null", async () => {
    mocks.getSessionUidMock.mockResolvedValue("uid-2");
    mocks.listExpensesMock.mockResolvedValue([
      { id: "e1", category: "alimentacao", amount: 2000, recurring: true, competenceDate: "2026-04" }
    ]);
    mocks.listDebtsMock.mockResolvedValue([
      { id: "d1", creditor: "Banco B", principal: 1000, annualInterestRate: 5, status: "ativa" }
    ]);
    mocks.listGoalsMock.mockResolvedValue([]);
    mocks.listIncomesMock.mockResolvedValue([]);
    mocks.getSettingsProfileMock.mockResolvedValue({
      displayName: "",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: null
    });

    const result = await getDashboardSummary();

    expect(result.monthlyBalance).toBe(520);
    expect(result.chart[4]).toEqual({ name: "Sobra", value: 520 });
  });

  it("returns empty summary when auth fails", async () => {
    mocks.getSessionUidMock.mockRejectedValue(new Error("sem sessão"));

    const result = await getDashboardSummary();

    expect(result).toEqual({
      monthlyBalance: 0,
      totalExpenses: 0,
      totalIncomes: 0,
      openDebts: 0,
      goalsProgress: 0,
      chart: [
        { name: "Receitas", value: 0 },
        { name: "Gastos", value: 0 },
        { name: "Dívidas", value: 0 },
        { name: "Metas", value: 0 },
        { name: "Sobra", value: 0 }
      ]
    });
  });

  it("returns empty summary when data loading fails", async () => {
    mocks.getSessionUidMock.mockResolvedValue("uid-3");
    mocks.listExpensesMock.mockRejectedValue(new Error("Firestore down"));

    const result = await getDashboardSummary();

    expect(result.totalExpenses).toBe(0);
    expect(result.monthlyBalance).toBe(0);
  });

  it("uses actual incomes over settings income", async () => {
    mocks.getSessionUidMock.mockResolvedValue("uid-4");
    mocks.listExpensesMock.mockResolvedValue([
      { id: "e1", category: "moradia", amount: 1000, recurring: true, competenceDate: "2026-04" }
    ]);
    mocks.listDebtsMock.mockResolvedValue([]);
    mocks.listGoalsMock.mockResolvedValue([]);
    mocks.listIncomesMock.mockResolvedValue([
      { id: "i1", sourceCategory: "salario", sourceDescription: "", amount: 6000, recurring: true, competenceDate: "2026-04" }
    ]);
    mocks.getSettingsProfileMock.mockResolvedValue({
      displayName: "Maria",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: 3000
    });

    const result = await getDashboardSummary();

    expect(result.totalIncomes).toBe(6000);
    expect(result.monthlyBalance).toBe(5000);
  });

  it("calculates goals progress correctly with multiple goals", async () => {
    mocks.getSessionUidMock.mockResolvedValue("uid-5");
    mocks.listExpensesMock.mockResolvedValue([]);
    mocks.listDebtsMock.mockResolvedValue([]);
    mocks.listGoalsMock.mockResolvedValue([
      { id: "g1", title: "Meta A", targetAmount: 10000, currentAmount: 5000, dueDate: "2027-01" },
      { id: "g2", title: "Meta B", targetAmount: 10000, currentAmount: 3000, dueDate: "2027-06" }
    ]);
    mocks.listIncomesMock.mockResolvedValue([]);
    mocks.getSettingsProfileMock.mockResolvedValue({
      displayName: "User",
      currency: "BRL",
      weeklyReminder: false,
      monthlyIncome: null
    });

    const result = await getDashboardSummary();

    expect(result.goalsProgress).toBe(40);
  });

  it("counts only non-quitada debts as open", async () => {
    mocks.getSessionUidMock.mockResolvedValue("uid-6");
    mocks.listExpensesMock.mockResolvedValue([]);
    mocks.listDebtsMock.mockResolvedValue([
      { id: "d1", creditor: "A", principal: 5000, annualInterestRate: 10, status: "ativa" },
      { id: "d2", creditor: "B", principal: 3000, annualInterestRate: 8, status: "quitada" },
      { id: "d3", creditor: "C", principal: 2000, annualInterestRate: 12, status: "atraso" }
    ]);
    mocks.listGoalsMock.mockResolvedValue([]);
    mocks.listIncomesMock.mockResolvedValue([]);
    mocks.getSettingsProfileMock.mockResolvedValue({
      displayName: "User",
      currency: "BRL",
      weeklyReminder: false,
      monthlyIncome: null
    });

    const result = await getDashboardSummary();

    expect(result.openDebts).toBe(2);
  });
});
