/**
 * Seed database with categories and products
 */

import Prisma from "@/src/lib/prisma";
import {
  createRandomNormalStockProduct,
  createVariantStockProduct,
  createVariantStockWithPriceQtyProduct,
  createVariantWithSectionProduct,
  createVariantWithSectionPriceQtyProduct,
  getDefaultCategories,
} from "./index";
import { ProductState } from "@/src/types/product.type";

/**
 * Write a single ProductState record (with all relations) to the database.
 * Handles all 5 stock flavours: normal, variant, variant+price/qty,
 * variant+section, and variant+section+price/qty.
 */
async function createProductInDb(
  productData: ProductState,
  parentCategoryId: number,
  childCategoryId: number,
): Promise<{ id: number; name: string }> {
  const product = await Prisma.products.create({
    data: {
      name: productData.name,
      price: productData.price,
      description: productData.description,
      stocktype: productData.stocktype,
      stock: productData.stock ?? null,
      parentcategory_id: parentCategoryId,
      childcategory_id: childCategoryId,
      amount_sold: productData.amount_sold,
      amount_incart: productData.amount_incart,
      amount_wishlist: productData.amount_wishlist,
      covers: {
        create: productData.covers.map((cover) => ({
          url: cover.url,
          name: cover.name,
          type: cover.type,
        })),
      },
      details: {
        create: productData.details.map(
          (detail) =>
            ({
              info_title: detail.info_title,
              info_value: detail.info_value,
              info_type: detail.info_type,
            }) as never,
        ),
      },
    },
  });

  // Variant sections — each section carries its own Variants list.
  if (productData.Variantsection?.length) {
    await Promise.all(
      productData.Variantsection.map((section) =>
        Prisma.variantSection.create({
          data: {
            name: section.name,
            productsId: product.id,
            Variants: {
              createMany: {
                data: (section.Variants ?? []).map((v) => ({
                  option_title: v.option_title,
                  option_type: v.option_type,
                  option_value: v.option_value as never,
                  optional: v.optional ?? false,
                  product_id: product.id,
                  price: v.price ?? null,
                  qty: v.qty ?? null,
                })),
              },
            },
          },
        }),
      ),
    );
  }

  // Standalone variants (not belonging to any section).
  const standalone = (productData.Variant ?? []).filter((v) => !v.sectionId);
  if (standalone.length > 0) {
    await Prisma.variant.createMany({
      data: standalone.map((v) => ({
        product_id: product.id,
        option_title: v.option_title,
        option_type: v.option_type,
        option_value: v.option_value as never,
        optional: v.optional ?? false,
        price: v.price ?? null,
        qty: v.qty ?? null,
      })),
    });
  }

  // Stock entries with per-combination Stockvalue rows.
  if (productData.Stock?.length) {
    await Promise.all(
      productData.Stock.map((stock) =>
        Prisma.stock.create({
          data: {
            product_id: product.id,
            Stockvalue: {
              createMany: {
                data: stock.Stockvalue.map((sv) => ({
                  qty: sv.qty ?? 0,
                  variant_val: sv.variant_val as never,
                })),
              },
            },
          },
        }),
      ),
    );
  }

  return { id: product.id, name: product.name };
}

/**
 * Seed categories into the database
 */
export async function seedCategories() {
  console.log("🌱 Seeding categories...");

  const { parentCategories } = getDefaultCategories();

  const createdCategories = [];

  for (const parentCat of parentCategories) {
    // Check if parent category already exists
    let parent = await Prisma.parentcategories.findFirst({
      where: { name: parentCat.name },
    });

    if (!parent) {
      // Create parent category
      parent = await Prisma.parentcategories.create({
        data: {
          name: parentCat.name,
          description: parentCat.description,
          type: "normal",
        },
      });
      console.log(`  ✅ Created parent category: ${parent.name}`);
    } else {
      console.log(`  ℹ️  Parent category already exists: ${parent.name}`);
    }

    // Create subcategories
    const subcategories = [];
    for (const subCatName of parentCat.subcategories) {
      let subCat = await Prisma.childcategories.findFirst({
        where: {
          name: subCatName,
          parentcategoriesId: parent.id,
        },
      });

      if (!subCat) {
        subCat = await Prisma.childcategories.create({
          data: {
            name: subCatName,
            type: "normal",
            parentcategoriesId: parent.id,
          },
        });
        console.log(`    ➕ Created subcategory: ${subCat.name}`);
      }

      subcategories.push(subCat);
    }

    createdCategories.push({
      parent,
      subcategories,
    });
  }

  console.log(
    `✅ Categories seeded: ${createdCategories.length} parent categories\n`,
  );

  return createdCategories;
}

/**
 * Seed products into the database
 */
export async function seedProducts(
  count: number = 20,
  categories?: Array<{
    parent: { id: number; name: string };
    subcategories: Array<{ id: number; name: string }>;
  }>,
) {
  console.log(`🌱 Seeding ${count} products...`);

  // If no categories provided, fetch them
  if (!categories || categories.length === 0) {
    const parentCategories = await Prisma.parentcategories.findMany({
      include: {
        sub: true,
      },
    });

    categories = parentCategories.map((parent) => ({
      parent: { id: parent.id, name: parent.name },
      subcategories: parent.sub.map((sub) => ({ id: sub.id, name: sub.name })),
    }));
  }

  if (categories.length === 0) {
    throw new Error("No categories found. Please seed categories first.");
  }

  // Cycle through all 5 product types for even coverage.
  const TYPE_LABELS = [
    "Normal Stock",
    "Variant Stock",
    "Variant + Price & Qty",
    "Variant + Section",
    "Variant + Section (Price & Qty)",
  ] as const;

  const generators = [
    () => createRandomNormalStockProduct({ count: 1 })[0],
    () => createVariantStockProduct({ count: 1 })[0],
    () => createVariantStockWithPriceQtyProduct({ count: 1 })[0],
    () => createVariantWithSectionProduct({ count: 1 })[0],
    () => createVariantWithSectionPriceQtyProduct({ count: 1 })[0],
  ];

  let createdCount = 0;

  for (let i = 0; i < count; i++) {
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const randomSubcategory =
      randomCategory.subcategories[
        Math.floor(Math.random() * randomCategory.subcategories.length)
      ];

    const typeIndex = i % generators.length;
    const productData = generators[typeIndex]();

    try {
      const created = await createProductInDb(
        productData,
        randomCategory.parent.id,
        randomSubcategory.id,
      );
      createdCount++;
      console.log(
        `  ✅ [${TYPE_LABELS[typeIndex]}] ${created.name} (${randomCategory.parent.name} > ${randomSubcategory.name})`,
      );
    } catch (error) {
      console.error(
        `  ❌ Failed to create product: ${productData.name}`,
        error,
      );
    }
  }

  console.log(`✅ Products seeded: ${createdCount}/${count}\n`);

  return createdCount;
}

/**
 * Main seed function
 */
export async function seedAll(productCount: number = 20) {
  console.log("🚀 Starting database seeding...\n");

  try {
    // Seed categories first
    const categories = await seedCategories();

    // Seed products with the created categories
    await seedProducts(productCount, categories);

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
