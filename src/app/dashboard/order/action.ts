"use server";

import { Allstatus, Ordertype } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { z } from "zod";
import { SendOrderEmail } from "../../checkout/action";
import { OrderReciptEmail } from "@/src/lib/utilities";
import { getUser } from "../../action";
import { revalidateTag } from "next/cache";

type UpdateOrderData = {
  orderId: string;
  order?: Ordertype;
  emailTemplate?: string;
};

const SanitizeUpdateStatus = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  emailTemplate: z.string().min(1, "Email template is required").optional(),
  order: z.object({
    status: z.nativeEnum(Allstatus),
  }),
});

export const UpdateOrderStatus = async ({
  orderId,
  order,
  emailTemplate,
}: UpdateOrderData) => {
  try {
    const isUser = await getUser();
    if (!isUser || isUser?.role !== "ADMIN") {
      return { success: false, error: "User not authenticated" };
    }

    const parsedData = SanitizeUpdateStatus.parse({
      orderId,
      order,
      emailTemplate,
    });

    const isOrder = await Prisma.orders.findUnique({
      where: { id: parsedData.orderId },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!isOrder) {
      return { success: false, error: "Order not found" };
    }

    await Prisma.orders.update({
      where: { id: orderId },
      data: { status: parsedData.order.status },
    });

    if (parsedData.emailTemplate) {
      const subject = `Order #${order?.id} Status Updated: ${parsedData.order.status}`;

      await SendOrderEmail(
        OrderReciptEmail(parsedData.emailTemplate),
        isOrder.user.email,
        subject
      );
    }

    // Send email using emailTemplate
    revalidateTag("orderlist#" + isUser.id);
    return { success: true, message: "Order Updated" };
  } catch (error) {
    console.log("Error updating order status:", error);
    if (error instanceof z.ZodError) {
      console.error("Invalid status:", error.errors);
      return { success: false, error: "Invalid Param" };
    }
    return { success: false, error: "Failed to update order status" };
  }
};

export const UserCancelOrder = async (orderId: string) => {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }
    await Prisma.orders.updateMany({
      where: {
        AND: [
          {
            id: orderId,
          },
          {
            OR: [{ status: Allstatus.incart }, { status: Allstatus.unpaid }],
          },
        ],
      },
      data: {
        status: Allstatus.cancelled,
      },
    });
    revalidateTag("orderlist#" + user.id);
    return { success: true, message: "Order cancelled successfully" };
  } catch (error) {
    console.log("Error cancelling order:", error);
    return { success: false, error: "Failed to cancel order" };
  }
};
