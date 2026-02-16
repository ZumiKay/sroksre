"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
// Sessiontype is defined in GlobalContext.tsx and needs to stay there
import { Sessiontype } from "@/src/context/GlobalContext";
import Prisma from "./prisma";
import { Usersessiontype } from "../types/user.type";
import { hashToken } from "./userlib";
import { UsersessionSelect } from "@/prisma/generated/prisma/models";

/**
 * Verify if a session exists and is valid in the database
 * Returns true if session is valid, false otherwise
 */
export async function verifySessionInDB(
  session_id: string,
  select?: Partial<UsersessionSelect>,
) {
  try {
    const dbSession = (await Prisma.usersession.findUnique({
      where: { refresh_token_hash: hashToken(session_id) },
      select,
    })) as Usersessiontype;

    // Check if session exists and hasn't expired
    if (dbSession && dbSession.expireAt && dbSession.expireAt <= new Date()) {
      //Session cleanup and ignore if session is not found
      await Prisma.usersession
        .delete({
          where: { sessionid: dbSession.sessionid },
        })
        .catch(() => {});

      return { success: false };
    }

    return { success: true, user: dbSession?.user };
  } catch (error) {
    console.error("Error verifying session in DB:", error);
    return { success: false };
  }
}

/**
 * Get authenticated user from session with DB verification
 * Returns user object or null if not authenticated or session invalid
 * Uses NextAuth's getServerSession for optimal performance and security
 * Verifies session against database on every call for auto-logout capability
 */
export async function getUser(
  selectUser?: Partial<UsersessionSelect>,
): Promise<Usersessiontype | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return null;
    }

    let user = session as unknown as Usersessiontype;

    // Verify session in database
    if (user.sessionid) {
      const isValid = await verifySessionInDB(user.sessionid, selectUser);
      if (!isValid.success) {
        return null;
      }
      user.user = isValid.user as never;
    }

    return user;
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
      },
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
      },
    );

    if (!response.ok) return 0;
    const data = await response.json();
    return data.data?.length || 0;
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return 0;
  }
}
