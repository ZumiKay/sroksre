import Prisma from "@/src/lib/prisma";
import { hashToken } from "./userlib";
import { Role } from "@/prisma/generated/prisma/enums";
import { isAdminMfaRequired } from "./mfa";

/**
 * - "ok": live admin session (and it passed 2FA, when ADMIN_MFA_REQUIRED=true)
 * - "mfa_required": live admin session that hasn't passed 2FA yet
 * - "denied": no session, revoked, expired, or not an admin
 */
export type AdminSessionStatus = "ok" | "mfa_required" | "denied";

/**
 * Looks up the session in the database instead of trusting the login cookie.
 * The role inside the cookie can be up to 7 days old, so revoking an admin's
 * sessions or changing their role takes effect on their next request.
 */
export async function getAdminSessionStatus(
  sessionid: unknown,
): Promise<AdminSessionStatus> {
  if (typeof sessionid !== "string" || !sessionid) return "denied";

  try {
    const session = await Prisma.usersession.findUnique({
      where: { refresh_token_hash: hashToken(sessionid) },
      select: {
        revoked: true,
        expireAt: true,
        mfaVerified: true,
        user: { select: { role: true } },
      },
    });

    if (
      !session ||
      session.revoked ||
      session.expireAt <= new Date() ||
      session.user.role !== Role.ADMIN
    ) {
      return "denied";
    }

    if (isAdminMfaRequired() && !session.mfaVerified) return "mfa_required";
    return "ok";
  } catch (error) {
    console.log("Admin session check failed:", error);
    return "denied";
  }
}

/** True when the session may use admin pages and APIs right now. */
export async function isActiveAdminSession(
  sessionid: unknown,
): Promise<boolean> {
  return (await getAdminSessionStatus(sessionid)) === "ok";
}

/**
 * Which orders the current login may see on /dashboard/order.
 * - "all": admin session that passes getAdminSessionStatus
 * - "own": customer, limited to their own orders
 * - "setup_mfa": admin login that still has to pass 2FA
 * - "denied": anything else
 */
export type OrderPageAccess =
  | { view: "all" }
  | { view: "own"; buyerId: string }
  | { view: "setup_mfa" }
  | { view: "denied" };

export async function getOrderPageAccess(
  user: { role?: string | null; buyer_id?: string | null } | undefined,
  sessionid: unknown,
): Promise<OrderPageAccess> {
  if (user?.role === Role.ADMIN) {
    const status = await getAdminSessionStatus(sessionid);
    if (status === "ok") return { view: "all" };
    if (status === "mfa_required") return { view: "setup_mfa" };
    return { view: "denied" };
  }
  if (user?.role === Role.USER && user.buyer_id) {
    return { view: "own", buyerId: user.buyer_id };
  }
  return { view: "denied" };
}
