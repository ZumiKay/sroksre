import bcryptjs from "bcryptjs";
import Prisma from "./prisma";
import { consumeTotpCode } from "./mfa";
import {
  checkAccountLockStatus,
  clearLoginAttempts,
  recordFailedLoginAttempt,
} from "./userlib";
import {
  CHECK_FAILURE_MESSAGE,
  checkCode,
  deleteVerification,
} from "./emailVerification";
import { VerificationPurpose } from "@/prisma/generated/prisma/enums";

/**
 * Re-checks who is at the keyboard before a destructive action, so an open
 * session alone isn't enough.
 *
 * - "delete_account" (deleting your own account): your password, or an
 *   emailed code for Google/Discord accounts, which never chose a password.
 *   Plus a current authenticator code if 2FA is on.
 * - "delete_users" (admin deleting customers): a current authenticator code,
 *   or the password if the admin hasn't set up 2FA.
 *
 * Wrong answers share one lockout per user: 5 tries, then 15 minutes.
 */
export type ConfirmAction = "delete_account" | "delete_users";

export interface ConfirmRequirements {
  password: boolean;
  emailCode: boolean;
  totp: boolean;
}

export interface ConfirmInput {
  password?: unknown;
  emailCode?: unknown;
  code?: unknown;
}

export type ConfirmResult =
  | { ok: true }
  | { ok: false; status: 400 | 404 | 429; message: string };

type ConfirmUser = {
  oauthId: string | null;
  totpEnabledAt: Date | null;
};

export function requirementsFor(
  user: ConfirmUser,
  action: ConfirmAction,
): ConfirmRequirements {
  const totp = !!user.totpEnabledAt;
  if (action === "delete_users") {
    return { password: !totp, emailCode: false, totp };
  }
  // Accounts created through Google/Discord have a random password.
  const isOAuth = !!user.oauthId;
  return { password: !isOAuth, emailCode: isOAuth, totp };
}

export async function getConfirmRequirements(
  userId: number,
  action: ConfirmAction,
): Promise<ConfirmRequirements | null> {
  const user = await Prisma.user.findUnique({
    where: { id: userId },
    select: { oauthId: true, totpEnabledAt: true },
  });
  return user ? requirementsFor(user, action) : null;
}

const lockKey = (userId: number) => `confirm-identity:${userId}`;
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function confirmIdentity(
  userId: number,
  action: ConfirmAction,
  input: ConfirmInput,
): Promise<ConfirmResult> {
  const lock = await checkAccountLockStatus(lockKey(userId));
  if (lock.isLocked) {
    return {
      ok: false,
      status: 429,
      message: `Too many wrong attempts. Try again in ${lock.remainingTime} minute(s).`,
    };
  }

  const user = await Prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, oauthId: true, totpEnabledAt: true },
  });
  if (!user) return { ok: false, status: 404, message: "Account not found" };

  const needs = requirementsFor(user, action);

  const fail = async (message: string): Promise<ConfirmResult> => {
    const attempt = await recordFailedLoginAttempt(lockKey(userId));
    return attempt.isLocked
      ? {
          ok: false,
          status: 429,
          message: `Too many wrong attempts. Try again in ${attempt.remainingTime} minute(s).`,
        }
      : { ok: false, status: 400, message };
  };

  // Check the password and email code before the app code: an app code can
  // only be used once, so don't spend it when something else is wrong.
  if (needs.password) {
    const password = typeof input.password === "string" ? input.password : "";
    if (!password || !(await bcryptjs.compare(password, user.password))) {
      return fail("Incorrect password");
    }
  }

  let emailVerificationId: number | null = null;
  if (needs.emailCode) {
    const check = await checkCode({
      purpose: VerificationPurpose.DELETE_ACCOUNT,
      userId,
      code: str(input.emailCode),
    });
    if (!check.ok) return fail(CHECK_FAILURE_MESSAGE[check.reason]);
    emailVerificationId = check.id;
  }

  if (needs.totp && !(await consumeTotpCode(userId, str(input.code)))) {
    return fail("Incorrect or already used two-factor code");
  }

  if (emailVerificationId) await deleteVerification(emailVerificationId);
  await clearLoginAttempts(lockKey(userId));
  return { ok: true };
}
