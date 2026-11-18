import { NextRequest, NextResponse } from "next/server";
import Prisma from "@/src/lib/prisma";
import { Stocktype } from "@/src/types/product.type";
import { calculateAvailableQuantity } from "./helper";
import { isVariantActive } from "@/src/lib/variantCondition";

interface RequestBody {
  productId: number;
  selectedVariants: Array<{ variant_id: number; value: string }>;
}

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
          select: {
            id: true,
            optional: true,
            option_title: true,
            option_value: true,
            condition: true,
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
    // Required = not marked optional (stored as null) and, for add-ons,
    // only while their trigger option is selected
    const variants = product.Variant as unknown as Parameters<
      typeof isVariantActive
    >[1];
    const missingVariants = product.Variant.filter(
      (v, idx) =>
        v.optional === null &&
        !selectedVariantIds.has(v.id) &&
        isVariantActive(variants[idx], variants, selectedVariants),
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
