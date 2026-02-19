"use server";

import {
  Ordertype,
  Productorderdetailtype,
  Productordertype,
  OrderSelectedVariantType,
} from "@/src/types/order.type";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import {
  ProductState,
  VariantValueObjType,
  VariantSectionType,
} from "@/src/types/product.type";

export const getCheckoutdata = async (
  orderid?: string,
  userid?: number,
): Promise<Ordertype | null> => {
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

        // Check if any variant has variantSection (assuming it's in the data if queried with it)
        const hasVariantSection = product.Variant?.some(
          (variant: any) => variant.variantSection,
        );

        let selectedVariantDetails:
          | Array<string | VariantValueObjType>
          | OrderSelectedVariantType;

        if (hasVariantSection && product.Variant) {
          // Group by variant sections
          const sectionMap = new Map<
            number | null,
            Array<string | VariantValueObjType>
          >();
          const sectionInfoMap = new Map<number, any>();

          product.Variant.forEach((variant: any, idx) => {
            const detailValue = detail[idx].value;
            const optionValues = variant.option_value as (
              | string
              | VariantValueObjType
            )[];

            const matchedValue = optionValues.find((val) =>
              typeof val === "string"
                ? val === detailValue
                : val.val === detailValue,
            );

            if (matchedValue) {
              const sectionId = variant.variantSection?.id ?? null;
              if (!sectionMap.has(sectionId)) {
                sectionMap.set(sectionId, []);
              }
              sectionMap.get(sectionId)!.push(matchedValue);

              if (sectionId && variant.variantSection) {
                sectionInfoMap.set(sectionId, variant.variantSection);
              }
            }
          });

          const variantsection: Array<{
            variantSection: Partial<VariantSectionType>;
            variants: Array<string | VariantValueObjType>;
          }> = [];
          const variant: Array<string | VariantValueObjType> = [];

          sectionMap.forEach((variants, sectionId) => {
            if (sectionId) {
              variantsection.push({
                variantSection: sectionInfoMap.get(sectionId),
                variants,
              });
            } else {
              variant.push(...variants);
            }
          });

          selectedVariantDetails = {
            variantsection:
              variantsection.length > 0 ? variantsection : undefined,
            variant: variant.length > 0 ? variant : undefined,
          };
        } else {
          // No sections - return flat array
          selectedVariantDetails = (product.Variant?.map((variant, idx) => {
            const detailValue = detail[idx].value;
            const optionValues = variant.option_value as (
              | string
              | VariantValueObjType
            )[];

            return optionValues.find((val) =>
              typeof val === "string"
                ? val === detailValue
                : val.val === detailValue,
            );
          }).filter(Boolean) ?? []) as Array<string | VariantValueObjType>;
        }

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
    },
  );

  return {
    ...result,
    Orderproduct: updatedOrderProducts,
  };
};
