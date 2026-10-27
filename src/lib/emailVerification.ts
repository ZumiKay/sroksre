import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import Prisma from "./prisma";
import { VerificationPurpose } from "@/prisma/generated/prisma/enums";

/**
 * Email verification codes and password reset tokens.
 *
 * - Codes are 6 digits, tokens are 32 random bytes; only a SHA-256 hash is stored.
 * - Codes allow MAX_ATTEMPTS checks, then a new code must be requested.
 * - A new code/token can be issued once per RESEND_COOLDOWN_MS per scope.
 */
export const VERIFICATION_CONFIG = {
  CODE_TTL_MS: 10 * 60 * 1000,
  RESET_TTL_MS: 30 * 60 * 1000,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_MS: 60 * 1000,
} as const;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const hashesMatch = (a: string, b: string) => {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
};

const newCode = () => randomInt(0, 1_000_000).toString().padStart(6, "0");

const scopeOf = (purpose: VerificationPurpose, email: string, userId: number | null) =>
  userId ? { purpose, userId } : { purpose, email };

export type IssueResult =
  | { ok: true; id: number; secret: string }
  | { ok: false; reason: "cooldown" };

async function issue(
  purpose: VerificationPurpose,
  email: string,
  userId: number | null,
  secret: string,
  ttlMs: number,
): Promise<IssueResult> {
  const now = Date.now();
  const scope = scopeOf(purpose, email, userId);

  const recent = await Prisma.emailVerification.findFirst({
    where: {
      ...scope,
      createdAt: { gt: new Date(now - VERIFICATION_CONFIG.RESEND_COOLDOWN_MS) },
    },
    select: { id: true },
  });
  if (recent) return { ok: false, reason: "cooldown" };

  const [, created] = await Prisma.$transaction([
    Prisma.emailVerification.deleteMany({
      where: { OR: [scope, { expiresAt: { lt: new Date(now) } }] },
    }),
    Prisma.emailVerification.create({
      data: {
        purpose,
        email,
        userId,
        tokenHash: sha256(secret),
        expiresAt: new Date(now + ttlMs),
      },
      select: { id: true },
    }),
  ]);

  return { ok: true, id: created.id, secret };
}

export const issueSignupCode = (email: string) =>
  issue(VerificationPurpose.SIGNUP, email, null, newCode(), VERIFICATION_CONFIG.CODE_TTL_MS);

export const issueChangeEmailCode = (userId: number, newEmail: string) =>
  issue(
    VerificationPurpose.CHANGE_EMAIL,
    newEmail,
    userId,
    newCode(),
    VERIFICATION_CONFIG.CODE_TTL_MS,
  );

export const issueResetToken = (userId: number, email: string) =>
  issue(
    VerificationPurpose.RESET_PASSWORD,
    email,
    userId,
    randomBytes(32).toString("base64url"),
    VERIFICATION_CONFIG.RESET_TTL_MS,
  );

export type CheckFailure = "invalid" | "expired" | "too_many_attempts";
export type CheckResult =
  | { ok: true; id: number; email: string; userId: number | null }
  | { ok: false; reason: CheckFailure };

export const CHECK_FAILURE_MESSAGE: Record<CheckFailure, string> = {
  invalid: "Incorrect code",
  expired: "Code expired, please request a new one",
  too_many_attempts: "Too many attempts, please request a new code",
};

/**
 * Check a 6-digit code without consuming it. Every check counts toward
 * MAX_ATTEMPTS. Pass `email` for sign-up, `userId` for change email.
 */
export async function checkCode({
  purpose,
  code,
  email,
  userId,
}: {
  purpose: VerificationPurpose;
  code: unknown;
  email?: string;
  userId?: number;
}): Promise<CheckResult> {
  if (!userId && !email) return { ok: false, reason: "invalid" };

  const record = await Prisma.emailVerification.findFirst({
    where: userId ? { purpose, userId } : { purpose, email },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, reason: "invalid" };
  if (record.expiresAt <= new Date()) return { ok: false, reason: "expired" };

  // Claim an attempt atomically so parallel guesses can't exceed the limit.
  const claimed = await Prisma.emailVerification.updateMany({
    where: { id: record.id, attempts: { lt: VERIFICATION_CONFIG.MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return { ok: false, reason: "too_many_attempts" };

  const valid =
    typeof code === "string" && /^\d{6}$/.test(code) && hashesMatch(sha256(code), record.tokenHash);
  if (!valid) return { ok: false, reason: "invalid" };

  return {
    ok: true,
    id: record.id,
    email: record.email,
    userId: record.userId,
  };
}

export const deleteVerification = (id: number) =>
  Prisma.emailVerification.deleteMany({ where: { id } });

const isResetTokenFormat = (token: unknown): token is string =>
  typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);

/** Look up an unexpired password reset token. */
export async function findResetToken(token: unknown) {
  if (!isResetTokenFormat(token)) return null;

  const record = await Prisma.emailVerification.findFirst({
    where: {
      purpose: VerificationPurpose.RESET_PASSWORD,
      tokenHash: sha256(token),
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });
  return record?.userId ? { id: record.id, userId: record.userId } : null;
}

/**
 * Use a reset token: set the new password hash, delete the token and log
 * the user out everywhere, all in one transaction. Returns false if the
 * token is invalid, expired or was already used.
 */
export async function resetPasswordWithToken(
  token: unknown,
  passwordHash: string,
): Promise<boolean> {
  const record = await findResetToken(token);
  if (!record) return false;

  return Prisma.$transaction(async (tx) => {
    const used = await tx.emailVerification.deleteMany({
      where: { id: record.id },
    });
    if (used.count !== 1) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { password: passwordHash },
    });
    await tx.usersession.deleteMany({ where: { userId: record.userId } });
    await tx.emailVerification.deleteMany({
      where: {
        userId: record.userId,
        purpose: VerificationPurpose.RESET_PASSWORD,
      },
    });
    return true;
  });
}
