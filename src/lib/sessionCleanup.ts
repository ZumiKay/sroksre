"use server";

import Prisma from "./prisma";

/**
 * Clean up all expired sessions from the database
 * This should be run periodically (e.g., via cron job or scheduled task)
 * Returns the count of deleted sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await Prisma.usersession.deleteMany({
      where: {
        expireAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.log("Error cleaning up expired sessions:", error);
    return 0;
  }
}

/**
 * Invalidate a specific user's session (force logout)
 * Useful for admin actions or security purposes
 */
export async function invalidateUserSession(
  session_id: string,
): Promise<boolean> {
  try {
    await Prisma.usersession.delete({
      where: { sessionid: session_id },
    });
    console.log(`Session ${session_id} invalidated`);
    return true;
  } catch (error) {
    console.log("Error invalidating session:", error);
    return false;
  }
}

/**
 * Invalidate all sessions for a specific user (force logout from all devices)
 * Useful for security purposes (e.g., password reset, account compromise)
 */
export async function invalidateAllUserSessions(
  user_id: number,
): Promise<number> {
  try {
    const result = await Prisma.usersession.deleteMany({
      where: { userId: user_id },
    });
    console.log(`Invalidated ${result.count} sessions for user ${user_id}`);
    return result.count;
  } catch (error) {
    console.log("Error invalidating all user sessions:", error);
    return 0;
  }
}

/**
 * Get all active sessions for a user
 * Useful for showing user where they're logged in
 */
export async function getUserActiveSessions(user_id: number) {
  try {
    const sessions = await Prisma.usersession.findMany({
      where: {
        userId: user_id,
        expireAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return sessions;
  } catch (error) {
    console.log("Error fetching user sessions:", error);
    return [];
  }
}
