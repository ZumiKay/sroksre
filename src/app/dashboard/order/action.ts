"use server";

import Prisma from "@/src/lib/prisma";
import {
  OrderReciptEmail,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { revalidatePath } from "next/cache";
import { Allstatus, totalpricetype } from "@/src/types/order.type";
import { SendOrderEmail } from "../../checkout/action";
import { Filterdatatype } from "./OrderComponent";
import { Orderproduct, Orders } from "@/prisma/generated/prisma/client";
import { OrdersWhereInput } from "@/prisma/generated/prisma/models";
import { getCheckoutdata } from "../../checkout/fetchaction";

const AllorderType = {
  orderdetail: "orderdetail",
  orderproduct: "orderproduct",
  orderaction: "orderaction",
  orderupdatestatus: "orderupdatestatus",
};

/**Get Order Data As Admin and Normal User (Only self order)
 * @params id , type , page , limit , userid (buyer_id)
 * @returns order data with total count
 */

export const GetOrder = async (
  id?: string,
  type?: string,
  page?: number,
  limit?: number,
  userid?: string,
): Promise<{ data: Orders | Array<Orderproduct>; total?: number } | null> => {
  if (id && type) {
    if (type === AllorderType.orderdetail) {
      const detail = await Prisma.orders.findUnique({
        where: { id },
        select: {
          user: {
            select: {
              id: true,
              buyer_id: true,
              firstname: true,
              lastname: true,
              email: true,
              phonenumber: true,
            },
          },
          shipping: true,
          shippingtype: true,
          price: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!detail) {
        return null;
      }
      return { data: detail as unknown as Orders };
    } else if (type === AllorderType.orderproduct) {
      const orderproduct = await getCheckoutdata(undefined, userid);

      return { data: orderproduct?.Orderproduct as never };
    }
  }

  // Build where clause once
  const whereClause = userid ? { buyer_id: userid } : {};

  const pageNum = page ?? 1;
  const limitNum = limit ?? 10;
  const skip = (pageNum - 1) * limitNum;

  const [total, order] = await Promise.all([
    Prisma.orders.count({ where: whereClause }),
    Prisma.orders.findMany({
      where: whereClause,
      select: {
        id: true,
        price: true,
        status: true,
        shippingtype: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" }, // More common to show recent orders first
      take: limitNum,
      skip: skip,
    }),
  ]);

  if (order.length === 0) {
    return null;
  }

  return { data: order as never, total };
};

interface filtertype {
  page: number;
  limit: number;
  status?: Array<string>;
  search?: string;
  fromdate?: string;
  todate?: string;
  startprice?: number;
  endprice?: number;
  userid?: string;
}

export const getFilterOrder = async ({
  status,
  search,
  fromdate,
  todate,
  startprice,
  endprice,
  page = 1,
  limit = 10,
  userid,
}: filtertype) => {
  try {
    // Build where clause with database-level filtering
    const whereClause: any = {};

    if (userid) {
      whereClause.buyer_id = userid;
    }

    // Status filter
    if (status && status.length > 0) {
      whereClause.status = { in: status };
    }

    // Date range filter
    if (fromdate || todate) {
      whereClause.createdAt = {};
      if (fromdate) {
        whereClause.createdAt.gte = new Date(fromdate);
      }
      if (todate) {
        whereClause.createdAt.lte = new Date(todate);
      }
    }

    // Search filter (ID or user details)
    if (search) {
      const searchLower = removeSpaceAndToLowerCase(search);
      whereClause.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstname: { contains: search, mode: "insensitive" } } },
        { user: { lastname: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (page - 1) * limit;

    // Execute count and query in parallel
    const [total, orders] = await Promise.all([
      Prisma.orders.count({ where: whereClause }),
      Prisma.orders.findMany({
        where: whereClause,
        select: {
          id: true,
          price: true,
          status: true,
          shippingtype: true,
          user: {
            select: {
              firstname: true,
              lastname: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Post-process for price filtering (if needed, as JSON filtering is limited in Prisma)
    let filteredOrders = orders;
    if (startprice !== undefined || endprice !== undefined) {
      filteredOrders = orders.filter((data) => {
        const price = data.price as unknown as totalpricetype;
        if (startprice && endprice) {
          return price.total >= startprice && price.total <= endprice;
        } else if (startprice) {
          return price.total >= startprice;
        } else if (endprice) {
          return price.total <= endprice;
        }
        return true;
      });
    }

    return {
      success: true,
      data: filteredOrders.length === 0 ? undefined : filteredOrders,
      total: filteredOrders.length, // Use filtered count if price filter applied
    };
  } catch (error) {
    console.log("Filter order", error);
    return { success: false };
  }
};

interface Returntype<t = undefined> {
  success: boolean;
  message: string;
  data?: t;
}

export const updateOrderStatus = async (
  status: string,
  id: string,
  email: string,
): Promise<Returntype> => {
  try {
    // Combine finding and updating the order in one step
    const updatedOrder = await Prisma.orders.update({
      where: { id },
      data: { status },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!updatedOrder) {
      return { success: false, message: "Order not found" };
    }

    // Send email notification unless the order is being abandoned
    if (status !== Allstatus.abandoned) {
      const emailTemplate = OrderReciptEmail(email);
      const subject = `Your order #${id.slice(0, 8).toUpperCase()} has been updated to ${status}`;
      await SendOrderEmail(emailTemplate, updatedOrder.user.email, subject);
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

/**
 * Purge all expired cart items and unpaid orders older than 24 hours.
 *
 * Three things happen in one pass:
 *  1. Standalone cart items (orderId = null, status = Incart) older than 24 h
 *     are marked abandoned — the user's cart entry has expired.
 *  2. Unpaid orders older than 24 h are marked abandoned.
 *  3. Orderproducts that belong to those expired orders are marked abandoned.
 *
 * Nothing is deleted; all records are preserved for history.
 */
export const purgeExpiredUnpaidOrders = async (): Promise<void> => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find the specific orders that are expiring so we can scope the
    // orderproduct update to only their rows.
    const expiredOrders = await Prisma.orders.findMany({
      where: {
        status: Allstatus.unpaid,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    });

    const expiredOrderIds = expiredOrders.map((o) => o.id);

    await Promise.all([
      // 1. Expire standalone cart items (not yet in any checkout session)
      Prisma.orderproduct.updateMany({
        where: {
          orderId: null,
          status: Allstatus.incart,
          createdAt: { lt: cutoff },
        },
        data: { status: Allstatus.abandoned },
      }),

      // 2. Expire the unpaid orders themselves
      ...(expiredOrderIds.length > 0
        ? [
            Prisma.orders.updateMany({
              where: { id: { in: expiredOrderIds } },
              data: { status: Allstatus.abandoned },
            }),
            // 3. Expire orderproducts belonging to those orders
            Prisma.orderproduct.updateMany({
              where: {
                orderId: { in: expiredOrderIds },
                status: { in: [Allstatus.incart, Allstatus.unpaid] },
              },
              data: { status: Allstatus.abandoned },
            }),
          ]
        : []),
    ]);
  } catch (error) {
    console.log("purgeExpiredUnpaidOrders error:", error);
  }
};

export const bulkUpdateOrderStatus = async (
  ids: string[],
  status: string,
): Promise<Returntype> => {
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
                Hi ${order.user.firstname ?? "there"},<br/>
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

    return { success: true, message: `${ids.length} order(s) updated to ${status}` };
  } catch (error) {
    console.log("bulkUpdateOrderStatus", error);
    return { success: false, message: "Failed to update orders" };
  }
};

export const bulkDeleteOrders = async (
  ids: string[],
): Promise<Returntype> => {
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
