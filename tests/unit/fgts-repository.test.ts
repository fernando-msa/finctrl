import { beforeEach, describe, expect, it, vi } from "vitest";
import { listFgtsEntries, createFgtsEntry, updateFgtsEntry, deleteFgtsEntry } from "@/server/repositories/fgts-repository";

const mocks = vi.hoisted(() => ({
  getAdminDbMock: vi.fn()
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: mocks.getAdminDbMock
}));

describe("fgts-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listFgtsEntries", () => {
    it("returns mapped FGTS entries from firestore", async () => {
      const getMock = vi.fn().mockResolvedValue({
        docs: [
          { id: "f1", data: () => ({ accountLabel: "Conta principal", balance: 8500, modality: "saque_aniversario", updatedAt: "2026-04" }) },
          { id: "f2", data: () => ({ accountLabel: "Conta antiga", balance: 3200, modality: "saque_rescisao", updatedAt: "2026-03" }) }
        ]
      });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listFgtsEntries("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: "f1", accountLabel: "Conta principal", balance: 8500, modality: "saque_aniversario", updatedAt: "2026-04" });
      expect(result[1].modality).toBe("saque_rescisao");
    });

    it("normalizes missing fields with defaults", async () => {
      const getMock = vi.fn().mockResolvedValue({
        docs: [
          { id: "f1", data: () => ({ balance: 1000 }) }
        ]
      });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listFgtsEntries("uid-1");

      expect(result[0]).toEqual({
        id: "f1",
        accountLabel: "Conta FGTS",
        balance: 1000,
        modality: "indefinido",
        updatedAt: "—"
      });
    });

    it("returns empty array when no entries exist", async () => {
      const getMock = vi.fn().mockResolvedValue({ docs: [] });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listFgtsEntries("uid-empty");

      expect(result).toEqual([]);
    });
  });

  describe("createFgtsEntry", () => {
    it("creates entry and returns it with id", async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { id: "new-fgts", set: setMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const payload = { accountLabel: "Nova conta", balance: 5000, modality: "saque_aniversario" as const, updatedAt: "2026-05" };
      const result = await createFgtsEntry("uid-1", payload);

      expect(setMock).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ id: "new-fgts", ...payload });
    });
  });

  describe("updateFgtsEntry", () => {
    it("calls update with partial payload", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { update: updateMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await updateFgtsEntry("uid-1", "f1", { balance: 9000 });

      expect(updateMock).toHaveBeenCalledWith({ balance: 9000 });
    });
  });

  describe("deleteFgtsEntry", () => {
    it("deletes the FGTS entry document", async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { delete: deleteMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await deleteFgtsEntry("uid-1", "f1");

      expect(deleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
