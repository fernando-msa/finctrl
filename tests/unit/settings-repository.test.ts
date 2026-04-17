import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSettingsProfile, updateSettingsProfile } from "@/server/repositories/settings-repository";

const getAdminDbMock = vi.fn();

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDb: getAdminDbMock
}));

describe("settings-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default settings when profile does not exist", async () => {
    const getMock = vi.fn().mockResolvedValue({ exists: false });
    const setMock = vi.fn();
    const profileDoc = { get: getMock, set: setMock };
    const settingsCollection = { doc: vi.fn().mockReturnValue(profileDoc) };
    const userDoc = { collection: vi.fn().mockReturnValue(settingsCollection) };
    const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

    getAdminDbMock.mockReturnValue({
      collection: vi.fn().mockReturnValue(usersCollection)
    });

    const result = await getSettingsProfile("user-1");

    expect(result).toEqual({
      displayName: "",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: null
    });
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("normalizes profile fields from firestore", async () => {
    const getMock = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        displayName: "Ana",
        currency: "USD",
        weeklyReminder: 0,
        monthlyIncome: 9500,
        updatedAt: "2026-04-17T10:00:00.000Z"
      })
    });
    const profileDoc = { get: getMock, set: vi.fn() };
    const settingsCollection = { doc: vi.fn().mockReturnValue(profileDoc) };
    const userDoc = { collection: vi.fn().mockReturnValue(settingsCollection) };
    const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

    getAdminDbMock.mockReturnValue({
      collection: vi.fn().mockReturnValue(usersCollection)
    });

    const result = await getSettingsProfile("user-2");

    expect(result).toEqual({
      displayName: "Ana",
      currency: "USD",
      weeklyReminder: false,
      monthlyIncome: 9500,
      updatedAt: "2026-04-17T10:00:00.000Z"
    });
  });

  it("writes payload with updatedAt when updating settings", async () => {
    const setMock = vi.fn().mockResolvedValue(undefined);
    const profileDoc = { get: vi.fn(), set: setMock };
    const settingsCollection = { doc: vi.fn().mockReturnValue(profileDoc) };
    const userDoc = { collection: vi.fn().mockReturnValue(settingsCollection) };
    const usersCollection = { doc: vi.fn().mockReturnValue(userDoc) };

    getAdminDbMock.mockReturnValue({
      collection: vi.fn().mockReturnValue(usersCollection)
    });

    await updateSettingsProfile("user-3", {
      displayName: "Carlos",
      currency: "BRL",
      weeklyReminder: true,
      monthlyIncome: 4200
    });

    expect(setMock).toHaveBeenCalledTimes(1);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Carlos",
        currency: "BRL",
        weeklyReminder: true,
        monthlyIncome: 4200
      })
    );
    expect(setMock.mock.calls[0][0].updatedAt).toEqual(expect.any(String));
  });
});
