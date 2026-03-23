import {
  Allstatus,
  OrderInfoParamTyType,
  ShippingTypeEnum,
  totalpricetype,
} from "@/src/types/order.type";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import { getUser } from "@/src/lib/session";

//Get Order Informations

type OrderInfoParamType = {
  ty?: OrderInfoParamTyType;
  q?: string;
};

export async function GET(req: NextRequest) {
  const { ty } = req.nextUrl.searchParams as OrderInfoParamType;

  if (!ty) return Response.json({}, { status: 400 });

  try {
    const isUser = await getUser({
      user: {
        select: {
          buyer_id: true,
        },
      },
    });
    if (!isUser)
      return Response.json({ message: "Unauthenticated" }, { status: 401 });

    if (ty === "shipping") {
      const { q: orderid } = req.nextUrl.searchParams as OrderInfoParamType;

      const [addresses, order] = await Promise.all([
        Prisma.address.findMany({ where: { userId: isUser.userId } }),
        orderid
          ? Prisma.orders.findUnique({
              where: { id: orderid },
              select: { shipping: true },
            })
          : Promise.resolve(null),
      ]);

      return Response.json(
        { data: { addresses, shipping: order?.shipping ?? null }, success: true },
        { status: 200 },
      );
    }

    return Response.json({}, { status: 400 });
  } catch (error) {
    console.log("Get Order Info", error);
    return Response.json({ message: "Error occured" }, { status: 500 });
  }
}

//Edit Created Order Information

export async function PUT(req: NextRequest) {
  try {
    const { id, ty, addressId } = await req.json();
    if (!id) {
      return Response.json({}, { status: 403 });
    }

    const isUser = await getUser({ user: { select: { buyer_id: true } } });
    if (!isUser) {
      return Response.json({ message: "Unauthenticated" }, { status: 401 });
    }

    const order = await Prisma.orders.findUnique({
      where: { id },
      select: {
        price: true,
        Orderproduct: {
          select: {
            quantity: true,
            product: {
              select: {
                price: true,
                discount: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return Response.json({}, { status: 404 });
    }

    if (ty === "setShipping") {
      if (!addressId || typeof addressId !== "number" || addressId <= 0) {
        return Response.json({ message: "Invalid addressId" }, { status: 400 });
      }

      const address = await Prisma.address.findUnique({
        where: { id: addressId },
        select: { id: true, userId: true },
      });

      if (!address || address.userId !== isUser.userId) {
        return Response.json(
          { message: "Invalid shipping address" },
          { status: 403 },
        );
      }

      await Prisma.orders.update({
        where: { id },
        data: { shipping_id: addressId },
      });

      return Response.json({}, { status: 200 });
    }

    if (ty === "removeAddress") {
      const updatedTotalPrice = order.Orderproduct.reduce((total, item) => {
        const { price, discount } = item.product;

        const calculatedPrice = calculateDiscountProductPrice({
          price,
          discount: discount ? discount : undefined,
        });

        const estimatedprice = calculatedPrice.discount
          ? calculatedPrice.discount.newprice
          : calculatedPrice.price;

        return total + (estimatedprice ?? 0) * item.quantity;
      }, 0);
      const updateprice: totalpricetype = {
        total: updatedTotalPrice,
        subtotal: updatedTotalPrice,
        shipping: 0,
      };

      await Prisma.orders.update({
        where: { id },
        data: {
          price: updateprice as any,
          shippingtype: ShippingTypeEnum.pickup,
          shipping_id: null,
        },
      });
    }

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.log("Update Order", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
