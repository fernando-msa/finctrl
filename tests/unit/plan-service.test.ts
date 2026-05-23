import { describe, expect, it } from "vitest";
import { prioritizeDebts } from "@/server/services/plan-service";

describe("prioritizeDebts", () => {
  const debts = [
    { id: "d1", creditor: "Banco A", principal: 5000, annualInterestRate: 12, status: "ativa" as const },
    { id: "d2", creditor: "Banco B", principal: 3000, annualInterestRate: 24, status: "ativa" as const },
    { id: "d3", creditor: "Banco C", principal: 8000, annualInterestRate: 8, status: "atraso" as const },
    { id: "d4", creditor: "Banco D", principal: 1000, annualInterestRate: 5, status: "quitada" as const }
  ];

  describe("avalanche strategy", () => {
    it("orders debts by highest interest rate first", () => {
      const result = prioritizeDebts(debts, "avalanche");

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ position: 1, debtId: "d2", creditor: "Banco B" });
      expect(result[1]).toEqual({ position: 2, debtId: "d1", creditor: "Banco A" });
      expect(result[2]).toEqual({ position: 3, debtId: "d3", creditor: "Banco C" });
      expect(result[3]).toEqual({ position: 4, debtId: "d4", creditor: "Banco D" });
    });
  });

  describe("snowball strategy", () => {
    it("orders debts by smallest principal first", () => {
      const result = prioritizeDebts(debts, "snowball");

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ position: 1, debtId: "d4", creditor: "Banco D" });
      expect(result[1]).toEqual({ position: 2, debtId: "d2", creditor: "Banco B" });
      expect(result[2]).toEqual({ position: 3, debtId: "d1", creditor: "Banco A" });
      expect(result[3]).toEqual({ position: 4, debtId: "d3", creditor: "Banco C" });
    });
  });

  it("returns empty array when no debts provided", () => {
    expect(prioritizeDebts([], "avalanche")).toEqual([]);
    expect(prioritizeDebts([], "snowball")).toEqual([]);
  });

  it("handles single debt", () => {
    const single = [{ id: "d1", creditor: "Único", principal: 1000, annualInterestRate: 10, status: "ativa" as const }];

    const result = prioritizeDebts(single, "avalanche");

    expect(result).toEqual([{ position: 1, debtId: "d1", creditor: "Único" }]);
  });

  it("does not mutate the original array", () => {
    const original = [...debts];
    prioritizeDebts(debts, "avalanche");

    expect(debts).toEqual(original);
  });
});
