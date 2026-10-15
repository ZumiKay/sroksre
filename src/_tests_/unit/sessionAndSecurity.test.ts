jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/src/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));
jest.mock("@/src/lib/prisma.ts");

import Prisma from "@/src/lib/prisma.ts";
import {
  checkAccountLockStatus,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/src/lib/userlib";
import { verifySessionInDB } from "@/src/lib/session";
import {
  cleanupExpiredSessions,
  invalidateUserSession,
  invalidateAllUserSessions,
  getUserActiveSessions,
} from "@/src/lib/sessionCleanup";

const mockPrisma = Prisma as unknown as {
  loginAttempt: {
    findUnique: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  usersession: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
  };
};

mockPrisma.loginAttempt = {
  findUnique: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

mockPrisma.usersession = {
  findUnique: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
};

describe("Account Lockout and Session Security Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Brute-Force Protection (LoginAttempt)", () => {
    it("returns isLocked: false when no prior attempts exist", async () => {
      mockPrisma.loginAttempt.findUnique.mockResolvedValue(null);

      const status = await checkAccountLockStatus("user@example.com");
      expect(status.isLocked).toBe(false);
      expect(status.attempts).toBe(0);
    });

    it("returns isLocked: true with remaining minutes when lock is active", async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now
      mockPrisma.loginAttempt.findUnique.mockResolvedValue({
        identifier: "user@example.com",
        failedAttempts: 5,
        isLocked: true,
        lockedUntil: futureDate,
      });

      const status = await checkAccountLockStatus("user@example.com");
      expect(status.isLocked).toBe(true);
      expect(status.remainingTime).toBeGreaterThanOrEqual(9);
      expect(status.attempts).toBe(5);
    });

    it("automatically resets expired lockout upon status check", async () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 1000); // 5 mins in past
      mockPrisma.loginAttempt.findUnique.mockResolvedValue({
        identifier: "user@example.com",
        failedAttempts: 5,
        isLocked: true,
        lockedUntil: pastDate,
      });
      mockPrisma.loginAttempt.update.mockResolvedValue({});

      const status = await checkAccountLockStatus("user@example.com");
      expect(status.isLocked).toBe(false);
      expect(status.attempts).toBe(0);
      expect(mockPrisma.loginAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identifier: "user@example.com" },
          data: expect.objectContaining({
            isLocked: false,
            failedAttempts: 0,
            lockedUntil: null,
          }),
        })
      );
    });

    it("creates a new attempt record on first failed login", async () => {
      mockPrisma.loginAttempt.findUnique.mockResolvedValue(null);
      mockPrisma.loginAttempt.create.mockResolvedValue({});

      const res = await recordFailedLoginAttempt("target@example.com");
      expect(res.isLocked).toBe(false);
      expect(res.attempts).toBe(1);
      expect(mockPrisma.loginAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            identifier: "target@example.com",
            failedAttempts: 1,
          }),
        })
      );
    });

    it("locks the account on the 5th consecutive failure within attempt window", async () => {
      mockPrisma.loginAttempt.findUnique.mockResolvedValue({
        identifier: "target@example.com",
        failedAttempts: 4,
        lastAttemptAt: new Date(),
        isLocked: false,
      });
      mockPrisma.loginAttempt.update.mockResolvedValue({});

      const res = await recordFailedLoginAttempt("target@example.com");
      expect(res.isLocked).toBe(true);
      expect(res.attempts).toBe(5);
      expect(res.remainingTime).toBe(15); // 15 min lockout
      expect(mockPrisma.loginAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { identifier: "target@example.com" },
          data: expect.objectContaining({
            failedAttempts: 5,
            isLocked: true,
            lockedUntil: expect.any(Date),
          }),
        })
      );
    });

    it("clears login attempts on successful authentication", async () => {
      mockPrisma.loginAttempt.findUnique.mockResolvedValue({
        identifier: "target@example.com",
        failedAttempts: 3,
      });
      mockPrisma.loginAttempt.update.mockResolvedValue({});

      await clearLoginAttempts("target@example.com");
      expect(mockPrisma.loginAttempt.update).toHaveBeenCalledWith({
        where: { identifier: "target@example.com" },
        data: {
          failedAttempts: 0,
          isLocked: false,
          lockedUntil: null,
        },
      });
    });
  });

  describe("Session Verification & Eviction (verifySessionInDB)", () => {
    it("returns success: false if session is not found in database", async () => {
      mockPrisma.usersession.findUnique.mockResolvedValue(null);

      const res = await verifySessionInDB("non-existent-session-id");
      expect(res.success).toBe(false);
    });

    it("immediately deletes revoked session and returns success: false", async () => {
      mockPrisma.usersession.findUnique.mockResolvedValue({
        sessionid: "revoked-session-uuid",
        revoked: true,
        expireAt: new Date(Date.now() + 100000),
      });
      mockPrisma.usersession.delete.mockResolvedValue({});

      const res = await verifySessionInDB("revoked-session-uuid");
      expect(res.success).toBe(false);
      expect(mockPrisma.usersession.delete).toHaveBeenCalledWith({
        where: { sessionid: "revoked-session-uuid" },
      });
    });

    it("immediately deletes expired session and returns success: false", async () => {
      mockPrisma.usersession.findUnique.mockResolvedValue({
        sessionid: "expired-session-uuid",
        revoked: false,
        expireAt: new Date(Date.now() - 5000), // expired 5 seconds ago
      });
      mockPrisma.usersession.delete.mockResolvedValue({});

      const res = await verifySessionInDB("expired-session-uuid");
      expect(res.success).toBe(false);
      expect(mockPrisma.usersession.delete).toHaveBeenCalledWith({
        where: { sessionid: "expired-session-uuid" },
      });
    });

    it("returns success: true and user object when session is valid and active", async () => {
      const mockUser = { id: 101, email: "john@example.com" };
      mockPrisma.usersession.findUnique.mockResolvedValue({
        sessionid: "valid-session-uuid",
        revoked: false,
        expireAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour ahead
        user: mockUser,
      });

      const res = await verifySessionInDB("valid-session-uuid");
      expect(res.success).toBe(true);
      expect(res.user).toEqual(mockUser);
    });
  });

  describe("Session Cleanup Utilities (sessionCleanup)", () => {
    it("cleanupExpiredSessions deletes all sessions with past expireAt date", async () => {
      mockPrisma.usersession.deleteMany.mockResolvedValue({ count: 7 });

      const count = await cleanupExpiredSessions();
      expect(count).toBe(7);
      expect(mockPrisma.usersession.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            expireAt: {
              lt: expect.any(Date),
            },
          },
        })
      );
    });

    it("invalidateUserSession deletes specific device session", async () => {
      mockPrisma.usersession.delete.mockResolvedValue({});

      const res = await invalidateUserSession("device-session-123");
      expect(res).toBe(true);
      expect(mockPrisma.usersession.delete).toHaveBeenCalledWith({
        where: { sessionid: "device-session-123" },
      });
    });

    it("invalidateAllUserSessions deletes all active sessions for a user", async () => {
      mockPrisma.usersession.deleteMany.mockResolvedValue({ count: 3 });

      const count = await invalidateAllUserSessions(42);
      expect(count).toBe(3);
      expect(mockPrisma.usersession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 42 },
      });
    });

    it("getUserActiveSessions retrieves non-expired sessions ordered by newest", async () => {
      const mockSessions = [
        { sessionid: "s1", device: "Chrome / Mac", expireAt: new Date(Date.now() + 10000) },
      ];
      mockPrisma.usersession.findMany.mockResolvedValue(mockSessions);

      const sessions = await getUserActiveSessions(42);
      expect(sessions).toEqual(mockSessions);
      expect(mockPrisma.usersession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 42,
            expireAt: { gt: expect.any(Date) },
          },
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });
});
