import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { ProductState } from "@/src/context/GlobalContext";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import Prisma from "@/src/lib/prisma";

interface GetRelatedProductParamType {
  targetId?: number;
  parent_id?: number;
  limit?: number;
  child_id?: number;
  promoid?: number;
}
export async function GET(req: NextRequest) {
  try {
    const {
      targetId,
      parent_id,
      limit = 3,
      child_id,
      promoid,
    }: GetRelatedProductParamType = extractQueryParams(req.url.toString());

    if (!targetId || !parent_id) {
      return Response.json({}, { status: 400 });
    }

    let maxprod = false;
    let result = await Prisma.products.findMany({
      where: {
        id: { not: targetId },
      },
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        parentcategory_id: true,
        promotion_id: true,
        childcategory_id: true,
        covers: {
          select: {
            name: true,
            url: true,
          },
        },
      },
    });

    let product = result.map((i) => {
      const discount =
        i.discount &&
        calculateDiscountProductPrice({ price: i.price, discount: i.discount });
      return {
        ...i,
        discount: discount && discount.discount,
        category: {
          parent_id: i.parentcategory_id,
          child_id: i.childcategory_id,
        },
      };
    }) as unknown as ProductState[];

    //Finding The most similar product
    let relatedProducts = product
      .map((i) => {
        let score = 0;
        if (
          parent_id &&
          child_id &&
          promoid &&
          i.category.parent_id === parent_id &&
          i.category?.child_id === child_id &&
          i.promotion_id === promoid
        ) {
          score = 4;
        } else if (promoid && promoid === i.promotion_id) {
          score = 3;
        } else if (child_id && i.category?.child_id === child_id) {
          score = 2;
        } else if (i.category.parent_id === parent_id) {
          score = 1;
        }
        return { ...i, score };
      })
      .sort((a, b) => b.score - a.score);

    relatedProducts = relatedProducts.filter((i) => i.score > 0);

    if (relatedProducts.length <= limit) {
      maxprod = true;
    }

    relatedProducts = relatedProducts.slice(0, limit);

    return Response.json(
      {
        data: {
          relatedProducts,
          maxprod,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Fetch Similar Product", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
