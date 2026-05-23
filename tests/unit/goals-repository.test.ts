import { beforeEach, describe, expect, it, vi } from "vitest";
import { listGoals, createGoal, updateGoal, deleteGoal } from "@/server/repositories/goals-repository";

const mocks = vi.hoisted(() => ({
  getAdminDbMock: vi.fn()
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: mocks.getAdminDbMock
}));

describe("goals-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listGoals", () => {
    it("returns mapped goals from firestore", async () => {
      const getMock = vi.fn().mockResolvedValue({
        docs: [
          { id: "g1", data: () => ({ title: "Reserva de emergência", targetAmount: 30000, currentAmount: 15000, dueDate: "2027-01" }) },
          { id: "g2", data: () => ({ title: "Viagem", targetAmount: 5000, currentAmount: 5000, dueDate: "2026-08" }) }
        ]
      });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listGoals("uid-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: "g1", title: "Reserva de emergência", targetAmount: 30000, currentAmount: 15000, dueDate: "2027-01" });
      expect(result[1].currentAmount).toBe(5000);
    });

    it("returns empty array when no goals exist", async () => {
      const getMock = vi.fn().mockResolvedValue({ docs: [] });
      const collectionMock = vi.fn().mockReturnValue({ get: getMock });
      const userDoc = { collection: collectionMock };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const result = await listGoals("uid-empty");

      expect(result).toEqual([]);
    });
  });

  describe("createGoal", () => {
    it("creates goal and returns it with id", async () => {
      const setMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { id: "new-goal", set: setMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      const payload = { title: "Notebook novo", targetAmount: 4000, currentAmount: 1000, dueDate: "2026-12" };
      const result = await createGoal("uid-1", payload);

      expect(setMock).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ id: "new-goal", ...payload });
    });
  });

  describe("updateGoal", () => {
    it("calls update with partial payload", async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { update: updateMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await updateGoal("uid-1", "g1", { currentAmount: 20000 });

      expect(updateMock).toHaveBeenCalledWith({ currentAmount: 20000 });
    });
  });

  describe("deleteGoal", () => {
    it("deletes the goal document", async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      const docRef = { delete: deleteMock };
      const collectionRef = { doc: vi.fn().mockReturnValue(docRef) };
      const userDoc = { collection: vi.fn().mockReturnValue(collectionRef) };
      const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

      mocks.getAdminDbMock.mockReturnValue({
        collection: vi.fn().mockReturnValue(usersCollection)
      });

      await deleteGoal("uid-1", "g1");

      expect(deleteMock).toHaveBeenCalledTimes(1);
    });
  });
});
