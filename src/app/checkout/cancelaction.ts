"use server";
import { ActionReturnType } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { encrypt } from "@/src/lib/utilities";
import {
  generateSessionId,
  getDateFromSessionId,
  isTimePassedByMinutes,
} from "./helper";
import { Allstatus } from "@/src/context/OrderContext";

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
    if (!oid) {
      return { success: false, error: "Order ID is required" };
    }

    const order = await Prisma.orders.findUnique({
      where: { id: oid },
      select: { sessionId: true },
    });

    if (!order?.sessionId) {
      return { success: false, error: "Order not found or session expired" };
    }

    const sessionDate = getDateFromSessionId(order.sessionId);
    if (!sessionDate) {
      return { success: false, error: "Invalid session" };
    }

    const isSessionExpired = isTimePassedByMinutes(sessionDate.toISOString());
    if (!isSessionExpired) {
      return { success: false };
    }

    await Prisma.orders.update({
      where: { id: oid },
      data: {
        status: Allstatus.cancelled,
        sessionId: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Cancel Order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
};
