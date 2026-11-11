"use server";

import Prisma from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/session";
import { OrderReciptEmail } from "@/src/lib/utilities";
import { revalidatePath } from "next/cache";
import { Allstatus, totalpricetype } from "@/src/types/order.type";
import { escapeHtml, SendOrderEmail } from "@/src/lib/email";
import { renderOrderReceiptHtml } from "../../checkout/orderReceipt";
import { getCheckoutdata } from "../../checkout/fetchaction";
import { Filterdatatype } from "./OrderComponent";
import { OrdersWhereInput } from "@/prisma/generated/prisma/models";

interface Returntype<t = undefined> {
  success: boolean;
  message: string;
  data?: t;
}

const isOrderStatus = (status: unknown): status is Allstatus =>
  typeof status === "string" &&
  (Object.values(Allstatus) as string[]).includes(status);

export const updateOrderStatus = async (
  status: string,
  id: string,
): Promise<Returntype> => {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized" };
  }
  if (!isOrderStatus(status)) {
    return { success: false, message: "Invalid status" };
  }

  try {
    const updatedOrder = await Prisma.orders.updateMany({
      where: { id },
      data: { status },
    });

    if (updatedOrder.count === 0) {
      return { success: false, message: "Order not found" };
    }

    // Send email notification unless the order is being abandoned. The email
    // is rendered here from the database; the browser never supplies HTML.
    if (status !== Allstatus.abandoned) {
      const order = await getCheckoutdata(id);
      if (order?.user?.email) {
        const { html } = await renderOrderReceiptHtml({ ...order, status });
        const subject = `Your order #${id.slice(0, 8).toUpperCase()} has been updated to ${status}`;
        await SendOrderEmail(OrderReciptEmail(html), order.user.email, subject);
      }
    }

    return { success: true, message: "Update Successful" };
  } catch (error) {
    console.log("Failed to update order status:", error);
    return { success: false, message: "Failed to update" };
  }
};

export const updateOrderSettings = async (
  id: string,
  vatPercent: number,
  shippingtype: string,
): Promise<Returntype> => {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const order = await Prisma.orders.findUnique({
      where: { id },
      select: { price: true },
    });

    if (!order) return { success: false, message: "Order not found" };

    const price = order.price as unknown as totalpricetype;
    const shippingAmount =
      (await import("@/src/context/Checkoutcontext")).Shippingservice.find(
        (s) => s.value === shippingtype,
      )?.price ??
      price.shipping ??
      0;

    const vatAmount =
      vatPercent > 0
        ? parseFloat((price.subtotal * (vatPercent / 100)).toFixed(2))
        : 0;

    const updatedPrice: totalpricetype = {
      subtotal: price.subtotal,
      shipping: shippingAmount,
      vat: vatAmount,
      total: parseFloat(
        (price.subtotal + shippingAmount + vatAmount).toFixed(2),
      ),
    };

    await Prisma.orders.update({
      where: { id },
      data: { price: updatedPrice as any, shippingtype },
    });

    revalidatePath("/dashboard/order");
    return { success: true, message: "Settings updated" };
  } catch (error) {
    console.log("Update order settings:", error);
    return { success: false, message: "Failed to update" };
  }
};

