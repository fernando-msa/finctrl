import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  listExpensesByMonth,
  replicateRecurringExpenses
} from "@/server/repositories/expenses-repository";

const mocks = vi.hoisted(() => ({
  getAdminDbMock: vi.fn()
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: mocks.getAdminDbMock
}));

function mockDocRef(overrides: Record<string, unknown> = {}) {
  return {
    id: "doc-id",
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function setupFirestore(collectionGetResult: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }, docRef?: ReturnType<typeof mockDocRef>) {
  const ref = docRef ?? mockDocRef();
  const whereMock = vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(collectionGetResult) });
  const collectionMock = vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue(ref),
    get: vi.fn().mockResolvedValue(collectionGetResult),
    where: whereMock
  });
  const userDoc = { collection: collectionMock };
  const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

  mocks.getAdminDbMock.mockReturnValue({
    collection: vi.fn().mockReturnValue(usersCollection)
  });

  return { ref, collectionMock, whereMock };
}

describe("expenses-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listExpenses", () => {
    it("returns mapped expenses from firestore", async () => {
      setupFirestore({
        docs: [
          { id: "e1", data: () => ({ category: "moradia", description: "Aluguel", amount: 1500, recurring: true, competenceDate: "2026-05" }) },
          { id: "e2", data: () => ({ category: "alimentacao", description: "Mercado", amount: 800, recurring: false, competenceDate: "2026-05" }) }
        ]
      });

      const result = await listExpenses("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: "e1", category: "moradia", description: "Aluguel", amount: 1500, recurring: true, competenceDate: "2026-05" });
    });

    it("returns empty array when no expenses exist", async () => {
      setupFirestore({ docs: [] });

      const result = await listExpenses("uid-empty");

      expect(result).toEqual([]);
    });
  });

  describe("createExpense", () => {
    it("creates expense and returns it with id", async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { id: "new-expense", set: setMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const payload = { category: "lazer" as const, description: "Cinema", amount: 50, recurring: false, competenceDate: "2026-05" };
      const result = await createExpense("uid-1", payload);

      expect(setMock).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ id: "new-expense", ...payload });
    });
  });

  describe("updateExpense", () => {
    it("calls update with partial payload", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { update: updateMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await updateExpense("uid-1", "e1", { amount: 2000 });

      expect(updateMock).toHaveBeenCalledWith({ amount: 2000 });
    });
  });

  describe("deleteExpense", () => {
    it("deletes the expense document", async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { delete: deleteMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await deleteExpense("uid-1", "e1");

      expect(deleteMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("listExpensesByMonth", () => {
    it("filters expenses by competenceDate", async () => {
      const { whereMock } = setupFirestore({
        docs: [
          { id: "e1", data: () => ({ category: "moradia", description: "Aluguel", amount: 1500, recurring: true, competenceDate: "2026-04" }) }
        ]
      });

      const result = await listExpensesByMonth("uid-1", "2026-04");

      expect(whereMock).toHaveBeenCalledWith("competenceDate", "==", "2026-04");
      expect(result).toHaveLength(1);
      expect(result[0].competenceDate).toBe("2026-04");
    });
  });

  describe("replicateRecurringExpenses", () => {
    it("replicates recurring expenses from one month to another", async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const newDocRef = { id: "new-id", set: setMock };
      const docFactory = vi.fn().mockReturnValue(newDocRef);

      const allExpenses = [
        { id: "e1", category: "moradia", description: "Aluguel", amount: 1500, recurring: true, competenceDate: "2026-04" },
        { id: "e2", category: "alimentacao", description: "Mercado", amount: 800, recurring: false, competenceDate: "2026-04" },
        { id: "e3", category: "transporte", description: "Gasolina", amount: 300, recurring: true, competenceDate: "2026-04" }
      ];

      const listGetMock = vi.fn().mockResolvedValue({
        docs: allExpenses.map((e) => ({ id: e.id, data: () => ({ ...e }) }))
      });
      const collectionMock = vi.fn().mockReturnValue({
        doc: docFactory,
        get: listGetMock
      });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await replicateRecurringExpenses("uid-1", "2026-04", "2026-05");

      expect(result).toBe(2);
      expect(setMock).toHaveBeenCalledTimes(2);
    });

    it("returns 0 when no recurring expenses match", async () => {
      setupFirestore({
        docs: [
          { id: "e1", data: () => ({ category: "lazer", description: "Cinema", amount: 50, recurring: false, competenceDate: "2026-04" }) }
        ]
      });

      const result = await replicateRecurringExpenses("uid-1", "2026-04", "2026-05");

      expect(result).toBe(0);
    });
  });
});
