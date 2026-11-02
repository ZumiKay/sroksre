import Prisma from "@/src/lib/prisma";
import { hashToken } from "./userlib";
import { Role } from "@/prisma/generated/prisma/enums";

/**
 * True when `sessionid` belongs to a live, unrevoked session whose user is
 * an ADMIN in the database.
 *
 * The role stored in the login cookie can be up to 7 days old, so admin
 * checks go through here instead: revoking an admin's sessions or changing
 * their role takes effect on their next request.
 */
export async function isActiveAdminSession(
  sessionid: unknown,
): Promise<boolean> {
  if (typeof sessionid !== "string" || !sessionid) return false;

  try {
    const session = await Prisma.usersession.findUnique({
      where: { refresh_token_hash: hashToken(sessionid) },
      select: {
        revoked: true,
        expireAt: true,
        user: { select: { role: true } },
      },
    });

    return (
      !!session &&
      !session.revoked &&
      session.expireAt > new Date() &&
      session.user.role === Role.ADMIN
    );
  } catch (error) {
    console.log("Admin session check failed:", error);
    return false;
  }
}
