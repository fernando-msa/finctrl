import { beforeEach, describe, expect, it, vi } from "vitest";
import { listDebts, createDebt, updateDebt, deleteDebt } from "@/server/repositories/debts-repository";

const mocks = vi.hoisted(() => ({
  getAdminDbMock: vi.fn()
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: mocks.getAdminDbMock
}));

describe("debts-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listDebts", () => {
    it("returns mapped debts from firestore", async () => {
      const getMock = vi.fn().mockResolvedValue({
        docs: [
          { id: "d1", data: () => ({ creditor: "Banco A", principal: 5000, annualInterestRate: 12, status: "ativa" }) },
          { id: "d2", data: () => ({ creditor: "Banco B", principal: 3000, annualInterestRate: 8, status: "quitada" }) }
        ]
      });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listDebts("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: "d1", creditor: "Banco A", principal: 5000, annualInterestRate: 12, status: "ativa" });
      expect(result[1].status).toBe("quitada");
    });

    it("returns empty array when no debts exist", async () => {
      const getMock = vi.fn().mockResolvedValue({ docs: [] });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listDebts("uid-empty");

      expect(result).toEqual([]);
    });
  });

  describe("createDebt", () => {
    it("creates debt and returns it with id", async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { id: "new-debt", set: setMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const payload = { creditor: "Cartão X", principal: 10000, annualInterestRate: 15, status: "ativa" as const };
      const result = await createDebt("uid-1", payload);

      expect(setMock).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ id: "new-debt", ...payload });
    });
  });

  describe("updateDebt", () => {
    it("calls update with partial payload", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { update: updateMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await updateDebt("uid-1", "d1", { status: "quitada" });

      expect(updateMock).toHaveBeenCalledWith({ status: "quitada" });
    });
  });

  describe("deleteDebt", () => {
    it("deletes the debt document", async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { delete: deleteMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await deleteDebt("uid-1", "d1");

      expect(deleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
