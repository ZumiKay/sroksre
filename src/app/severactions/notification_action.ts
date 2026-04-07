"use server";

import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import { NotificationType } from "@/src/types/user.type";
import { ActionReturnType } from "@/src/types/global.type";

export const SaveNotification = async (
  data: NotificationType,
): Promise<ActionReturnType> => {
  const user = await Prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!user) {
    return { success: false };
  }

  try {
    await Prisma.notification.create({
      data: {
        type: data.type,
        content: data.content,
        userid: user?.id,
        link: data.link,
      },
    });
    return { success: true };
  } catch (error) {
    console.log("Notify", error);
    return { success: false, message: "Error Occured" };
  }
};

export const SaveUserNotification = async (
  userId: number,
  data: NotificationType,
): Promise<ActionReturnType> => {
  try {
    await Prisma.notification.create({
      data: {
        type: data.type,
        content: data.content,
        userid: userId,
        link: data.link,
      },
    });
    return { success: true };
  } catch (error) {
    console.log("Notify", error);
    return { success: false, message: "Error Occured" };
  }
};

export const CheckedNotification = async (
  id: number,
): Promise<ActionReturnType> => {
  try {
    await Prisma.notification.update({
      where: { id },
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
  if (!user) {
    return { success: false };
  }
  const isNotCheck = await Prisma.notification.findMany({
    where: {
      AND: [
        {
          userid: user.userId,
        },
        {
          checked: false,
        },
      ],
    },
    select: {
      id: true,
      checked: true,
    },
  });

  return { success: true, isNotCheck };
};
