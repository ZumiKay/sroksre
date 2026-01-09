"use server";

import {
  ProductState,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import {
  Ordertype,
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";

interface CheckoutReturnType extends Ordertype {}

export const getCheckoutdata = async (
  orderid?: string,
  userid?: number
): Promise<CheckoutReturnType | null> => {
  const result = (await Prisma.orders.findFirst({
    where: userid ? { user: { id: userid } } : { id: orderid },
    include: {
      user: {
        select: { id: true, firstname: true, lastname: true, email: true },
      },
      shipping: true,
      Orderproduct: {
        include: {
          product: {
            select: {
              id: true,
              covers: true,
              discount: true,
              name: true,
              price: true,
              stocktype: true,
              Stock: { select: { Stockvalue: true } },
              Variant: {
                orderBy: { id: "asc" },
                select: { id: true, option_value: true },
              },
            },
          },
        },
      },
    },
  })) as unknown as Ordertype;

  if (!result) return null;

  const updatedOrderProducts: Array<Productordertype> = result.Orderproduct.map(
    (orderProduct) => {
      {
        const detail = orderProduct.details as Productorderdetailtype[];
        const product = orderProduct.product as ProductState;
        const selectedVariantDetails = product.Variant?.map((variant, idx) => {
          const detailValue = detail[idx].value;
          const optionValues = variant.option_value as (
            | string
            | VariantColorValueType
          )[];

          return optionValues.find((val) =>
            typeof val === "string"
              ? val === detailValue
              : val.val === detailValue
          );
        }).filter(Boolean);

        return {
          ...orderProduct,
          selectedvariant: selectedVariantDetails,
          //Calculated Discounted Price
          price: calculateDiscountProductPrice({
            price: product.price,
            discount: product.discount as number,
          }),
        } as unknown as Productordertype;
      }
    }
  );

  return {
    ...result,
    Orderproduct: updatedOrderProducts,
  };
};
