import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import {
  Allstatus,
  OrderFilterParam,
  OrderGetReqType,
  Ordertype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType } from "@prisma/client";
import { getUser } from "@/src/app/action";
import { IsNumber } from "@/src/lib/utilities";

interface GetOrderParam extends OrderFilterParam<number, Date> {
  id?: string;
  ty?: OrderGetReqType;
}

const verifyOrderParam = (url: GetOrderParam): boolean => {
  //Check
  if (!url.ty) {
    return false;
  }

  if (url.startprice || url.endprice || url.p || url.lt) {
    if (
      (url.startprice && isNaN(Number(url.startprice))) ||
      (url.endprice && isNaN(Number(url.endprice))) ||
      !(url.p && IsNumber(url.p.toString())) ||
      !(url.lt && IsNumber(url.lt.toString()))
    ) {
      return false;
    }
  }

  if (
    (url.fromdate && isNaN(new Date(url.fromdate).getTime())) ||
    (url.enddate && isNaN(new Date(url.enddate).getTime()))
  ) {
    return false;
  }

  if (
    url.status &&
    url.status.length > 0 &&
    (typeof url.status !== "string"
      ? !url.status.some((status) => Object.values(Allstatus).includes(status))
      : !Object.values(Allstatus).includes(url.status))
  ) {
    return false;
  }

  return true;
};

export async function GET(req: NextRequest) {
  try {
    // Extract all query parameters at once and destructure
    const url = req.nextUrl;
    const params = extractQueryParams(url.toString()) as GetOrderParam;

    if (!verifyOrderParam(params)) {
      return Response.json(
        { message: "Invalid Query Parameters" },
        { status: 400 }
      );
    }

    //Convert Status to array
    if (params.status) {
      if (typeof params.status === "string") params.status = [params.status];
    }

    const {
      ty,
      q,
      fromdate,
      enddate,
      startprice,
      endprice,
      p = 1,
      lt = 5,
      status,
    } = params;

    let orderData: Array<Ordertype> | Ordertype | null = null;
    let totalCount = 0;
    let totalfilter: number | undefined = undefined;
    const isAdmin = await getUser();

    const whereCondition: PrismaType.OrdersWhereInput = {
      AND: [
        { ...(isAdmin?.role === "ADMIN" ? {} : { buyer_id: isAdmin?.id }) },
        {
          ...(q && {
            OR: [
              { id: { contains: q, mode: "insensitive" } },
              {
                user: {
                  OR: [
                    { email: { contains: q, mode: "insensitive" } },
                    { firstname: { contains: q, mode: "insensitive" } },
                    { lastname: { contains: q, mode: "insensitive" } },
                    { username: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          }),
        },
        {
          ...(fromdate && {
            createdAt: {
              gte: new Date(fromdate),
            },
          }),
        },
        {
          ...(enddate && {
            createdAt: {
              lte: new Date(enddate),
            },
          }),
        },
        {
          ...(startprice && {
            price: {
              path: ["total"],
              gte: startprice,
            },
          }),
        },
        {
          ...(endprice && {
            price: {
              path: ["total"],
              lte: endprice,
            },
          }),
        },
        {
          ...(status && {
            status: {
              in: status,
            },
          }),
        },
      ],
    };
    const commonSelect: PrismaType.OrdersSelect = {
      id: true,
      user: isAdmin?.role === "ADMIN" && {
        select: {
          email: true,
          firstname: true,
          lastname: true,
          username: true,
        },
      },
      status: true,
      Orderproduct: {
        select: {
          id: true,
          productId: true,
          quantity: true,
        },
      },
      price: true,
    };

    switch (ty) {
      case "all":
        totalCount = await Prisma.orders.count({
          where: whereCondition,
        });
        orderData = (await Prisma.orders.findMany({
          where: whereCondition,
          take: lt,
          skip: (p - 1) * lt,
          select: commonSelect,
        })) as never;

        break;
      case "filter":
        totalfilter = await Prisma.orders.count({ where: whereCondition });
        orderData = (await Prisma.orders.findMany({
          where: whereCondition,
          select: commonSelect,
          take: lt,
          skip: (p - 1) * lt,
        })) as never;
        break;

      case "product":
        const categorySelect = {
          id: true,
          name: true,
        };
        orderData = (await Prisma.orderproduct.findFirst({
          where: {
            orderId: params.id,
          },
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                parentcateogries: {
                  select: categorySelect,
                },
                childcategories: {
                  select: categorySelect,
                },
                price: true,
                discount: true,
              },
            },
            details: true,
          },
        })) as never;
        break;
      case "export":
        totalfilter = await Prisma.orders.count({
          where: whereCondition,
        });
        orderData = (await Prisma.orders.findMany({
          where: whereCondition,
          select: {
            id: true,
            user: isAdmin?.role === "ADMIN" && {
              select: {
                email: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            },
            status: true,
            Orderproduct: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                details: true,
              },
            },
            price: true,
            createdAt: true,
          },
        })) as never;

        break;

      default:
        return Response.json({ error: "Invalid Type" }, { status: 400 });
    }

    return Response.json(
      { data: orderData, total: totalCount, totalfilter },
      { status: 200 }
    );
  } catch (error) {
    console.log("Order Product List", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    await Prisma.orders.delete({ where: { id } });

    return Response.json({ message: "Order Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Order", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
