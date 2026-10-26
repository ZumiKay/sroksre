"use server";

import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { hashToken } from "@/src/lib/userlib";

export async function CheckAndGetUserInfo({ nodata }: { nodata?: boolean }) {
  try {
    const isSession = await getUser();

    //Early return is the user session not exist
    if (!isSession || !isSession?.sessionid) return { success: true };

    //check session
    const checkSession = await Prisma.usersession.findUnique({
      where: {
        refresh_token_hash: hashToken(isSession.sessionid),
      },
      select: {
        expireAt: true,
        user: {
          select: {
            email: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    if (!checkSession) return { success: false, message: "Invalid session" };

    return { success: true, data: nodata ? undefined : checkSession.user };
  } catch (error) {
    console.log("Verify Session", error);
    return { success: false, message: "Error Occured" };
  }
}