export const bulkUpdateOrderStatus = async (
  ids: string[],
  status: string,
): Promise<Returntype> => {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized" };
  }
  if (!isOrderStatus(status)) {
    return { success: false, message: "Invalid status" };
  }

  try {
    await Prisma.orders.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    revalidatePath("/dashboard/order");

    // Send email notification to each affected user, except for Abandoned status
    if (status !== Allstatus.abandoned) {
      const orders = await Prisma.orders.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          user: { select: { email: true, firstname: true } },
        },
      });

      await Promise.allSettled(
        orders.map((order) => {
          const shortId = order.id.slice(0, 8).toUpperCase();
          const html = OrderReciptEmail(`
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
              <h2 style="color:#1e293b;font-size:20px;margin-bottom:8px">Order Status Updated</h2>
              <p style="color:#475569;font-size:15px;margin-bottom:24px">
                Hi ${escapeHtml(order.user.firstname ?? "there")},<br/>
                Your order <strong>#${shortId}</strong> has been updated to
                <strong style="color:#4f46e5">${status}</strong>.
              </p>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/checkout?orderid=${order.id}&step=4"
                style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                View Order
              </a>
              <p style="color:#94a3b8;font-size:12px;margin-top:32px">
                If you have any questions, contact us at ${process.env.NEXT_PUBLIC_ADMIN_EMAIL}.
              </p>
            </div>
          `);
          const subject = `Your order #${shortId} has been updated to ${status}`;
          return SendOrderEmail(html, order.user.email, subject);
        }),
      );
    }

    return {
      success: true,
      message: `${ids.length} order(s) updated to ${status}`,
    };
  } catch (error) {
    console.log("bulkUpdateOrderStatus", error);
    return { success: false, message: "Failed to update orders" };
  }
};

export const bulkDeleteOrders = async (ids: string[]): Promise<Returntype> => {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await Prisma.orders.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/dashboard/order");
    return { success: true, message: `${ids.length} order(s) deleted` };
  } catch (error) {
    console.log("bulkDeleteOrders", error);
    return { success: false, message: "Failed to delete orders" };
  }
};

export const deleteOrder = async (id: string): Promise<Returntype> => {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await Prisma.orders.delete({ where: { id } });

    revalidatePath("dashboard/order");
    return { success: true, message: "Delete successfully" };
  } catch (error) {
    console.log("Error Delete Order", error);
    return { success: false, message: "Error occured" };
  }
};

/**
 * Export Order Data Action
 * @param filterdata - UserId must string use buyer_id (auto generated id in user model)
 */
export const ExportOrderData = async (filterdata: Filterdatatype) => {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    // Build where clause for database-level filtering
    const whereClause: OrdersWhereInput = {};

    // Date range filter
    if (filterdata.fromdate || filterdata.todate) {
      whereClause.createdAt = {};
      if (filterdata.fromdate) {
        whereClause.createdAt.gte = new Date(filterdata.fromdate as string);
      }
      if (filterdata.todate) {
        whereClause.createdAt.lte = new Date(filterdata.todate as string);
      }
    }

    // Search filter
    if (filterdata.q) {
      const searchQuery = filterdata.q;
      whereClause.OR = [
        { buyer_id: { equals: searchQuery } },
        { user: { email: { contains: searchQuery, mode: "insensitive" } } },
        { user: { firstname: { contains: searchQuery, mode: "insensitive" } } },
        { user: { lastname: { contains: searchQuery, mode: "insensitive" } } },
      ];

      const userId = searchQuery;
      if (userId) {
        whereClause.OR.push({ buyer_id: userId });
      }
    }

    let orderdata = await Prisma.orders.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        Orderproduct: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discount: true,
              },
            },
          },
        },
        shippingtype: true,
        price: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (filterdata.startprice || filterdata.endprice) {
      const startPrice = filterdata.startprice
        ? parseFloat(filterdata.startprice as string)
        : undefined;
      const endPrice = filterdata.endprice
        ? parseFloat(filterdata.endprice as string)
        : undefined;

      orderdata = orderdata.filter((data) => {
        const price = data.price as unknown as totalpricetype;
        if (startPrice !== undefined && endPrice !== undefined) {
          return price.total >= startPrice && price.total <= endPrice;
        } else if (startPrice !== undefined) {
          return price.total >= startPrice;
        } else if (endPrice !== undefined) {
          return price.total <= endPrice;
        }
        return true;
      });
    }

    //Return
    return { success: true, message: "Export Successfully", data: orderdata };
  } catch (error) {
    console.log("Export Order Error:", error);
    return { success: false, message: "Failed To Export" };
  }
};
