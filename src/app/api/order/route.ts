import { Shippingservice } from "@/src/context/Checkoutcontext";
import { totalpricetype } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { NextRequest } from "next/server";

//Edit Created Order Information
export async function PUT(req: NextRequest) {
  try {
    const { id, ty } = await req.json();
    if (!id) {
      return Response.json({}, { status: 403 });
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
          shippingtype: Shippingservice[2].value, //Update to Pickup
        },
      });
    }

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.log("Update Order", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
