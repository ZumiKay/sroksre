//Module mock — explicit factory so the lib's relative "./prisma" import is mocked too
jest.mock("@/src/lib/prisma.ts", () => ({
  __esModule: true,
  default: jest.requireActual("jest-mock-extended").mockDeep(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import { createHash } from "crypto";
import { mockReset } from "jest-mock-extended";
import Prisma from "@/src/lib/prisma.ts";
import {
  VERIFICATION_CONFIG,
  checkCode,
  findResetToken,
  issueResetToken,
  issueSignupCode,
  resetPasswordWithToken,
} from "@/src/lib/emailVerification";

const db = Prisma as unknown as {
  $transaction: jest.Mock;
  emailVerification: {
    findFirst: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
    create: jest.Mock;
  };
  user: { update: jest.Mock };
  usersession: { deleteMany: jest.Mock };
};

beforeEach(() => {
  mockReset(Prisma as never);
});

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const future = () => new Date(Date.now() + 60_000);

const record = (overrides: object = {}) => ({
  id: 7,
  purpose: "SIGNUP",
  email: "a@b.com",
  userId: null,
  tokenHash: sha256("123456"),
  attempts: 0,
  expiresAt: future(),
  createdAt: new Date(),
  ...overrides,
});

describe("issueSignupCode", () => {
  beforeEach(() => {
    db.$transaction.mockResolvedValue([{ count: 0 }, { id: 11 }]);
  });

  it("creates a 6-digit code and stores only its hash", async () => {
    db.emailVerification.findFirst.mockResolvedValue(null);

    const result = await issueSignupCode("a@b.com");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.secret).toMatch(/^\d{6}$/);
    expect(result.id).toBe(11);

    const { data } = db.emailVerification.create.mock.calls[0][0];
    expect(data.tokenHash).toBe(sha256(result.secret));
    expect(JSON.stringify(data)).not.toContain(`"${result.secret}"`);
    expect(data).toMatchObject({ purpose: "SIGNUP", email: "a@b.com", userId: null });

    const ttl = data.expiresAt.getTime() - Date.now();
    expect(ttl).toBeGreaterThan(VERIFICATION_CONFIG.CODE_TTL_MS - 5_000);
    expect(ttl).toBeLessThanOrEqual(VERIFICATION_CONFIG.CODE_TTL_MS);
  });

  it("replaces the previous code for the same email", async () => {
    db.emailVerification.findFirst.mockResolvedValue(null);

    await issueSignupCode("a@b.com");

    const { where } = db.emailVerification.deleteMany.mock.calls[0][0];
    expect(where.OR[0]).toEqual({ purpose: "SIGNUP", email: "a@b.com" });
  });

  it("refuses a new code during the resend cooldown", async () => {
    db.emailVerification.findFirst.mockResolvedValue({ id: 1 });

    const result = await issueSignupCode("a@b.com");

    expect(result).toEqual({ ok: false, reason: "cooldown" });
    expect(db.emailVerification.create).not.toHaveBeenCalled();
  });
});

describe("issueResetToken", () => {
  it("creates a long random token scoped to the user", async () => {
    db.emailVerification.findFirst.mockResolvedValue(null);
    db.$transaction.mockResolvedValue([{ count: 0 }, { id: 3 }]);

    const result = await issueResetToken(5, "a@b.com");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const { data } = db.emailVerification.create.mock.calls[0][0];
    expect(data).toMatchObject({ purpose: "RESET_PASSWORD", userId: 5 });
    expect(data.tokenHash).toBe(sha256(result.secret));
  });
});

describe("checkCode", () => {
  const check = (code: unknown = "123456") =>
    checkCode({ purpose: "SIGNUP", email: "a@b.com", code });

  it("accepts the right code", async () => {
    db.emailVerification.findFirst.mockResolvedValue(record());
    db.emailVerification.updateMany.mockResolvedValue({ count: 1 });

    await expect(check()).resolves.toEqual({
      ok: true,
      id: 7,
      email: "a@b.com",
      userId: null,
    });
  });

  it("looks up sign-up codes by email and change-email codes by user", async () => {
    db.emailVerification.findFirst.mockResolvedValue(null);

    await check();
    await checkCode({ purpose: "CHANGE_EMAIL", userId: 9, code: "1" });

    expect(db.emailVerification.findFirst.mock.calls[0][0].where).toEqual({
      purpose: "SIGNUP",
      email: "a@b.com",
    });
    expect(db.emailVerification.findFirst.mock.calls[1][0].where).toEqual({
      purpose: "CHANGE_EMAIL",
      userId: 9,
    });
  });

  it.each(["654321", "12345", "1234567", "abcdef", 123456, null])(
    "rejects a wrong or malformed code (%p) and counts the attempt",
    async (code) => {
      db.emailVerification.findFirst.mockResolvedValue(record());
      db.emailVerification.updateMany.mockResolvedValue({ count: 1 });

      await expect(check(code)).resolves.toEqual({
        ok: false,
        reason: "invalid",
      });
      expect(db.emailVerification.updateMany).toHaveBeenCalledWith({
        where: { id: 7, attempts: { lt: VERIFICATION_CONFIG.MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
      });
    },
  );

  it("blocks once the attempt limit is used up, even with the right code", async () => {
    db.emailVerification.findFirst.mockResolvedValue(record({ attempts: 5 }));
    db.emailVerification.updateMany.mockResolvedValue({ count: 0 });

    await expect(check()).resolves.toEqual({
      ok: false,
      reason: "too_many_attempts",
    });
  });

  it("rejects an expired code without counting an attempt", async () => {
    db.emailVerification.findFirst.mockResolvedValue(
      record({ expiresAt: new Date(Date.now() - 1000) }),
    );

    await expect(check()).resolves.toEqual({ ok: false, reason: "expired" });
    expect(db.emailVerification.updateMany).not.toHaveBeenCalled();
  });

  it("rejects when no code was issued", async () => {
    db.emailVerification.findFirst.mockResolvedValue(null);
    await expect(check()).resolves.toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects without a lookup when neither email nor user is given", async () => {
    await expect(
      checkCode({ purpose: "SIGNUP", email: "", code: "123456" }),
    ).resolves.toEqual({ ok: false, reason: "invalid" });
    expect(db.emailVerification.findFirst).not.toHaveBeenCalled();
  });
});

describe("password reset tokens", () => {
  const token = "A".repeat(43);

  it.each([undefined, "", "short", "A".repeat(44), "A".repeat(42) + "!"])(
    "ignores a malformed token (%p) without querying",
    async (bad) => {
      await expect(findResetToken(bad)).resolves.toBeNull();
      expect(db.emailVerification.findFirst).not.toHaveBeenCalled();
    },
  );

  it("finds an unexpired token by its hash", async () => {
    db.emailVerification.findFirst.mockResolvedValue({ id: 2, userId: 5 });

    await expect(findResetToken(token)).resolves.toEqual({ id: 2, userId: 5 });
    const { where } = db.emailVerification.findFirst.mock.calls[0][0];
    expect(where.tokenHash).toBe(sha256(token));
    expect(where.purpose).toBe("RESET_PASSWORD");
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
  });

  it("changes the password, deletes the token and logs out all sessions", async () => {
    db.emailVerification.findFirst.mockResolvedValue({ id: 2, userId: 5 });
    db.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(Prisma),
    );
    db.emailVerification.deleteMany.mockResolvedValue({ count: 1 });

    await expect(resetPasswordWithToken(token, "hashed")).resolves.toBe(true);

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { password: "hashed" },
    });
    expect(db.usersession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 5 },
    });
  });

  it("refuses a token that was already used (single use)", async () => {
    db.emailVerification.findFirst.mockResolvedValue({ id: 2, userId: 5 });
    db.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(Prisma),
    );
    db.emailVerification.deleteMany.mockResolvedValue({ count: 0 });

    await expect(resetPasswordWithToken(token, "hashed")).resolves.toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("refuses an unknown or expired token", async () => {
    db.emailVerification.findFirst.mockResolvedValue(null);

    await expect(resetPasswordWithToken(token, "hashed")).resolves.toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
