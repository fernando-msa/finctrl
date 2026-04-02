export type Expense = {
  id: string;
  category: "moradia" | "transporte" | "alimentacao" | "saude" | "educacao" | "lazer" | "outros";
  amount: number;
  recurring: boolean;
  competenceDate: string;
};

export type Debt = {
  id: string;
  creditor: string;
  principal: number;
  annualInterestRate: number;
  status: "ativa" | "quitada" | "atraso";
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
};

export type FinancialProfile = {
  debtRatio: number;
  avgInterestRate: number;
  incomeCommitted: number;
  savingsCapacity: number;
};
