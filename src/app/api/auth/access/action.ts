"use server";

import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { createUniqueSessionId, hashToken } from "@/src/lib/userlib";

export const RenewAccessToken = async () => {
  const token = await getUser();

  if (!token || !token.sessionid) {
    return { success: false };
  }

  try {
    const refreshTokenHash = hashToken(token.sessionid);
    const isSession = await Prisma.usersession.findUnique({
      where: {
        refresh_token_hash: refreshTokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!isSession || !isSession.user) {
      return { success: false };
    }

    //Verify expiration
    const isExpire = isSession.expireAt.getTime() <= new Date().getTime();

    if (isExpire) return { success: false, isExpired: true };
    //Generate new token
    const newSessionId = await createUniqueSessionId();

    //Update usersession
    await Prisma.usersession.update({
      where: { sessionid: isSession.sessionid },
      data: {
        refresh_token_hash: hashToken(newSessionId),
        lastUsed: new Date(),
      },
    });

    return { success: true, token: newSessionId };
  } catch (error) {
    console.log("Refresh Token", error);
    return { success: false };
  }
};
