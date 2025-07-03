import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import {
  Allstatus,
  OrderFilterParam,
  OrderGetReqType,
  Ordertype,
  Productordertype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType } from "@prisma/client";
import { getUser } from "@/src/app/action";
import {
  calculateDiscountPrice,
  IsNumber,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { Role } from "@/src/lib/userlib";

interface GetOrderParam extends OrderFilterParam<number, Date> {
  id?: string;
  ty?: OrderGetReqType;
}

const verifyOrderParam = (params: GetOrderParam): boolean => {
  if (!params.ty) return false;

  // Validate numeric parameters
  const numericFields = ["startprice", "endprice", "p", "lt"] as const;
  for (const field of numericFields) {
    const value = params[field];
    if (
      value &&
      (field === "p" || field === "lt"
        ? !IsNumber(value.toString())
        : isNaN(Number(value)))
    ) {
      return false;
    }
  }

  // Validate date parameters
  const dateFields = ["fromdate", "enddate"] as const;
  for (const field of dateFields) {
    const value = params[field];
    if (value && isNaN(new Date(value).getTime())) {
      return false;
    }
  }

  // Validate status parameter
  if (params.status) {
    const statusArray = Array.isArray(params.status)
      ? params.status
      : [params.status];
    if (
      !statusArray.every((status) => Object.values(Allstatus).includes(status))
    ) {
      return false;
    }
  }

  return true;
};

export async function GET(req: NextRequest) {
  try {
    const params = extractQueryParams(req.nextUrl.toString()) as GetOrderParam;

    if (!verifyOrderParam(params)) {
      return Response.json(
        { message: "Invalid Query Parameters" },
        { status: 400 }
      );
    }

    // Normalize status to array
    if (params.status && typeof params.status === "string") {
      params.status = [params.status];
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
      id,
    } = params;
    const isAdmin = await getUser();

    const whereCondition: PrismaType.OrdersWhereInput = {
      AND: [
        isAdmin?.role === "ADMIN" ? {} : { buyer_id: isAdmin?.id },
        q
          ? {
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
            }
          : {},
        fromdate ? { createdAt: { gte: new Date(fromdate) } } : {},
        enddate ? { createdAt: { lte: new Date(enddate) } } : {},
        startprice ? { price: { path: ["total"], gte: startprice } } : {},
        endprice ? { price: { path: ["total"], lte: endprice } } : {},
        status
          ? { status: { in: status } }
          : { status: { not: Allstatus.achieve } },
      ],
    };

    const commonSelect: PrismaType.OrdersSelect = {
      id: true,
      user:
        isAdmin?.role === "ADMIN"
          ? {
              select: {
                email: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            }
          : false,
      status: true,
      Orderproduct: {
        select: {
          id: true,
          productId: true,
          quantity: true,
        },
      },
      price: true,
      shippingtype: true,
    };

    let orderData: unknown | null = null;
    let totalCount = 0;
    let totalfilter: number | undefined = undefined;

    switch (ty) {
      case "all":
        [totalCount, orderData] = await Promise.all([
          Prisma.orders.count({ where: whereCondition }),
          Prisma.orders.findMany({
            where: whereCondition,
            take: lt,
            skip: (p - 1) * lt,
            select: commonSelect,
            orderBy: {
              id: "asc",
            },
          }),
        ]);
        break;

      case "filter":
        [totalfilter, orderData] = await Promise.all([
          Prisma.orders.count({ where: whereCondition }),
          Prisma.orders.findMany({
            where: whereCondition,
            select: commonSelect,
            take: lt,
            skip: (p - 1) * lt,
            orderBy: {
              id: "asc",
            },
          }),
        ]);
        break;

      case "product":
        const orderProducts = await Prisma.orderproduct.findMany({
          where: {
            AND: [
              { orderId: id },
              q
                ? {
                    product: {
                      name: {
                        contains: removeSpaceAndToLowerCase(q),
                        mode: "insensitive",
                      },
                    },
                  }
                : {},
            ],
          },
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                covers: { take: 1 },
                parentcateogries: { select: { id: true, name: true } },
                childcategories: { select: { id: true, name: true } },
                price: true,
                discount: true,
              },
            },
            details: {
              select: {
                variant: true,
                variantIdx: true,
                variantId: true,
              },
            },
          },
        });

        orderData = orderProducts.map((data) => {
          const orderproduct = data as unknown as Productordertype;
          const calculatedPrice = orderproduct?.product?.discount
            ? Number(
                calculateDiscountPrice(
                  orderproduct.product.price,
                  orderproduct.product.discount as unknown as number
                ).newprice
              )
            : orderproduct?.product?.price;

          return {
            ...orderproduct,
            total: orderproduct.quantity * (calculatedPrice ?? 0),
            product: {
              ...orderproduct.product,
              discount: orderproduct?.product?.discount
                ? calculateDiscountPrice(
                    orderproduct.product.price,
                    orderproduct.product.discount as unknown as number
                  )
                : null,
            },
          };
        }) as never;
        break;

      case "export":
        [totalfilter, orderData] = await Promise.all([
          Prisma.orders.count({ where: whereCondition }),
          Prisma.orders.findMany({
            where: whereCondition,
            select: {
              id: true,
              user:
                isAdmin?.role === "ADMIN"
                  ? {
                      select: {
                        email: true,
                        firstname: true,
                        lastname: true,
                        username: true,
                      },
                    }
                  : false,
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
          }),
        ]);
        break;

      case "status":
        orderData = await Prisma.orders.findUnique({
          where: { id },
          select: {
            status: true,
          },
        });
        break;

      case "shipping":
      case "user":
        const selectFields =
          ty === "shipping"
            ? { shipping: true, shippingtype: true }
            : { user: true };

        orderData = (await Prisma.orders.findUnique({
          where: { id },
          select: selectFields,
        })) as unknown as Ordertype;
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

type OrderDeleteType = {
  ty: "multi" | "single";
  id: string | string[];
};

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ty } = body as OrderDeleteType;

    if (!id || !ty) {
      return Response.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    switch (ty) {
      case "multi":
        if (!Array.isArray(id) || id.length === 0) {
          return Response.json(
            { message: "Invalid order IDs" },
            { status: 400 }
          );
        }

        const multiWhere: PrismaType.OrdersWhereInput = {
          id: { in: id },
        };

        if (user.role === Role.ADMIN) {
          await Prisma.orders.deleteMany({ where: multiWhere });
        } else {
          await Prisma.orders.updateMany({
            where: {
              AND: [multiWhere, { buyer_id: user.id }],
            },
            data: {
              status: Allstatus.achieve,
            },
          });
        }
        break;

      case "single":
        if (typeof id !== "string") {
          return Response.json(
            { message: "Invalid order ID" },
            { status: 400 }
          );
        }

        if (user.role === Role.ADMIN) {
          await Prisma.orders.delete({
            where: { id },
          });
        } else {
          await Prisma.orders.updateMany({
            where: {
              id,
              buyer_id: user.id,
            },
            data: {
              status: Allstatus.achieve,
            },
          });
        }
        break;

      default:
        return Response.json(
          { message: "Invalid operation type" },
          { status: 400 }
        );
    }

    return Response.json(
      { message: "Order processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Order:", error);
    return Response.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
