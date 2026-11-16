"use server";

import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import { ActionReturnType } from "@/src/types/global.type";

//Checking / Mark Checked notification for authenticated user

export const CheckedNotification = async (
  id: number,
): Promise<ActionReturnType> => {
  const user = await getUser();
  if (!user?.userId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    // Only the owner can mark a notification as read.
    await Prisma.notification.updateMany({
      where: { id, userid: user.userId },
      data: { checked: true },
    });

    return { success: true };
  } catch (error) {
    console.log("Notify", error);
    return { success: false };
  }
};

export const CheckNotification = async () => {
  const user = await getUser();
  if (!user?.userId) {
    return { success: false, message: "Unauthorized" };
  }

  const isNotCheck = await Prisma.notification.findMany({
    where: { userid: user.userId, checked: false },
    select: {
      id: true,
      checked: true,
    },
  });

  return { success: true, isNotCheck };
};
