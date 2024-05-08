"use server";

import Prisma from "@/src/lib/prisma";
import { AllorderType } from "./page";
import {
  caculateArrayPagination,
  calculatePagination,
  getDiscountedPrice,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { revalidatePath } from "next/cache";
import { totalpricetype } from "@/src/context/OrderContext";
import { OrderReciptEmail, SendOrderEmail } from "../../checkout/action";
import { Filterdatatype } from "./OrderComponent";
import dayjs from "dayjs";

export const GetOrder = async (
  id?: string,
  type?: string,
  page?: number,
  limit?: number,
  userid?: string
) => {
  if (id && type) {
    if (type === AllorderType.orderdetail) {
      const detail = await Prisma.orders.findUnique({
        where: { id },
        select: {
          user: {
            select: {
              id: true,
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
      return detail;
    } else if (type === AllorderType.orderproduct) {
      const orderproducts = await Prisma.orders.findUnique({
        where: { id },
        select: {
          Orderproduct: {
            select: {
              id: true,
              details: true,
              quantity: true,
              product: {
                select: {
                  id: true,
                  covers: true,
                  name: true,
                  price: true,
                  discount: true,
                },
              },
            },
          },
        },
      });
      const modified = orderproducts?.Orderproduct.map((prob) => {
        if (prob.product.discount) {
          return {
            ...prob,
            product: {
              ...prob.product,
              discount: getDiscountedPrice(
                prob.product.discount,
                prob.product.price
              ),
            },
          };
        }
        return prob;
      });
      return modified;
    }
  }

  const total = await Prisma.orders.count({
    where: userid
      ? {
          buyer_id: userid,
        }
      : {},
  });
  //Get all orders
  const { startIndex, endIndex } = calculatePagination(
    total ?? 1,
    limit ?? 1,
    page ?? 1
  );

  const order = await Prisma.orders.findMany({
    where: userid
      ? {
          buyer_id: userid,
        }
      : {},
    select: {
      id: true,
      price: true,
      status: true,
      shippingtype: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { id: "asc" },
    take: endIndex - startIndex + 1,
    skip: startIndex,
  });

  if (order.length === 0) {
    return null;
  }

  return { order, total };
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
  limit = 1,
  userid,
}: filtertype) => {
  try {
    let order = await Prisma.orders.findMany({
      where: userid
        ? {
            buyer_id: userid,
          }
        : {},
      select: {
        id: true,
        price: true,
        status: true,
        user: {
          select: {
            firstname: true,
            lastname: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    order = order.filter((data) => {
      const price = data.price as unknown as totalpricetype;
      const isOrder = data.id === search;
      const isBuyer =
        search &&
        removeSpaceAndToLowerCase(
          data.user.firstname + data.user?.lastname ?? ""
        ).includes(removeSpaceAndToLowerCase(search));
      const isStatus = status?.includes(data.status);
      const isPrice =
        startprice && endprice
          ? price.total >= startprice && price.total <= endprice
          : price.total === startprice || price.total === endprice;

      const isOrderInRange = isInDateRange(data.createdAt, fromdate, todate);

      return isOrder || isBuyer || isStatus || isPrice || isOrderInRange;
    });

    const data = caculateArrayPagination(order, page, limit) as typeof order;

    return {
      success: true,
      data: data.length === 0 ? undefined : data,
      total: order.length,
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
  email: string
): Promise<Returntype> => {
  try {
    const order = await Prisma.orders.findUnique({
      where: { id },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (order) {
      await Prisma.orders.update({
        where: { id },
        data: {
          status: status,
        },
      });

      const emailtempalte = OrderReciptEmail(email);
      const subject = `Order #${id} receipt has update status to ${status}`;
      await SendOrderEmail(emailtempalte, order.user.email, subject);
    } else {
      return { success: false, message: "Order not found" };
    }

    revalidatePath("dashboard/order");
    return { success: true, message: "Update Successfully" };
  } catch (error) {
    console.log("update status", error);

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

const isInDateRange = (
  createdAt: Date,
  fromdate?: string,
  todate?: string
): boolean => {
  if (fromdate && todate) {
    return (
      (dayjs(createdAt).isAfter(dayjs(fromdate)) &&
        dayjs(createdAt).isBefore(dayjs(todate))) ||
      dayjs(createdAt).isSame(dayjs(fromdate)) ||
      dayjs(createdAt).isSame(dayjs(todate))
    );
  } else if (fromdate) {
    // Only fromdate is provided, check if createdAt is after or on the fromdate
    return (
      dayjs(createdAt).isAfter(dayjs(fromdate)) ||
      dayjs(createdAt).isSame(dayjs(fromdate))
    );
  } else if (todate) {
    return (
      dayjs(createdAt).isBefore(dayjs(todate)) ||
      dayjs(createdAt).isSame(dayjs(todate))
    );
  }

  return false;
};

export const ExportOrderData = async (filterdata: Filterdatatype) => {
  try {
    let orderdata = await Prisma.orders.findMany({
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
    });

    //filter order data
    orderdata = orderdata.filter((data) => {
      const price = data.price as unknown as totalpricetype;

      const isOrder = data.id === filterdata.q;

      const isBuyer =
        (filterdata.q &&
          removeSpaceAndToLowerCase(
            data.user.firstname + (data.user.lastname ?? "")
          ).includes(removeSpaceAndToLowerCase(filterdata.q))) ||
        data.user.id === filterdata.q;

      const isPrice =
        filterdata.startprice && filterdata.endprice
          ? price.total >= parseFloat(filterdata.startprice as string) &&
            price.total <= parseFloat(filterdata.endprice as string)
          : price.total === parseFloat(filterdata.startprice as string) ||
            price.total === parseFloat(filterdata.endprice as string);

      return (
        isOrder ||
        isBuyer ||
        isPrice ||
        isInDateRange(
          data.createdAt,
          filterdata.fromdate as string,
          filterdata.todate as string
        )
      );
    });

    return { success: true, message: "Export Successfully", data: orderdata };
  } catch (error) {
    return { success: false, message: "Failed To Export" };
  }
};
