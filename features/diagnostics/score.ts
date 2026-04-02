import { FinancialProfile } from "@/types/finance";

export function calculateFinancialScore(profile: FinancialProfile) {
  const debtWeight = Math.max(0, 100 - profile.debtRatio * 100);
  const interestWeight = Math.max(0, 100 - profile.avgInterestRate * 10);
  const commitmentWeight = Math.max(0, 100 - profile.incomeCommitted * 100);
  const savingsWeight = Math.min(100, profile.savingsCapacity * 100);

  return Math.round((debtWeight + interestWeight + commitmentWeight + savingsWeight) / 4);
}
