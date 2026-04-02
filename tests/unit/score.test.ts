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
});
