"use server";

import { getPolicesByPage } from "@/src/app/api/policy/route";
import Prisma from "@/src/lib/prisma";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { CheckCart, Checkwishlist } from "./action";
import { ProductState } from "@/src/context/GlobalContext";

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

    const result: any = {
      ...product,
      discount: product.promotion_id
        ? product.discount
          ? calculateDiscountProductPrice({
              price: product.price,
              discount: product.discount,
            }).discount
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

    const ProductResult = result as ProductState;

    const checkcart = await CheckCart(undefined, ProductResult.id);

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
