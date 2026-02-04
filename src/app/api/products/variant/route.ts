"use server";

import Prisma from "@/src/lib/prisma";
import { VariantSectionType } from "@/src/types/product.type";
import { NextResponse } from "next/server";

// POST - Create variant section
export async function POST(req: Request) {
  try {
    const data = (await req.json()) as unknown as VariantSectionType;

    // Validate required fields
    if (!data.productsId || !data.name) {
      return NextResponse.json(
        { success: false, message: "Product ID and name are required" },
        { status: 400 },
      );
    }

    if (!data.Variants || data.Variants.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one variant is required" },
        { status: 400 },
      );
    }

    // Verify product exists (optimized with select)
    const isProduct = await Prisma.products.findUnique({
      where: { id: data.productsId },
      select: { id: true },
    });

    if (!isProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    // Validate all variants have required fields
    const hasInvalidVariant = data.Variants.some(
      (variant) =>
        !variant.option_title ||
        !variant.option_type ||
        !variant.option_value ||
        variant.option_value.length === 0,
    );

    if (hasInvalidVariant) {
      return NextResponse.json(
        {
          success: false,
          message: "All variants must have title, type, and values",
        },
        { status: 400 },
      );
    }

    // Create Variant Section with variants in a transaction
    const variantSection = await Prisma.variantSection.create({
      data: {
        name: data.name,
        productsId: isProduct.id,
        Variants: {
          createMany: {
            data: data.Variants.map((variant) => ({
              option_title: variant.option_title,
              option_type: variant.option_type,
              option_value: variant.option_value,
              optional: variant.optional ?? false,
              product_id: isProduct.id,
            })),
          },
        },
      },
      include: {
        Variants: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Variant section created successfully",
        data: variantSection,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/products/variant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create variant section",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - Update variant section
export async function PUT(req: Request) {
  try {
    const data = (await req.json()) as unknown as VariantSectionType & {
      id: number;
    };

    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { success: false, message: "Variant section ID is required" },
        { status: 400 },
      );
    }

    if (!data.name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    // Verify variant section exists
    const existingSection = await Prisma.variantSection.findUnique({
      where: { id: data.id },
      select: { id: true, productsId: true },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, message: "Variant section not found" },
        { status: 404 },
      );
    }

    // If variants are provided, validate them
    if (data.Variants && data.Variants.length > 0) {
      const hasInvalidVariant = data.Variants.some(
        (variant) =>
          !variant.option_title ||
          !variant.option_type ||
          !variant.option_value ||
          variant.option_value.length === 0,
      );

      if (hasInvalidVariant) {
        return NextResponse.json(
          {
            success: false,
            message: "All variants must have title, type, and values",
          },
          { status: 400 },
        );
      }
    }

    // Update variant section using transaction
    const updatedSection = await Prisma.$transaction(async (tx) => {
      // Update the section name
      await tx.variantSection.update({
        where: { id: data.id },
        data: {
          name: data.name,
        },
      });

      // If variants are provided, update them
      if (data.Variants && data.Variants.length > 0) {
        // Delete existing variants
        await tx.variant.deleteMany({
          where: { sectionId: data.id },
        });

        // Create new variants
        await tx.variant.createMany({
          data: data.Variants.map((variant) => ({
            sectionId: data.id,
            product_id: existingSection.productsId,
            option_title: variant.option_title,
            option_type: variant.option_type,
            option_value: variant.option_value,
            optional: variant.optional ?? false,
          })),
        });
      }

      // Return updated section with variants
      return await tx.variantSection.findUnique({
        where: { id: data.id },
        include: {
          Variants: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Variant section updated successfully",
        data: updatedSection,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/products/variant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update variant section",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete variant section
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");

    // Validate ID parameter
    if (!idParam) {
      return NextResponse.json(
        { success: false, message: "Variant section ID is required" },
        { status: 400 },
      );
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid variant section ID" },
        { status: 400 },
      );
    }

    // Verify variant section exists
    const existingSection = await Prisma.variantSection.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, message: "Variant section not found" },
        { status: 404 },
      );
    }

    // Check if there are any stock values associated with this variant section
    const hasStockValues = await Prisma.stockvalue.count({
      where: {
        stock: {
          product: {
            Variantsection: {
              some: {
                id: id,
              },
            },
          },
        },
      },
    });

    if (hasStockValues > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete variant section: Stock values are associated with this section",
        },
        { status: 409 },
      );
    }

    // Delete variant section (cascade will delete variants)
    await Prisma.variantSection.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Variant section deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/products/variant error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete variant section",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
