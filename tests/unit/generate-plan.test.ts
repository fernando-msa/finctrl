import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateFinancialPlan } from "@/server/use-cases/generate-plan";

const mocks = vi.hoisted(() => ({
  listExpensesMock: vi.fn()
}));

vi.mock("@/server/repositories/expenses-repository", () => ({
  listExpenses: mocks.listExpensesMock
}));

describe("generateFinancialPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates free cash flow and suggested investment", async () => {
    mocks.listExpensesMock.mockResolvedValue([
      { id: "e1", category: "moradia", description: "Aluguel", amount: 1500, recurring: true, competenceDate: "2026-05" },
      { id: "e2", category: "alimentacao", description: "Mercado", amount: 800, recurring: true, competenceDate: "2026-05" }
    ]);

    const result = await generateFinancialPlan({
      uid: "uid-1",
      debts: [
        { id: "d1", creditor: "Banco A", principal: 5000, annualInterestRate: 15, status: "ativa" },
        { id: "d2", creditor: "Banco B", principal: 3000, annualInterestRate: 8, status: "ativa" }
      ],
      income: 5000
    });

    expect(result.freeCashFlow).toBe(2700);
    expect(result.suggestedInvestmentForGoals).toBe(1080);
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].creditor).toBe("Banco A");
    expect(result.recommendations[1].creditor).toBe("Banco B");
  });

  it("clamps free cash flow to zero when expenses exceed income", async () => {
    mocks.listExpensesMock.mockResolvedValue([
      { id: "e1", category: "moradia", description: "Aluguel", amount: 6000, recurring: true, competenceDate: "2026-05" }
    ]);

    const result = await generateFinancialPlan({
      uid: "uid-1",
      debts: [],
      income: 4000
    });

    expect(result.freeCashFlow).toBe(0);
    expect(result.suggestedInvestmentForGoals).toBe(0);
    expect(result.recommendations).toEqual([]);
  });

  it("handles zero expenses", async () => {
    mocks.listExpensesMock.mockResolvedValue([]);

    const result = await generateFinancialPlan({
      uid: "uid-1",
      debts: [],
      income: 3000
    });

    expect(result.freeCashFlow).toBe(3000);
    expect(result.suggestedInvestmentForGoals).toBe(1200);
  });

  it("passes debts to prioritizeDebts with avalanche strategy", async () => {
    mocks.listExpensesMock.mockResolvedValue([]);

    const debts = [
      { id: "d1", creditor: "Low", principal: 1000, annualInterestRate: 5, status: "ativa" as const },
      { id: "d2", creditor: "High", principal: 2000, annualInterestRate: 20, status: "ativa" as const }
    ];

    const result = await generateFinancialPlan({ uid: "uid-1", debts, income: 5000 });

    expect(result.recommendations[0].creditor).toBe("High");
    expect(result.recommendations[1].creditor).toBe("Low");
  });
});
