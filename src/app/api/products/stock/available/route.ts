"use server";
import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/src/lib/prisma";
import { Stocktype } from "@/src/types/product.type";

interface RequestBody {
  productId: number;
  selectedVariants: Array<{ variant_id: number; value: string }>;
}

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
const calculateAvailableQuantity = (
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

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { productId, selectedVariants } = body;

    // Early validation
    if (!productId || typeof productId !== "number") {
      return NextResponse.json(
        { success: false, error: "Valid product ID is required" },
        { status: 400 },
      );
    }

    if (
      !selectedVariants ||
      !Array.isArray(selectedVariants) ||
      selectedVariants.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "At least one variant must be selected" },
        { status: 400 },
      );
    }

    // Validate variant structure
    const hasValidVariants = selectedVariants.every(
      (v) => v.variant_id && typeof v.variant_id === "number" && v.value,
    );

    if (!hasValidVariants) {
      return NextResponse.json(
        { success: false, error: "Invalid variant format" },
        { status: 400 },
      );
    }

    // Optimized query: First check if product exists and get required variants
    const product = await Prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        Variant: {
          where: { optional: null },
          select: {
            id: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    // Check if all required variants are selected
    const selectedVariantIds = new Set(
      selectedVariants.map((v) => v.variant_id),
    );
    const missingVariants = product.Variant.filter(
      (v) => !selectedVariantIds.has(v.id),
    );

    if (missingVariants.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select all required options",
        },
        { status: 400 },
      );
    }

    // Only fetch stock data after validation passes
    const stockData = await Prisma.stock.findMany({
      where: { product_id: productId },
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
    });

    if (!stockData || stockData.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: { availableQuantity: 0, hasStock: false },
        },
        { status: 200 },
      );
    }

    // Calculate available quantity
    const availableQuantity = calculateAvailableQuantity(
      stockData as Stocktype[],
      selectedVariants,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          availableQuantity,
          hasStock: availableQuantity > 0,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.log("Error calculating stock availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
