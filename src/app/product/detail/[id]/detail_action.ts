"use server";

import { getPolicesByPage } from "@/src/app/api/policy/route";
import Prisma from "@/src/lib/prisma";
import { CheckCart, Checkwishlist } from "./action";
import {
  ActionReturnType,
  ProductState,
  Stocktype,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { calculateDiscountPrice } from "@/src/lib/utilities";
import { Allstatus, Productorderdetailtype } from "@/src/context/OrderContext";

interface Policytype {
  id: number;
  title: string;
  showtype?: string;
  Paragraph: {
    title?: string;
    content: string;
  }[];
}

export async function GetProductDetailById(pid: string) {
  const id = parseInt(pid, 10);

  try {
    const product = await Prisma.products.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        stock: true,
        stocktype: true,
        Variant: {
          orderBy: { id: "asc" },
        },
        Stock: {
          select: {
            id: true,
            Stockvalue: {
              select: {
                id: true,
                qty: true,
                variant_val: true,
              },
            },
          },
        },
        description: true,
        parentcategory_id: true,
        childcategory_id: true,
        relatedproductId: true,
        promotion_id: true,
        details: true,
        relatedproduct: {
          select: {
            id: true,
            productId: true,
          },
        },
        covers: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
      },
    });

    if (!product) {
      return { success: false };
    }

    const otherProduct =
      product.relatedproductId && product.relatedproduct
        ? await Prisma.products.findMany({
            where: { id: { in: product.relatedproduct.productId as number[] } },
            select: {
              id: true,
              name: true,
              parentcategory_id: true,
              childcategory_id: true,
              covers: {
                select: {
                  id: true,
                  url: true,
                },
              },
            },
          })
        : [];

    const result = {
      ...product,
      discount: product.promotion_id
        ? product.discount
          ? calculateDiscountPrice(product.price, product.discount)
          : undefined
        : undefined,
      category: {
        parent_id: product.parentcategory_id,
        child_id: product.childcategory_id,
      },
      variants: product.Variant,
      varaintstock: product.Stock,
      relatedproduct: otherProduct.filter((i) => i.id !== product.id),
      // Remove properties that are no longer needed
      parentcategory_id: undefined,
      childcategory_id: undefined,
      Variant: undefined,
      Stock: undefined,
    };

    const policy = (await getPolicesByPage("productdetail")) as Policytype[];

    const isInWishlist = await Checkwishlist(id);

    const ProductResult = result as unknown as ProductState;

    const checkcart = await CheckCart(id);

    let isInCart = false;

    if (checkcart.success) {
      isInCart = checkcart.incart ?? false;
    }

    return {
      success: true,
      data: { data: ProductResult, policy, isInWishlist, incart: isInCart },
    };
  } catch (error) {
    console.log("Product Detail", error);
    return { success: false };
  }
}

type IsInCartProps = {
  selected_var: Productorderdetailtype[];
  pid: number;
};
export const IsInCartAndGetStock = async ({
  selected_var,
  pid,
}: IsInCartProps): Promise<
  ActionReturnType<{ qty?: number; stockId?: number; incart?: boolean }>
> => {
  try {
    if (!pid || !selected_var || selected_var.length === 0) {
      return { success: true };
    }

    // Prepare a map for efficient variant lookup
    const variantMap = new Map();
    for (const item of selected_var) {
      if (item.variantId && item.variantIdx !== undefined) {
        const key = `${item.variantId}-${item.variantIdx}`;
        variantMap.set(key, true);
      }
    }

    // Exit early if no valid variants
    if (variantMap.size === 0) {
      return { success: true };
    }
    let isincart = false;
    // Query only the needed data with more specific filter
    const order = await Prisma.orders.findFirst({
      where: {
        status: { in: [Allstatus.incart, Allstatus.unpaid] },
      },
      select: {
        Orderproduct: {
          select: {
            details: {
              select: {
                variantId: true,
                variantIdx: true,
              },
            },
          },
        },
      },
    });

    // If no order found or no products, return not in cart
    if (!order || !order.Orderproduct || order.Orderproduct.length === 0) {
      isincart = false;
    }

    // Check if any product in the cart matches the selected variants

    if (order?.Orderproduct)
      for (const product of order.Orderproduct) {
        for (const detail of product.details) {
          if (
            detail.variantId &&
            detail.variantIdx &&
            variantMap.has(`${detail.variantId}-${detail.variantIdx}`)
          ) {
            isincart = true;
          }
        }
      }

    //Get QTY Of The Selected Var
    const prod = await Prisma.products.findUnique({
      where: { id: pid },
      select: {
        Variant: true,
        Stock: {
          select: {
            Stockvalue: true,
          },
        },
      },
    });

    if (!prod)
      return {
        success: false,
      };

    const selectedVariant: Array<string> = (
      prod.Variant as Varianttype[]
    ).reduce<string[]>((acc, variant) => {
      const matchingVar = selected_var.find((i) => i.variantId === variant.id);

      if (matchingVar && matchingVar.variantIdx !== undefined) {
        // Extract the specific option value using variantIdx
        const optionValue =
          variant.option_value[matchingVar.variantIdx as never];

        if (optionValue) {
          // Handle both string and object types
          const value =
            typeof optionValue === "string" ? optionValue : optionValue.val; // Assuming object has a 'val' property

          if (value) {
            acc.push(value);
          }
        }
      }

      return acc;
    }, []);

    const { id, qty } = getQtyBaseOnSelectionVar(
      selectedVariant,
      prod.Stock as unknown as Stocktype[]
    );

    return {
      success: true,
      data: {
        incart: isincart,
        qty,
        stockId: id,
      },
    };
  } catch (error) {
    console.error("IsInCart error:", error);
    return { success: false, error: "Error occurred while checking cart" };
  }
};

const getQtyBaseOnSelectionVar = (variant: string[], stockval: Stocktype[]) => {
  // Early return if inputs are invalid
  if (!variant?.length || !stockval?.length) {
    return { qty: 0, id: 0 };
  }

  // Convert variant array to Set for O(1) lookup
  const variantSet = new Set(variant);
  const variantLength = variant.length;

  // Iterate through each stock item in the array
  for (const stock of stockval) {
    // Check if Stockvalue exists and has items
    if (!stock.Stockvalue || !stock.Stockvalue.length) {
      continue;
    }

    // Check each stock value
    for (const stockValue of stock.Stockvalue) {
      if (
        !stockValue.variant_val ||
        stockValue.variant_val.length !== variantLength
      ) {
        continue;
      }

      if (stockValue.variant_val.every((val) => variantSet.has(val))) {
        // Return immediately on first match (early exit)
        return {
          qty: stockValue.qty,
          id: stockValue.id ?? 0,
        };
      }
    }
  }

  // Return default if no match found
  return { qty: 0, id: 0 };
};
