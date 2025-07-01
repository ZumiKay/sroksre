"use server";
import { VariantColorValueType } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountPrice } from "@/src/lib/utilities";

const getCheckoutdata = async (orderid?: string, userid?: number) => {
  const result = await Prisma.orders.findFirst({
    where: userid ? { user: { id: userid } } : { id: orderid },
    select: {
      id: true,
      createdAt: true,
      status: true,
      user: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
      price: true,
      shipping: true,
      Orderproduct: {
        select: {
          id: true,
          quantity: true,
          stock_selected_id: true,
          stockvar: true,
          details: {
            select: {
              variant: true,
              variantId: true,
              variantIdx: true,
            },
          },

          product: {
            select: {
              id: true,
              name: true,
              stocktype: true,
              price: true,
              discount: true,
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const updatedOrderProducts = result.Orderproduct.map((orderProduct) => {
    {
      return {
        ...orderProduct,
        selectedvariant: orderProduct.details.map(
          (i) =>
            (i.variant.option_value as Array<string | VariantColorValueType>)[
              i.variantIdx
            ]
        ),
        product: {
          ...orderProduct.product,
          discount:
            orderProduct.product.discount &&
            calculateDiscountPrice(
              orderProduct.product.price,
              orderProduct.product.discount
            ),
        },
      };
    }
  });

  return {
    ...result,
    Orderproduct: updatedOrderProducts,
  };
};

export default getCheckoutdata;
