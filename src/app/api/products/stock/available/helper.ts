import { Stocktype } from "@/src/types/product.type";
import { availableStockQuantity } from "@/src/lib/stockMatch";

/**
 * Calculates available quantity based on selected variant values.
 *
 * Match Logic:
 * - Exact match: Returns quantity of variant with same values and length
 * - Partial match: Sums quantities of ALL variants containing ALL selected values
 * - No match: Returns 0
 *
 * Examples:
 * - Stock: [Blue, M] qty=5, [M, Print] qty=20
 * - Selected [M] → Returns 25 (sum of both stocks containing M)
 * - Selected [Blue, M] → Returns 5 (exact match)
 * - Selected [Blue, Print] → Returns 0 (no stock contains both)
 * - Selected [Print] → Returns 20 (only [M, Print] contains Print)
 */
export const calculateAvailableQuantity = (
  variantstock: Stocktype[],
  selectedVariants: Array<{ variant_id: number; value: string }>,
): number =>
  availableStockQuantity(
    variantstock.flatMap((stock) => stock.Stockvalue),
    selectedVariants.map((i) => i.value),
  );
