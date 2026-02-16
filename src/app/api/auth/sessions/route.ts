"use server";

import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { hashToken } from "@/src/lib/userlib";

/**
 * GET - Fetch all active sessions for the current user
 */
export const GET = async () => {
  try {
    const user = await getUser();

    if (!user || !user.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sessions = await Prisma.usersession.findMany({
      where: {
        userId: user.userId,
        expireAt: {
          gt: new Date(),
        },
      },
      select: {
        sessionid: true,
        refresh_token_hash: true,
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
      isCurrent: currentSessionHash === session.refresh_token_hash,
    }));

    return NextResponse.json({
      success: true,
      sessions: sessionsWithCurrent,
    });
  } catch (error) {
    console.log("Fetch sessions error:", error);
    return NextResponse.json({ message: "Error occurred" }, { status: 500 });
  }
};

/**
 * DELETE - Logout specific session or all sessions
 */
export const DELETE = async (req: NextRequest) => {
  try {
    const user = await getUser();

    if (!user || !user.userId || !user.sessionid) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, all } = await req.json();

    // Logout all devices except current
    if (all === true) {
      const currentSessionHash = hashToken(user.sessionid);

      await Prisma.usersession.deleteMany({
        where: {
          userId: user.userId,
          NOT: {
            refresh_token_hash: currentSessionHash,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "All other devices logged out successfully",
      });
    }

    // Logout specific session
    if (sessionId) {
      const session = await Prisma.usersession.findUnique({
        where: { sessionid: sessionId },
        select: { userId: true },
      });

      // Verify the session belongs to the user
      if (!session || session.userId !== user.userId) {
        return NextResponse.json(
          { message: "Session not found" },
          { status: 404 },
        );
      }

      await Prisma.usersession.delete({
        where: { sessionid: sessionId },
      });

      return NextResponse.json({
        success: true,
        message: "Device logged out successfully",
      });
    }

    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.log("Logout session error:", error);
    return NextResponse.json({ message: "Error occurred" }, { status: 500 });
  }
};
