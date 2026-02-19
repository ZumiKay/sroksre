"use server";

import Prisma from "@/src/lib/prisma";
import {
  OrderReciptEmail,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { revalidatePath } from "next/cache";
import { totalpricetype } from "@/src/types/order.type";
import { SendOrderEmail } from "../../checkout/action";
import { Filterdatatype } from "./OrderComponent";
import { getCheckoutdata } from "../../checkout/page";
import { Orderproduct, Orders } from "@/prisma/generated/prisma/client";
import { OrdersWhereInput } from "@/prisma/generated/prisma/models";

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

  // Calculate pagination params first
  const pageNum = page ?? 1;
  const limitNum = limit ?? 10;
  const skip = (pageNum - 1) * limitNum;

  // Execute count and findMany in parallel for better performance
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
  userid?: number;
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

    // Prepare and send the email notification
    const emailTemplate = OrderReciptEmail(email);
    const subject = `Order #${id} receipt has been updated to ${status}`;
    await SendOrderEmail(emailTemplate, updatedOrder.user.email, subject);

    return { success: true, message: "Update Successful" };
  } catch (error) {
    console.log("Failed to update order status:", error);
    return { success: false, message: "Failed to update" };
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
