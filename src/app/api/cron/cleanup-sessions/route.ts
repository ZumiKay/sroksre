import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredSessions } from "@/src/lib/sessionCleanup";

/**
 * Cron job endpoint to clean up expired sessions
 * Configure your hosting platform (Vercel, etc.) to hit this endpoint periodically
 *
 * Example Vercel cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-sessions",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 *
 * This runs daily at midnight
 *
 * For security, verify the request comes from your cron service
 */

export async function GET(req: NextRequest) {
  try {
    // Verify the request is authorized (check cron secret or similar)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Clean up expired sessions
    const count = await cleanupExpiredSessions();

    console.log(
      `[CRON] Cleaned up ${count} expired sessions at ${new Date().toISOString()}`,
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${count} expired sessions`,
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.log("[CRON] Error cleaning up sessions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
