"use server";

import {
  Ordertype,
  Orderpricetype,
  Productorderdetailtype,
  Productordertype,
  OrderSelectedVariantType,
  ShippingTypeEnum,
  totalpricetype,
  Allstatus,
} from "@/src/types/order.type";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import {
  VariantValueObjType,
  VariantSectionType,
} from "@/src/types/product.type";
import { userdata } from "../account/actions";

/** Get Specific Order Details
 * @param orderid
 * @param userid
 * @returns order with user details
 */
export const getCheckoutdata = async (
  orderid?: string,
  userid?: string,
): Promise<Ordertype | null> => {
  const result = await Prisma.orders.findFirst({
    where: {
      ...(orderid ? { id: orderid } : {}),
      ...(userid ? { user: { buyer_id: userid } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          buyer_id: true,
          firstname: true,
          lastname: true,
          email: true,
        },
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
              //Variant with variant section
              Variant: {
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  price: true,
                  option_value: true,
                  variantSection: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  const updatedOrderProducts: Array<Productordertype> = result.Orderproduct.map(
    (orderProduct) => {
      {
        const detail = orderProduct.details as Productorderdetailtype[];
        const hasVariantSection = orderProduct.product.Variant.some(
          (variant) => variant.variantSection,
        );

        let selectedVariantDetails:
          | Array<string | VariantValueObjType>
          | OrderSelectedVariantType;

        if (hasVariantSection) {
          // Grouped by variant sections
          const sectionMap = new Map<
            number | null,
            Array<string | VariantValueObjType>
          >();
          const sectionInfoMap = new Map<number, any>();

          orderProduct.product.Variant.forEach((variant, idx) => {
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
          selectedVariantDetails = orderProduct.product.Variant.map(
            (variant, idx) => {
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
            },
          ).filter(Boolean) as Array<string | VariantValueObjType>;
        }

        // Compute extra price from variant options (per-value or variant-level)
        const variantExtra = detail.reduce((extraSum, d) => {
          if (!d.value) return extraSum;
          const variant = orderProduct.product.Variant.find(
            (v) => v.id === d.variant_id,
          );
          if (!variant) return extraSum;
          const variantLevelPrice = (variant as any).price;
          if (variantLevelPrice) {
            return extraSum + parseFloat(variantLevelPrice.toString());
          }
          const option = (
            variant.option_value as (string | VariantValueObjType)[]
          ).find((opt) =>
            typeof opt === "string" ? opt === d.value : opt.val === d.value,
          );
          if (option && typeof option !== "string" && option.price) {
            return extraSum + parseFloat(option.price.toString());
          }
          return extraSum;
        }, 0);

        const basePrice = calculateDiscountProductPrice({
          price: orderProduct.product.price,
          discount: orderProduct.product.discount ?? undefined,
        });

        const finalProductPrice: Orderpricetype =
          variantExtra > 0
            ? {
                ...basePrice,
                extra: variantExtra,
                ...(basePrice.discount
                  ? {
                      discount: {
                        ...basePrice.discount,
                        newprice: parseFloat(
                          (
                            (basePrice.discount.newprice ?? basePrice.price) +
                            variantExtra
                          ).toFixed(2),
                        ),
                      },
                    }
                  : {}),
              }
            : basePrice;

        return {
          ...orderProduct,
          selectedvariant: selectedVariantDetails,
          price: finalProductPrice,
        } as unknown as Productordertype; //Ignore JSONValue type
      }
    },
  );

  return {
    ...result,
    user: result.user as userdata,
    shipping: result.shipping ?? undefined,
    shippingtype: result.shippingtype as ShippingTypeEnum,
    estimate: result.estimate ?? undefined,
    price: result.price as unknown as totalpricetype,
    status: result.status as Allstatus,
    shipping_id: result.shipping_id ?? undefined,
    Orderproduct: updatedOrderProducts,
  };
};

export const getVariantPriceBreakDown = async (orderId: string) => {
  try {
    const isOrder = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        price: true,
        shippingtype: true,
        Orderproduct: {
          select: {
            quantity: true,
            details: true,
            product: {
              select: {
                id: true,
                name: true,
                Variant: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!isOrder) {
      return null;
    }

    return isOrder;
  } catch (error) {
    console.log("Get Variant Price Break Down", error);
    return null;
  }
};
