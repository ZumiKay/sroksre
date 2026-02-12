"use server";

import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { hashToken } from "@/src/lib/userlib";

export interface SessionInfo {
  sessionid: string;
  device: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsed: Date | null;
  expireAt: Date;
  isCurrent: boolean;
}

/**
 * Get all active sessions for the current user
 */
export async function getUserSessions(): Promise<{
  success: boolean;
  sessions?: SessionInfo[];
  message?: string;
}> {
  try {
    const user = await getUser();

    if (!user || !user.userId) {
      return { success: false, message: "Unauthorized" };
    }

    const sessions = await Prisma.usersession.findMany({
      where: {
        userId: user.userId,
        revoked: false,
        expireAt: {
          gt: new Date(),
        },
      },
      select: {
        sessionid: true,
        device: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsed: true,
        expireAt: true,
      },
      orderBy: {
        lastUsed: "desc",
      },
    });

    const currentSessionHash = user.sessionid
      ? hashToken(user.sessionid)
      : null;

    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: currentSessionHash === hashToken(session.sessionid),
    }));

    return { success: true, sessions: sessionsWithCurrent };
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return { success: false, message: "Error occurred" };
  }
}

/**
 * Logout a specific device/session
 */
export async function logoutDevice(
  sessionId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await getUser();

    if (!user || !user.userId) {
      return { success: false, message: "Unauthorized" };
    }

    const session = await Prisma.usersession.findUnique({
      where: { sessionid: sessionId },
      select: { userId: true },
    });

    // Verify the session belongs to the user
    if (!session || session.userId !== user.userId) {
      return { success: false, message: "Session not found" };
    }

    await Prisma.usersession.delete({
      where: { sessionid: sessionId },
    });

    return { success: true, message: "Device logged out successfully" };
  } catch (error) {
    console.error("Logout device error:", error);
    return { success: false, message: "Error occurred" };
  }
}

/**
 * Logout all devices except the current one
 */
export async function logoutAllDevices(): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const user = await getUser();

    if (!user || !user.userId || !user.sessionid) {
      return { success: false, message: "Unauthorized" };
    }

    const currentSessionHash = hashToken(user.sessionid);

    const result = await Prisma.usersession.deleteMany({
      where: {
        userId: user.userId,
        NOT: {
          refresh_token_hash: currentSessionHash,
        },
      },
    });

    return {
      success: true,
      message: `Logged out ${result.count} device(s) successfully`,
    };
  } catch (error) {
    console.error("Logout all devices error:", error);
    return { success: false, message: "Error occurred" };
  }
}
