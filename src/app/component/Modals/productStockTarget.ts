// Kept apart from ProductStockModal so cards can use these without pulling
// the (large) stock editor code into their bundle.

/** openmodal key for the shared product stock modal */
export const PRODUCT_STOCK_MODAL = "productstock";

export interface StockEditTarget {
  id: number;
  stocktype?: string;
}
