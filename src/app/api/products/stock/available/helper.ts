import { Stocktype } from "@/src/types/product.type";

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
): number => {
  // Early exit: Filter and validate selected values once
  const selectedValues = selectedVariants
    .map((i) => i.value)
    .filter((val) => val && val.length > 0);

  if (selectedValues.length === 0) {
    return 0;
  }

  // Pre-create Set for O(1) lookup
  const selectedValuesSet = new Set(selectedValues);
  const selectedCount = selectedValuesSet.size;

  let partialMatchQtySum = 0;

  // Flatten stock values for single iteration
  for (const stock of variantstock) {
    for (const variant of stock.Stockvalue) {
      // Filter once and create Set
      const filteredVariant = variant.variant_val.filter(
        (val) => val && val !== "null" && val.length > 0,
      );

      // Skip early if fewer values than selected
      if (filteredVariant.length < selectedCount) {
        continue;
      }

      const filteredVariantSet = new Set(filteredVariant);

      // Check if all selected values are present
      const allSelectedValuesMatch = selectedValues.every((val) =>
        filteredVariantSet.has(val),
      );

      if (!allSelectedValuesMatch) {
        continue;
      }

      // Check for exact match
      if (filteredVariant.length === selectedCount) {
        // Exact match found - return immediately
        return variant.qty;
      }

      // Partial match - accumulate quantity
      partialMatchQtySum += variant.qty;
    }
  }

  // Return sum of partial matches (or 0 if none found)
  return partialMatchQtySum;
};
