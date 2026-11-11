// Server-only order reads. Deliberately NOT "use server": these do no auth
// check of their own (the order page decides who may see what), so they must
// not be callable from the browser.

import Prisma from "@/src/lib/prisma";
import { Allstatus, totalpricetype } from "@/src/types/order.type";
import { Orderproduct, Orders } from "@/prisma/generated/prisma/client";
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

    // Price lives in JSON and is filtered after paging, so with a price filter
    // only this page's count is known; otherwise use the database total.
    const hasPriceFilter = !!startprice || !!endprice;

    return {
      success: true,
      data: filteredOrders.length === 0 ? undefined : filteredOrders,
      total: hasPriceFilter ? filteredOrders.length : total,
    };
  } catch (error) {
    console.log("Filter order", error);
    return { success: false };
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
