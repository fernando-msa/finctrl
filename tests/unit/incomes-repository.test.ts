import { beforeEach, describe, expect, it, vi } from "vitest";
import { listIncomes, createIncome, updateIncome, deleteIncome } from "@/server/repositories/incomes-repository";

const mocks = vi.hoisted(() => ({
  getAdminDbMock: vi.fn()
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: mocks.getAdminDbMock
}));

function buildFirestoreChain(docData?: Record<string, unknown>[], setMock?: ReturnType<typeof vi.fn>, updateMock?: ReturnType<typeof vi.fn>, deleteMock?: ReturnType<typeof vi.fn>) {
  const docRefs = docData?.map((data, i) => ({
    id: `income-${i + 1}`,
    data: () => data,
    set: setMock ?? vi.fn(),
    update: updateMock ?? vi.fn(),
    delete: deleteMock ?? vi.fn()
  })) ?? [];

  const getMock = vi.fn().mockResolvedValue({
    docs: docRefs.map((ref) => ({ id: ref.id, data: () => ref.data() }))
  });

  const collectionMock = vi.fn().mockReturnValue({
    doc: vi.fn().mockImplementation((id?: string) => {
      if (id) return { set: setMock ?? vi.fn(), update: updateMock ?? vi.fn(), delete: deleteMock ?? vi.fn() };
      return { id: "new-income-id", set: setMock ?? vi.fn(), update: updateMock ?? vi.fn(), delete: deleteMock ?? vi.fn() };
    }),
    get: getMock
  });

  const userDoc = { collection: collectionMock };
  const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

  mocks.getAdminDbMock.mockReturnValue({
    collection: vi.fn().mockReturnValue(usersCollection)
  });

  return { getMock, collectionMock, setMock: setMock ?? vi.fn(), updateMock: updateMock ?? vi.fn(), deleteMock: deleteMock ?? vi.fn() };
}

describe("incomes-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listIncomes", () => {
    it("returns mapped incomes from firestore", async () => {
      buildFirestoreChain([
        { sourceCategory: "salario", sourceDescription: "", amount: 5000, recurring: true, competenceDate: "2026-05" },
        { sourceCategory: "freelance", sourceDescription: "Projeto X", amount: 2000, recurring: false, competenceDate: "2026-05" }
      ]);

      const result = await listIncomes("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "income-1",
        sourceCategory: "salario",
        sourceDescription: "",
        amount: 5000,
        recurring: true,
        competenceDate: "2026-05"
      });
      expect(result[1].id).toBe("income-2");
    });

    it("returns empty array when no incomes exist", async () => {
      buildFirestoreChain([]);

      const result = await listIncomes("uid-empty");

      expect(result).toEqual([]);
    });
  });

  describe("createIncome", () => {
    it("creates a new income and returns it with id", async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { id: "new-id", set: setMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const payload = {
        sourceCategory: "salario" as const,
        sourceDescription: "",
        amount: 5000,
        recurring: true,
        competenceDate: "2026-05"
      };

      const result = await createIncome("uid-1", payload);

      expect(setMock).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ id: "new-id", ...payload });
    });
  });

  describe("updateIncome", () => {
    it("calls update with partial payload", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { update: updateMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await updateIncome("uid-1", "income-1", { amount: 6000 });

      expect(collectionRef.doc).toHaveBeenCalledWith("income-1");
      expect(updateMock).toHaveBeenCalledWith({ amount: 6000 });
    });
  });

  describe("deleteIncome", () => {
    it("deletes the income document", async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { delete: deleteMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await deleteIncome("uid-1", "income-1");

      expect(collectionRef.doc).toHaveBeenCalledWith("income-1");
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
