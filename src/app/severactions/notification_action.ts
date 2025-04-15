import Prisma from "@/src/lib/prisma";
import { NotificationType } from "@/src/context/GlobalType.type";
import { getUser } from "../action";

export const SaveNotification = async (data: NotificationType) => {
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

export const CheckedNotification = async (id: number) => {
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
