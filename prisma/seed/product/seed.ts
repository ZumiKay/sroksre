/**
 * Seed database with categories and products
 */

import Prisma from "@/src/lib/prisma";
import { createRandomNormalStockProduct, getDefaultCategories } from "./index";

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

  // Generate product data
  const products = createRandomNormalStockProduct({ count });

  let createdCount = 0;

  // Create products in database
  for (const productData of products) {
    // Randomly select a category
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const randomSubcategory =
      randomCategory.subcategories[
        Math.floor(Math.random() * randomCategory.subcategories.length)
      ];

    try {
      const product = await Prisma.products.create({
        data: {
          name: productData.name,
          price: productData.price,
          description: productData.description,
          stocktype: productData.stocktype,
          stock: productData.stock,
          parentcategory_id: randomCategory.parent.id,
          childcategory_id: randomSubcategory.id,
          amount_sold: productData.amount_sold,
          amount_incart: productData.amount_incart,
          amount_wishlist: productData.amount_wishlist,
          covers: {
            create: productData.covers.map((cover, idx) => ({
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

      createdCount++;
      console.log(
        `  ✅ Created product: ${product.name} (${randomCategory.parent.name} > ${randomSubcategory.name})`,
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
