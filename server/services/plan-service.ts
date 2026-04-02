import { Debt } from "@/types/finance";

export function prioritizeDebts(debts: Debt[], strategy: "avalanche" | "snowball") {
  const ordered = [...debts].sort((a, b) => {
    if (strategy === "avalanche") {
      return b.annualInterestRate - a.annualInterestRate;
    }

    return a.principal - b.principal;
  });

  return ordered.map((debt, index) => ({
    position: index + 1,
    debtId: debt.id,
    creditor: debt.creditor
  }));
}
