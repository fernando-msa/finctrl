export type Expense = {
  id: string;
  category: "moradia" | "transporte" | "alimentacao" | "saude" | "educacao" | "lazer" | "outros";
  description: string;
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

export type FgtsEntry = {
  id: string;
  accountLabel: string;
  balance: number;
  modality: "saque_aniversario" | "saque_rescisao" | "indefinido";
  updatedAt: string;
};

export type FinancialProfile = {
  debtRatio: number;
  avgInterestRate: number;
  incomeCommitted: number;
  savingsCapacity: number;
};

export type Income = {
  id: string;
  sourceCategory: "salario" | "freelance" | "aluguel" | "investimentos" | "aposentadoria" | "outros";
  sourceDescription: string;
  amount: number;
  recurring: boolean;
  competenceDate: string;
};

export type UserSettingsProfile = {
  displayName: string;
  currency: "BRL" | "USD" | "EUR";
  weeklyReminder: boolean;
  monthlyIncome: number | null;
  updatedAt?: string;
};
