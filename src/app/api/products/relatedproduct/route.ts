import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";
import { ProductState } from "@/src/context/GlobalType.type";
import { calculateDiscountPrice } from "@/src/lib/utilities";

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
    }: GetRelatedProductParamType = extractQueryParams(req.nextUrl.toString());

    if (!targetId || !parent_id) {
      return Response.json({}, { status: 400 });
    }

    let maxprod = false;
    const result = await Prisma.products.findMany({
      where: {
        id: { not: targetId },
      },
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        parentcateogries: true,
        childcategories: true,
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

    const product = result.map((i) => {
      const discount =
        i.discount && calculateDiscountPrice(i.price, i.discount);
      return {
        ...i,
        discount,
        category: {
          parent: i.parentcateogries,
          child: i.childcategories,
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
          i.category?.parent.id === parent_id &&
          i.category?.child?.id === child_id &&
          i.promotion_id === promoid
        ) {
          score = 4;
        } else if (promoid && promoid === i.promotion_id) {
          score = 3;
        } else if (child_id && i.category?.child?.id === child_id) {
          score = 2;
        } else if (i.category.parent.id === parent_id) {
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
