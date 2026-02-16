import { NextRequest, NextResponse } from "next/server";
import {
  cleanupExpiredSessions,
  invalidateUserSession,
  invalidateAllUserSessions,
  getUserActiveSessions,
} from "@/src/lib/sessionCleanup";
import { getToken } from "next-auth/jwt";

/**
 * POST /api/session/cleanup - Clean up expired sessions
 * POST /api/session/invalidate - Invalidate a specific session
 * POST /api/session/invalidate-all - Invalidate all sessions for a user
 * GET /api/session/active - Get all active sessions for current user
 */

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json();

    switch (action) {
      case "cleanup":
        // Only admins can cleanup
        if (token.role !== "ADMIN") {
          return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 },
          );
        }
        const count = await cleanupExpiredSessions();
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${count} expired sessions`,
          count,
        });

      case "invalidate":
        // Users can only invalidate their own sessions
        const sessionId = body.session_id;
        if (!sessionId) {
          return NextResponse.json(
            { success: false, message: "session_id required" },
            { status: 400 },
          );
        }

        // Verify session belongs to user (unless admin)
        if (token.role !== "ADMIN" && token.session_id !== sessionId) {
          return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 },
          );
        }

        const result = await invalidateUserSession(sessionId);
        return NextResponse.json({
          success: result,
          message: result
            ? "Session invalidated"
            : "Failed to invalidate session",
        });

      case "invalidate-all":
        // Users can invalidate all their own sessions, admins can specify user_id
        const userId =
          token.role === "ADMIN" && body.user_id
            ? body.user_id
            : (token.id as number);

        const invalidatedCount = await invalidateAllUserSessions(userId);
        return NextResponse.json({
          success: true,
          message: `Invalidated ${invalidatedCount} sessions`,
          count: invalidatedCount,
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.log("Session management error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = token.id as number;
    const sessions = await getUserActiveSessions(userId);

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        session_id: s.sessionid,
        createdAt: s.createdAt,
        expireAt: s.expireAt,
        isCurrent: s.sessionid === token.session_id,
      })),
    });
  } catch (error) {
    console.log("Error fetching sessions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
