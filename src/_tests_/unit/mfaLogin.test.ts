jest.mock("../../lib/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    loginAttempt: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));
jest.mock("../../lib/mfa", () => ({ verifySecondFactor: jest.fn() }));
jest.mock("../../lib/utilities", () => ({
  checkpassword: jest.fn(),
  getOneWeekFromToday: jest.fn(),
}));
jest.mock("bcryptjs", () => ({ compare: jest.fn(), hashSync: jest.fn() }));

import Prisma from "../../lib/prisma";
import { verifySecondFactor } from "../../lib/mfa";
import bcryptjs from "bcryptjs";
import { userlogin } from "@/src/lib/userlib";

const db = Prisma as unknown as {
  user: { findUnique: jest.Mock };
  loginAttempt: Record<string, jest.Mock>;
};
const mockVerify = verifySecondFactor as jest.Mock;
const mockCompare = (bcryptjs as unknown as { compare: jest.Mock }).compare;

const login = (otp?: string) =>
  userlogin(
    { email: "admin@example.com", password: "Passw0rd!", otp, recapcha: null },
    { headers: {} },
  );

beforeEach(() => {
  jest.resetAllMocks();
  db.loginAttempt.findUnique.mockResolvedValue(null);
  db.loginAttempt.create.mockResolvedValue({ failedAttempts: 1 });
  mockCompare.mockResolvedValue(true);
});

describe("userlogin with two-factor", () => {
  it("logs in users without two-factor as before, not marked verified", async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      password: "hash",
      role: "USER",
      totpEnabledAt: null,
    });

    const result = await login();
    expect(result).toEqual({
      success: true,
      data: { userId: 1, role: "USER", mfaVerified: false },
    });
    expect(mockVerify).not.toHaveBeenCalled();
  });

  describe("account with two-factor on", () => {
    beforeEach(() => {
      db.user.findUnique.mockResolvedValue({
        id: 1,
        password: "hash",
        role: "ADMIN",
        totpEnabledAt: new Date(),
      });
    });

    it("asks for a code after a correct password, without resetting failed attempts", async () => {
      // 3 earlier failures, not locked.
      db.loginAttempt.findUnique.mockResolvedValue({
        failedAttempts: 3,
        isLocked: false,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      });

      const result = await login();

      expect(result.success).toBe(false);
      expect(result.code).toBe("MFA_REQUIRED");
      const resets = db.loginAttempt.update.mock.calls.filter(
        ([args]) => args?.data?.failedAttempts === 0,
      );
      expect(resets).toHaveLength(0);
    });

    it("resets failed attempts only after the code passes", async () => {
      db.loginAttempt.findUnique.mockResolvedValue({
        failedAttempts: 3,
        isLocked: false,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      });
      mockVerify.mockResolvedValue(true);

      await login("287082");

      expect(db.loginAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedAttempts: 0 }),
        }),
      );
    });

    it("rejects a wrong code and counts it as a failed attempt", async () => {
      mockVerify.mockResolvedValue(false);

      const result = await login("111111");

      expect(result.code).toBe("MFA_INVALID");
      expect(db.loginAttempt.create).toHaveBeenCalled();
    });

    it("logs in with a correct code and marks the login verified", async () => {
      mockVerify.mockResolvedValue(true);

      const result = await login(" 287082 ");

      expect(mockVerify).toHaveBeenCalledWith(1, "287082");
      expect(result).toEqual({
        success: true,
        data: { userId: 1, role: "ADMIN", mfaVerified: true },
      });
    });

    it("never asks for the code when the password is wrong", async () => {
      mockCompare.mockResolvedValue(false);

      const result = await login("287082");

      expect(result.success).toBe(false);
      expect(result.code).toBeUndefined();
      expect(mockVerify).not.toHaveBeenCalled();
    });
  });
});
