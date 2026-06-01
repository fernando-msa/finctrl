import { describe, expect, it } from "vitest";
import { calculateFinancialScore } from "@/features/diagnostics/score";

describe("calculateFinancialScore", () => {
  it("returns score between 0 and 100", () => {
    const score = calculateFinancialScore({
      debtRatio: 0.3,
      avgInterestRate: 1.2,
      incomeCommitted: 0.5,
      savingsCapacity: 0.25
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns 100 for perfect profile", () => {
    const score = calculateFinancialScore({
      debtRatio: 0,
      avgInterestRate: 0,
      incomeCommitted: 0,
      savingsCapacity: 1
    });

    expect(score).toBe(100);
  });

  it("returns low score for worst profile", () => {
    const score = calculateFinancialScore({
      debtRatio: 1,
      avgInterestRate: 10,
      incomeCommitted: 1,
      savingsCapacity: 0
    });

    expect(score).toBeLessThanOrEqual(25);
  });

  it("calculates weighted average correctly", () => {
    const score = calculateFinancialScore({
      debtRatio: 0.5,
      avgInterestRate: 5,
      incomeCommitted: 0.5,
      savingsCapacity: 0.5
    });

    const expected = Math.round((50 + 50 + 50 + 50) / 4);
    expect(score).toBe(expected);
  });

  it("debt, interest and commitment weights floor at 0 but savings can go negative", () => {
    const score = calculateFinancialScore({
      debtRatio: 2,
      avgInterestRate: 15,
      incomeCommitted: 1.5,
      savingsCapacity: -0.5
    });

    // debtWeight=0, interestWeight=0, commitmentWeight=0, savingsWeight=-50
    // avg = (0+0+0+(-50))/4 = -12.5 -> -12
    expect(score).toBe(-12);
  });

  it("clamps savings capacity to 100", () => {
    const score = calculateFinancialScore({
      debtRatio: 0,
      avgInterestRate: 0,
      incomeCommitted: 0,
      savingsCapacity: 5
    });

    expect(score).toBeLessThanOrEqual(100);
  });
});
