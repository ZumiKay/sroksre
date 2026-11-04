jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn(), count: jest.fn(), deleteMany: jest.fn() },
    wishlist: { deleteMany: jest.fn() },
    orderproduct: { deleteMany: jest.fn() },
    usersession: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
// Files in src/lib import "./prisma"; Jest keys that apart from the alias,
// so point it at the same mock.
jest.mock("../../lib/prisma", () => jest.requireMock("@/src/lib/prisma"));
jest.mock("@/src/lib/mfa", () => ({ consumeTotpCode: jest.fn() }));
jest.mock("@/src/lib/userlib", () => ({
  checkAccountLockStatus: jest.fn(),
  recordFailedLoginAttempt: jest.fn(),
  clearLoginAttempts: jest.fn(),
}));
jest.mock("@/src/lib/emailVerification", () => ({
  CHECK_FAILURE_MESSAGE: { invalid: "Invalid code" },
  checkCode: jest.fn(),
  deleteVerification: jest.fn(),
}));
jest.mock("@/src/lib/session", () => ({ getUser: jest.fn() }));
jest.mock("@/src/lib/adminGuard", () => ({ getAdminSessionStatus: jest.fn() }));
jest.mock("@/src/lib/promotion", () => ({ syncExpiredPromotions: jest.fn() }));
jest.mock("@/src/app/api/banner/route", () => ({ extractQueryParams: jest.fn() }));

import bcryptjs from "bcryptjs";
import Prisma from "@/src/lib/prisma";
import { consumeTotpCode } from "@/src/lib/mfa";
import {
  checkAccountLockStatus,
  clearLoginAttempts,
  recordFailedLoginAttempt,
} from "@/src/lib/userlib";
import { checkCode, deleteVerification } from "@/src/lib/emailVerification";
import { getUser } from "@/src/lib/session";
import { getAdminSessionStatus } from "@/src/lib/adminGuard";
import { confirmIdentity, requirementsFor } from "@/src/lib/confirmIdentity";
import { DELETE as deleteOwnAccount } from "@/src/app/api/users/info/route";
import type { NextRequest } from "next/server";

const db = Prisma as unknown as {
  user: { findUnique: jest.Mock; count: jest.Mock; deleteMany: jest.Mock };
  wishlist: { deleteMany: jest.Mock };
  orderproduct: { deleteMany: jest.Mock };
  usersession: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
};
const mocks = {
  totp: consumeTotpCode as jest.Mock,
  lock: checkAccountLockStatus as jest.Mock,
  fail: recordFailedLoginAttempt as jest.Mock,
  clear: clearLoginAttempts as jest.Mock,
  checkCode: checkCode as jest.Mock,
  deleteVerification: deleteVerification as jest.Mock,
  getUser: getUser as jest.Mock,
  adminStatus: getAdminSessionStatus as jest.Mock,
};

const HASH = bcryptjs.hashSync("right-password", 4);
const account = (overrides: object = {}) => ({
  password: HASH,
  oauthId: null,
  totpEnabledAt: null,
  ...overrides,
});
const req = (body: unknown) =>
  ({ json: async () => body }) as unknown as NextRequest;

beforeEach(() => {
  jest.resetAllMocks();
  mocks.lock.mockResolvedValue({ isLocked: false });
  mocks.fail.mockResolvedValue({ isLocked: false, attempts: 1 });
  db.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));
  db.user.deleteMany.mockResolvedValue({ count: 1 });
});

describe("requirementsFor", () => {
  it("asks a password account for its password", () => {
    expect(requirementsFor(account(), "delete_account")).toEqual({
      password: true,
      emailCode: false,
      totp: false,
    });
  });

  it("asks a Google/Discord account for an email code instead", () => {
    expect(requirementsFor(account({ oauthId: "g-1" }), "delete_account")).toEqual({
      password: false,
      emailCode: true,
      totp: false,
    });
  });

  it("adds the app code when 2FA is on", () => {
    const on = account({ totpEnabledAt: new Date() });
    expect(requirementsFor(on, "delete_account").totp).toBe(true);
    // Admin deleting users: the app code replaces the password.
    expect(requirementsFor(on, "delete_users")).toEqual({
      password: false,
      emailCode: false,
      totp: true,
    });
  });

  it("falls back to the password for an admin without 2FA", () => {
    expect(requirementsFor(account(), "delete_users")).toEqual({
      password: true,
      emailCode: false,
      totp: false,
    });
  });
});

