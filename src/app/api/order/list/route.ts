import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import {
  DownloadData,
  Filterdatatype,
  OrderGetReqType,
  Ordertype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType } from "@prisma/client";
import { calculateDiscountPrice, OrderReciptEmail } from "@/src/lib/utilities";
import { SendOrderEmail } from "@/src/app/checkout/action";
import { GetFilterOrder } from "./extendRoute";

interface GetOrderParam extends Filterdatatype {
  id?: string;
  lt?: number;
  q?: string;
  ty?: OrderGetReqType;
  sort?: "asc" | "desc";
}

export async function GET(req: NextRequest) {
  try {
    // Extract all query parameters at once and destructure
    const url = req.nextUrl.toString();
    const params = extractQueryParams(url) as GetOrderParam;
    const { ty, id, sort, q, lt } = params;

    if (!ty) {
      return Response.json({}, { status: 400 });
    }

    const handlers: Record<OrderGetReqType, () => Promise<Response>> = {
      all: async () => {
        const orders = await Prisma.orders.findMany({
          select: {
            id: true,
            _count: {
              select: {
                Orderproduct: true,
              },
            },
            status: true,
            price: true,
          },
          orderBy: {
            price: {
              path: ["total"],
              order: sort || "desc",
            } as never,
          },

          ...(lt ? { take: Number(lt) } : { take: 5 }),
        });

        return Response.json({ data: orders });
      },

      user: async () => {
        // Validate required params
        if (!id) {
          return Response.json(
            { error: "Missing id parameter" },
            { status: 400 }
          );
        }

        const orderUser = await Prisma.orders.findUnique({
          where: { id },
          select: { user: true },
        });

        return Response.json({ data: orderUser }, { status: 200 });
      },

      filter: async () => {
        // Pass only the required params to GetFilterOrder
        const filterParams: Filterdatatype = {
          p: params.p,
          lt: params.lt,
          startprice: params.startprice,
          endprice: params.endprice,
          filename: params.filename,
          todate: params.todate,
          fromdate: params.fromdate,
          orderdate: params.orderdate,
          q: params.q,
        };

        const data = await GetFilterOrder(filterParams);
        return Response.json({ data });
      },

      product: async () => {
        // Validate required params
        if (!id) {
          return Response.json(
            { error: "Missing id parameter" },
            { status: 400 }
          );
        }

        // Build the query conditions more efficiently
        const whereCondition: PrismaType.OrderproductWhereInput = {
          orderId: id,
          ...(q
            ? {
                product: {
                  OR: [
                    { name: { equals: q, mode: "insensitive" } },
                    {
                      parentcateogries: {
                        name: { equals: q, mode: "insensitive" },
                      },
                    },
                  ],
                },
              }
            : {}),
        };

        const Orderproduct = await Prisma.orderproduct.findMany({
          where: whereCondition,
          take: lt ? Number(lt) : 50, // Provide a default limit
          include: {
            product: {
              include: {
                parentcateogries: { select: { name: true } },
                childcategories: { select: { name: true } },
              },
            },
          },
        });

        // Process product data with optimized mapping
        const processedData = Orderproduct.map((prod) => {
          // Calculate discount only if it exists
          let discountPrice;
          if (prod.product.discount) {
            discountPrice = calculateDiscountPrice(
              prod.product.price,
              prod.product.discount
            );
          }

          return {
            ...prod,
            product: {
              ...prod.product,
              ...(discountPrice !== undefined && { discount: discountPrice }),
            },
          };
        });

        return Response.json({ data: processedData }, { status: 200 });
      },
      export: async () => {
        const exportData = await GetFilterOrder(params, ty === "export");

        if (!exportData) {
          return Response.json({ error: "No Order Found" }, { status: 400 });
        }

        const returnData: Array<DownloadData> = exportData.map((orderItem) => ({
          orderID: orderItem.id,
          orderDate: orderItem.orderDate?.toString() as string,
          buyer: orderItem.user.email,
          product: orderItem.Orderproduct.map((prod) => {
            const product = prod as unknown as Productordertype;
            return {
              productid: product.product?.id as number,
              productname: product.product?.name as string,
              quantity: product.quantity,
              price: product.product?.price as number,
              discount: product.product?.discount as unknown as number,
            };
          }),
          shippingtype: orderItem.shippingtype,
          shippingprice:
            (orderItem.price as unknown as totalpricetype).shipping ?? 0,
          totalprice: (orderItem as unknown as totalpricetype).total,
        })) as never;

        return Response.json({ data: returnData }, { status: 200 });
      },
    };

    // Execute the appropriate handler or return 400 for invalid type
    const handler = handlers[ty as never] as () => Promise<void>;
    if (!handler) {
      return Response.json({ error: "Invalid request type" }, { status: 400 });
    }

    return await handler();
  } catch (error) {
    console.log("Order Product List", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}

type OrderEditType = {
  ty: "status";
  id: string;
  updateData: Ordertype;
  template?: string;
};
export async function PUT(req: NextRequest) {
  try {
    const { ty, id, updateData, template } =
      (await req.json()) as OrderEditType;

    if (!id || !ty || !updateData) return Response.json({}, { status: 400 });

    const isOrder = await Prisma.orders.findUnique({
      where: { id },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!isOrder)
      return Response.json({ message: "Can't Find Order" }, { status: 404 });

    await Prisma.orders.update({
      where: { id },
      data: {
        ...(ty === "status"
          ? {
              status: updateData.status,
            }
          : {}),
      },
    });

    //Send Noftify Email To User
    if (template) {
      const emailTempalte = OrderReciptEmail(template);
      const subject = `Order #${id} receipt has been updated to ${updateData.status}`;
      await SendOrderEmail(emailTempalte, isOrder.user.email, subject);
    }

    return Response.json({ message: "Order Updated" }, { status: 200 });
  } catch (error) {
    console.log("Edit Order", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
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
