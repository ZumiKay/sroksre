"use server";

import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { hashToken } from "@/src/lib/userlib";

interface ResponseType {
  success: boolean;
  challenge_ts: number | string | Date;
  hostname: string;
}
export async function VerifyRecapcha(token: string) {
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CAPTCHA_SECRETKEY}&response=${token}`;
  try {
    const request = await fetch(url, {
      method: "POST",
    });
    const responseJson: ResponseType = await request.json();

    if (!request.ok || !responseJson.success) {
      return { success: false };
    }

    return { success: responseJson.success };
  } catch (error) {
    console.log("Verify Recapcha", error);
    return { success: false };
  }
}

export async function CheckAndGetUserInfo({ nodata }: { nodata?: boolean }) {
  try {
    const isSession = await getUser();

    //Early return is the user session not exist
    if (!isSession || !isSession?.sessionid) return { success: true };

    //check session
    const checkSession = await Prisma.usersession.findUnique({
      where: {
        refresh_token_hash: hashToken(isSession.sessionid),
        userId: isSession.userId,
        expireAt: { gt: new Date() },
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

    if (!checkSession)
      return { success: false, message: "Invalid session", isExpire: true };

    return { success: true, data: nodata ? undefined : checkSession.user };
  } catch (error) {
    console.log("Verify Session", error);
    return { success: false, message: "Error Occured" };
  }
}
