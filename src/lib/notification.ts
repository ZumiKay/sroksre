import Prisma from "@/src/lib/prisma";
import { NotificationType } from "@/src/types/user.type";
import { ActionReturnType } from "@/src/types/global.type";
import { Allstatus } from "@/src/types/order.type";

/**
 * Server-only notification writers.
 *
 * These are deliberately NOT Server Actions (no "use server"): they are called
 * by trusted server code such as payment confirmation, on behalf of customers
 * who are not admins. Keeping them out of a "use server" file means the
 * browser cannot invoke them with arbitrary content or links.
 */

/** Notify the store admin. */
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
        userid: user.id,
        link: data.link,
      },
    });
    return { success: true };
  } catch (error) {
    console.log("Notify", error);
    return { success: false, message: "Error Occured" };
  }
};

/** Notify a specific user. */
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

/** Title shown for customer order notifications. */
export const ORDER_NOTIFICATION_TYPE = "Order update";

/** Where a customer lands when opening an order notification ("My Orders"). */
export const orderNotificationLink = (orderId: string) =>
  `/dashboard/order?q=${encodeURIComponent(orderId)}`;

const ORDER_STATUS_MESSAGE: Partial<Record<Allstatus, string>> = {
  [Allstatus.paid]: "has been confirmed and is being processed",
  [Allstatus.prepareing]: "is being prepared",
  [Allstatus.shipped]: "has been shipped",
  [Allstatus.arrived]: "has arrived",
};

export const orderStatusMessage = (orderId: string, status: string) => {
  const tail =
    ORDER_STATUS_MESSAGE[status as Allstatus] ?? `is now ${status}`;
  return `Your order #${orderId} ${tail}`;
};

/**
 * Tell each order's owner that its status changed. This is the only source of
 * customer notifications. Abandoned orders are skipped, like the status email.
 * Never throws: a failed notification must not fail the status update.
 */
export const notifyOrderStatus = async (
  orderIds: string[],
  status: string,
): Promise<void> => {
  if (orderIds.length === 0 || status === Allstatus.abandoned) return;

  try {
    const orders = await Prisma.orders.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, user: { select: { id: true } } },
    });
    if (!orders?.length) return;

    await Prisma.notification.createMany({
      data: orders.map((order) => ({
        type: ORDER_NOTIFICATION_TYPE,
        content: orderStatusMessage(order.id, status),
        link: orderNotificationLink(order.id),
        userid: order.user.id,
      })),
    });
  } catch (error) {
    console.log("notifyOrderStatus", error);
  }
};
