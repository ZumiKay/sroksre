"use client";

import { StockTypeEnum } from "@/src/types/product.type";
import { Variantcontainer } from "./VariantModal";
import { UpdateStockModal } from "./Stock";
import { PRODUCT_STOCK_MODAL, StockEditTarget } from "./productStockTarget";

/**
 * Stock editor for one product. Rendered once by the page that lists
 * products (not once per card), and meant to be loaded with next/dynamic.
 */
export default function ProductStockModal({
  target,
}: {
  target: StockEditTarget;
}) {
  if (target.stocktype === StockTypeEnum.variants) {
    return (
      <Variantcontainer
        type="stock"
        editindex={target.id}
        closename={PRODUCT_STOCK_MODAL}
      />
    );
  }

  if (target.stocktype === StockTypeEnum.normal) {
    return (
      <UpdateStockModal closename={PRODUCT_STOCK_MODAL} productId={target.id} />
    );
  }

  return null;
}
