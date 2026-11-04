import { createRandomNormalStockProduct } from "../product";
import { generateExpirationDate } from "@/src/lib/userlib";
import { ProductState } from "@/src/types/product.type";

export interface PrepareDataForPromotionType {
  /** Number of promotions. */
  count: number;
  /** New products to create in each promotion. */
  productCount: number;
  /** Discount % per promotion, by position. Missing entries get a random one. */
  discountPercent?: Array<number>;
  /** 1-based position of a promotion that expires after 1 second (for testing cleanup). */
  expiredCount?: number;
}

export interface PreparedPromotion {
  name: string;
  description: string;
  expireAt: Date;
  discount: number;
  products: ProductState[];
}

/** A random discount from 5% to 50%, in steps of 5. */
const randomDiscount = () => (Math.floor(Math.random() * 10) + 1) * 5;

/** Builds promotion data with complete normal-stock products (not saved yet). */
export const PrepareDataForPromotion = ({
  count,
  productCount,
  discountPercent,
  expiredCount,
}: PrepareDataForPromotionType): PreparedPromotion[] =>
  Array.from({ length: count }, (_, idx) => {
    const n = idx + 1;
    return {
      name: `Promotion #${n}`,
      description: `Description for promotion #${n}`,
      expireAt:
        expiredCount === n
          ? generateExpirationDate(1, "seconds")
          : generateExpirationDate(4, "days"),
      discount: discountPercent?.[idx] ?? randomDiscount(),
      products: createRandomNormalStockProduct({ count: productCount }),
    };
  });
