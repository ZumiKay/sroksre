import { NextRequest } from "next/server";
import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import {
  checkAccountLockStatus,
  clearLoginAttempts,
  hashToken,
  recordFailedLoginAttempt,
} from "@/src/lib/userlib";
import {
  CHECK_FAILURE_MESSAGE,
  checkCode,
  deleteVerification,
  issueMfaSetupCode,
} from "@/src/lib/emailVerification";
import { sendVerificationCodeEmail } from "@/src/lib/verificationEmail";
import {
  consumeTotpCode,
  enableMfa,
  getMfaStatus,
  isAdminMfaRequired,
  isMfaConfigured,
  MfaConfigError,
  replaceRecoveryCodes,
  startMfaSetup,
} from "@/src/lib/mfa";
import { Role, VerificationPurpose } from "@/prisma/generated/prisma/enums";

/**
 * Two-factor setup for admins (Dashboard → Security).
 *
 * GET  → status
 * POST { action: "send-email-code" }               email a setup code
 * POST { action: "start", emailCode }              check it, return the QR code
 * POST { action: "enable", code }                  confirm the first app code
 * POST { action: "regenerate-recovery-codes", code }
 *
 */

const json = (body: object, status = 200) => Response.json(body, { status });

async function currentAdmin() {
  const session = await getUser({
    user: { select: { id: true, email: true, role: true } },
  });
  const user = session?.user;
  if (!session?.sessionid || !user?.id || user.role !== Role.ADMIN) {
    return null;
  }
  return {
    id: user.id,
    email: user.email as string,
    sessionid: session.sessionid,
  };
}

// Wrong codes on this page share a lockout (5 tries → 15 minutes).
const lockKey = (userId: number) => `mfa-setup:${userId}`;

async function lockedMessage(userId: number) {
  const lock = await checkAccountLockStatus(lockKey(userId));
  return lock.isLocked
    ? `Too many wrong codes. Try again in ${lock.remainingTime} minute(s).`
    : null;
}

export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return json({ message: "Unauthorized" }, 403);

  const [status, session] = await Promise.all([
    getMfaStatus(admin.id),
    Prisma.usersession.findUnique({
      where: { refresh_token_hash: hashToken(admin.sessionid) },
      select: { mfaVerified: true },
    }),
  ]);

  return json({
    ...status,
    required: isAdminMfaRequired(),
    configured: isMfaConfigured(),
    sessionVerified: !!session?.mfaVerified,
  });
}

export async function POST(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return json({ message: "Unauthorized" }, 403);

  const body = await request.json().catch(() => ({}));

  try {
    switch (body?.action) {
      case "send-email-code": {
        if ((await getMfaStatus(admin.id)).enabled) {
          return json({ message: "Two-factor is already on" }, 409);
        }
        if (!isMfaConfigured()) throw new MfaConfigError();

        const issued = await issueMfaSetupCode(admin.id, admin.email);
        if (!issued.ok) {
          return json({ message: "Please wait a minute before requesting another code" }, 429);
        }
        const sent = await sendVerificationCodeEmail(admin.email, issued.secret, "mfa_setup");
        if (!sent.success) {
          await deleteVerification(issued.id);
          return json({ message: "Failed to send email, please try again" }, 502);
        }
        return json({ message: `Code sent to ${admin.email}` });
      }

      case "start": {
        const check = await checkCode({
          purpose: VerificationPurpose.MFA_SETUP,
          userId: admin.id,
          code: body.emailCode,
        });
        if (!check.ok) {
          return json({ message: CHECK_FAILURE_MESSAGE[check.reason] }, 400);
        }
        await deleteVerification(check.id);

        const setup = await startMfaSetup(admin.id, admin.email);
        if (!setup) return json({ message: "Two-factor is already on" }, 409);
        return json(setup);
      }

      case "enable": {
        const locked = await lockedMessage(admin.id);
        if (locked) return json({ message: locked }, 429);

        const recoveryCodes = await enableMfa(admin.id, body.code, hashToken(admin.sessionid));
        if (!recoveryCodes) {
          await recordFailedLoginAttempt(lockKey(admin.id));
          return json({ message: "Incorrect code, please try again" }, 400);
        }
        await clearLoginAttempts(lockKey(admin.id));
        return json({ recoveryCodes });
      }

      case "regenerate-recovery-codes": {
        const locked = await lockedMessage(admin.id);
        if (locked) return json({ message: locked }, 429);

        if (!(await consumeTotpCode(admin.id, body.code))) {
          await recordFailedLoginAttempt(lockKey(admin.id));
          return json({ message: "Incorrect code, please try again" }, 400);
        }
        await clearLoginAttempts(lockKey(admin.id));
        return json({ recoveryCodes: await replaceRecoveryCodes(admin.id) });
      }

      default:
        return json({ message: "Unknown action" }, 400);
    }
  } catch (error) {
    if (error instanceof MfaConfigError) {
      return json({ message: "Two-factor isn't configured on the server yet" }, 500);
    }
    console.log("MFA route error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
}
