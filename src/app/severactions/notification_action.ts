"use server";

import {
  ActionReturnType,
  NotificationType,
} from "@/src/context/GlobalContext";
import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { formatDate } from "../component/EmailTemplate";

export const SaveNotification = async (
  data: NotificationType
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

export const CheckedNotification = async (
  id: number
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
          userid: user.id,
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

export const GetNotification = async (page: number, pageSize: number) => {
  const user = await getUser();

  if (!user) {
    return { success: false };
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const result = await Prisma.notification.findMany({
    where: {
      userid: user?.id,
    },
    select: {
      id: true,
      type: true,
      content: true,
      link: true,
      checked: true,
      createdAt: true,
    },
    skip,
    take,
    orderBy: {
      createdAt: "desc",
    },
  });
  return {
    success: true,
    data: result.map((i) => ({ ...i, createdAt: formatDate(i.createdAt) })),
  };
};

export const DeleteNotification = async (
  id?: number
): Promise<ActionReturnType> => {
  try {
    if (!id) {
      return { success: false, message: "Invalid request" };
    }

    await Prisma.notification.delete({ where: { id } });

    return { success: true, message: "Delete Successfully" };
  } catch (error) {
    console.log("Notify", error);
    return { success: false, message: "Error occured" };
  }
};
