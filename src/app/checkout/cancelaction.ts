"use server";
import { ActionReturnType } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { encrypt } from "@/src/lib/utilities";
import { generateSessionId } from "./helper";
import { Allstatus } from "@/src/context/OrderContext";
import { revalidateTag } from "next/cache";
import { getUser } from "../action";

export const RenewSessionId = async (
  orderId: string
): Promise<ActionReturnType<{ sessionId: string }>> => {
  try {
    if (!orderId) {
      return { success: false, error: "Order ID is required" };
    }

    const sessionKey = process.env.SESSION_KEY;
    if (!sessionKey) {
      return { success: false, error: "Session key not configured" };
    }

    const existingOrder = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }

    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

    const newSessionId = generateSessionId(tenMinutesFromNow);

    await Prisma.orders.update({
      where: { id: orderId },
      data: { sessionId: newSessionId },
    });

    return {
      success: true,
      data: {
        sessionId: encrypt(newSessionId, sessionKey),
      },
    };
  } catch (error) {
    console.error("Renew Session Id", error);
    return { success: false, error: "Failed to renew session" };
  }
};

export const CancelOrder = async (oid: string): Promise<ActionReturnType> => {
  try {
    const user = await getUser();
    if (!oid || !user) {
      return { success: false, error: "Invalid Request" };
    }

    // Use transaction for data consistency
    const result = await Prisma.$transaction(async (tx) => {
      const order = await tx.orders.findFirst({
        where: {
          id: oid,
          buyer_id: user.id, // Direct foreign key lookup is more efficient
          sessionId: { not: null },
          status: { not: Allstatus.cancelled }, // Prevent double cancellation
        },
        select: {
          id: true,
          status: true,
          buyer_id: true,
        },
      });

      if (!order) {
        return null;
      }

      await tx.orders.update({
        where: { id: oid },
        data: {
          status: Allstatus.cancelled,
          sessionId: null,
          updatedAt: new Date(), // Track when cancelled
        },
      });

      return order;
    });

    if (!result) {
      return { success: false, error: "Order not found or already cancelled" };
    }

    revalidateTag(`orderlist#${user.id}`);
    return { success: true };
  } catch (error) {
    console.error("Cancel Order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
};