describe("confirmIdentity", () => {
  it("accepts the right password and clears the lockout counter", async () => {
    db.user.findUnique.mockResolvedValue(account());
    const result = await confirmIdentity(1, "delete_account", {
      password: "right-password",
    });
    expect(result).toEqual({ ok: true });
    expect(mocks.clear).toHaveBeenCalledWith("confirm-identity:1");
  });

  it("rejects a wrong or missing password and counts it", async () => {
    db.user.findUnique.mockResolvedValue(account());
    for (const password of ["wrong", undefined]) {
      const result = await confirmIdentity(1, "delete_account", { password });
      expect(result).toEqual({ ok: false, status: 400, message: "Incorrect password" });
    }
    expect(mocks.fail).toHaveBeenCalledTimes(2);
  });

  it("doesn't spend the app code when the password is wrong", async () => {
    db.user.findUnique.mockResolvedValue(account({ totpEnabledAt: new Date() }));
    await confirmIdentity(1, "delete_account", { password: "wrong", code: "123456" });
    expect(mocks.totp).not.toHaveBeenCalled();
  });

  it("needs both the password and the app code when 2FA is on", async () => {
    db.user.findUnique.mockResolvedValue(account({ totpEnabledAt: new Date() }));
    mocks.totp.mockResolvedValue(false);
    const bad = await confirmIdentity(1, "delete_account", {
      password: "right-password",
      code: "000000",
    });
    expect(bad.ok).toBe(false);

    mocks.totp.mockResolvedValue(true);
    const good = await confirmIdentity(1, "delete_account", {
      password: "right-password",
      code: "123456",
    });
    expect(good).toEqual({ ok: true });
    expect(mocks.totp).toHaveBeenLastCalledWith(1, "123456");
  });

  it("checks and then uses up the email code for OAuth accounts", async () => {
    db.user.findUnique.mockResolvedValue(account({ oauthId: "g-1" }));
    mocks.checkCode.mockResolvedValue({ ok: true, id: 42 });

    const result = await confirmIdentity(1, "delete_account", { emailCode: "123456" });

    expect(result).toEqual({ ok: true });
    expect(mocks.checkCode).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "DELETE_ACCOUNT", userId: 1, code: "123456" }),
    );
    expect(mocks.deleteVerification).toHaveBeenCalledWith(42);
  });

  it("refuses while locked out, without checking anything", async () => {
    mocks.lock.mockResolvedValue({ isLocked: true, remainingTime: 12 });
    const result = await confirmIdentity(1, "delete_account", { password: "right-password" });
    expect(result).toMatchObject({ ok: false, status: 429 });
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("reports the lockout on the attempt that triggers it", async () => {
    db.user.findUnique.mockResolvedValue(account());
    mocks.fail.mockResolvedValue({ isLocked: true, remainingTime: 15, attempts: 5 });
    const result = await confirmIdentity(1, "delete_account", { password: "wrong" });
    expect(result).toMatchObject({ ok: false, status: 429 });
  });
});

describe("DELETE /api/users/info (delete own account)", () => {
  const customer = { userId: 5, sessionid: "sid", user: { role: "USER" } };
  const admin = { userId: 1, sessionid: "sid", user: { role: "ADMIN" } };

  it("refuses without a login", async () => {
    mocks.getUser.mockResolvedValue(null);
    const res = await deleteOwnAccount(req({}));
    expect(res.status).toBe(401);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses a wrong password without deleting anything", async () => {
    mocks.getUser.mockResolvedValue(customer);
    db.user.findUnique.mockResolvedValue(account());
    const res = await deleteOwnAccount(req({ password: "wrong" }));
    expect(res.status).toBe(400);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes the account and its wishlist with the right password", async () => {
    mocks.getUser.mockResolvedValue(customer);
    db.user.findUnique.mockResolvedValue(account());
    const res = await deleteOwnAccount(req({ password: "right-password" }));
    expect(res.status).toBe(200);
    expect(db.wishlist.deleteMany).toHaveBeenCalledWith({ where: { uid: { in: [5] } } });
    expect(db.user.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [5] } } });
  });

  it("refuses an admin login that hasn't passed 2FA", async () => {
    mocks.getUser.mockResolvedValue(admin);
    mocks.adminStatus.mockResolvedValue("mfa_required");
    const res = await deleteOwnAccount(req({ password: "right-password" }));
    expect(res.status).toBe(403);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses to delete the last admin", async () => {
    mocks.getUser.mockResolvedValue(admin);
    mocks.adminStatus.mockResolvedValue("ok");
    db.user.count.mockResolvedValue(1);
    const res = await deleteOwnAccount(req({ password: "right-password" }));
    expect(res.status).toBe(403);
    expect(db.user.deleteMany).not.toHaveBeenCalled();
  });
});
