"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { Sessiontype } from "@/src/context/GlobalContext";
import Prisma from "./prisma";

/**
 * Optimized session and data fetching for Next.js 14
 *
 * Benefits:
 * - Server-side rendering for better performance
 * - Parallel data fetching reduces load time
 * - No client-side waterfalls
 * - Automatic revalidation with Next.js cache
 * - Database session verification for auto-logout
 */

/**
 * Verify if a session exists and is valid in the database
 * Returns true if session is valid, false otherwise
 */
export async function verifySessionInDB(session_id: string): Promise<boolean> {
  try {
    const dbSession = await Prisma.usersession.findUnique({
      where: { session_id },
    });

    // Check if session exists and hasn't expired
    if (!dbSession || dbSession.expireAt < new Date()) {
      // Clean up expired session if it exists
      if (dbSession) {
        await Prisma.usersession
          .delete({
            where: { session_id },
          })
          .catch(() => {}); // Ignore errors on cleanup
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying session in DB:", error);
    return false;
  }
}

/**
 * Get authenticated user from session with DB verification
 * Returns user object or null if not authenticated or session invalid
 * Uses NextAuth's getServerSession for optimal performance and security
 * Verifies session against database on every call for auto-logout capability
 */
export async function getUser(): Promise<Sessiontype | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return null;
    }

    const user = session.user as any;

    // Verify session in database
    if (user.session_id) {
      const isValid = await verifySessionInDB(user.session_id);
      if (!isValid) {
        console.log(
          "Session invalid in DB, auto-logging out user:",
          user.email
        );
        return null;
      }
    }

    return user as Sessiontype;
  } catch (error) {
    console.error("Error fetching user session:", error);
    return null;
  }
}

export async function getSessionData() {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Fetch cart count server-side
 * Used for initial render to avoid loading states
 */
export async function getCartCount() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return 0;

    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/order/cart?count=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Disable cache for real-time data
        next: { revalidate: 0 }, // Alternative: set revalidation time
      }
    );

    if (!response.ok) return 0;
    const data = await response.json();
    return data.data || 0;
  } catch (error) {
    console.error("Failed to fetch cart count:", error);
    return 0;
  }
}

/**
 * Fetch notification count server-side for admins
 * Used for initial render to avoid loading states
 */
export async function getNotificationCount() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session || session.user?.role !== "ADMIN") return 0;

    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/users/notification?ty=check`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) return 0;
    const data = await response.json();
    return data.data?.length || 0;
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return 0;
  }
}
