import {
  PromotionProductState,
  PromotionState,
} from "@/src/types/productAction.type";
import { createRandomNormalStockProduct } from "../product";
import { generateExpirationDate } from "@/src/lib/userlib";
import { Products, Promotion } from "@/prisma/generated/prisma/client";

export interface PrepareDataForPromotionType {
  count: number;
  productCount: number;
  discountPercent?: Array<number>;
  expiredCount?: number;
}

/**
 *
 * @param count - promotion
 * @param productCount - product of each promotion
 * @param discountPercent - custom Discount Percent
 * @returns
 */

interface PreparePromotionType extends Promotion {
  Products: Products;
}
export const PrepareDataForPromotion = ({
  count,
  productCount,
  discountPercent,
  expiredCount,
}: PrepareDataForPromotionType): Array<PreparePromotionType> => {
  let i = 0;
  let result: Array<PreparePromotionType> = [];
  do {
    i++;

    const normalStockProducts = createRandomNormalStockProduct({
      count: productCount,
    });

    const percent = discountPercent?.[i - 1];

    const products: Array<Partial<Products>> = normalStockProducts.map(
      (p, idx) => ({
        id: p.id ?? idx,
        ...(percent !== undefined && {
          discount: percent,
        }),
      }),
    );

    const preparedPromo: Partial<PreparePromotionType> = {
      name: `Promotion #${i}`,
      description: `Description for promotion #${i}`,
      Products: products as never,
      expireAt: (expiredCount === i
        ? generateExpirationDate(1, "seconds")
        : generateExpirationDate(4, "days")) as never,
    };

    result.push(preparedPromo as never);
  } while (i < count);

  return result;
};
