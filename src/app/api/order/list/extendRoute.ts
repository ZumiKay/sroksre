import { Filterdatatype } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { IsNumber, isValidDate } from "@/src/lib/utilities";
import { Prisma as PrismaType } from "@prisma/client";

export const GetFilterOrder = async (
  param: Filterdatatype,
  downloaddata?: boolean
) => {
  try {
    const page = param.p && IsNumber(`${param.p}`) ? Number(param.p) : 1;
    const limit = param.lt && IsNumber(`${param.lt}`) ? Number(param.lt) : 5;

    const whereClause: PrismaType.OrdersWhereInput = {};

    if (param.q) {
      whereClause.id = { contains: param.q, mode: "insensitive" };
    }

    if (param.orderdate && isValidDate(param.orderdate)) {
      whereClause.orderDate = new Date(`${param.orderdate}`);
    }

    if (
      param.startprice &&
      param.endprice &&
      IsNumber(param.startprice) &&
      IsNumber(param.endprice)
    ) {
      whereClause.price = {
        path: ["total"],
        gte: Number(param.startprice),
        lte: Number(param.endprice),
      };
    }

    if ((param.fromdate || param.todate) && !whereClause.orderDate) {
      whereClause.orderDate = {};

      if (param.todate && isValidDate(param.todate)) {
        whereClause.orderDate.gte = new Date(`${param.todate}`);
      }

      if (param.fromdate && isValidDate(param.fromdate)) {
        whereClause.orderDate.lte = new Date(`${param.fromdate}`);
      }
    }

    const orders = await Prisma.orders.findMany({
      where: whereClause,
      take: limit, // Fixed: should use limit not param.p
      skip: (page - 1) * limit,
      select: {
        id: true,
        orderDate: true,
        user: {
          select: {
            id: true,
            ...(downloaddata && { email: true }),
          },
        },
        ...(downloaddata && {
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
        }),
        status: true,
        price: true,
        _count: {
          select: {
            Orderproduct: true,
          },
        },
      },
    });

    return orders;
  } catch (error) {
    console.log("Get Filter Order", error);
    return null;
  }
};
