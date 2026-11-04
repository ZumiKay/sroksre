import {
  PrepareDataForPromotion,
  PrepareDataForPromotionType,
} from "./helper";
import Prisma from "@/src/lib/prisma";
import { createProductInDb, seedCategories } from "../product/seed";

/** Seeds promotions, each with new normal-stock products at a discount. */
export const createPromotion = async (seedData: PrepareDataForPromotionType) => {
  const categories = await seedCategories();
  const pickCategory = () => {
    const withSubs = categories.filter((c) => c.subcategories.length > 0);
    const cat = withSubs[Math.floor(Math.random() * withSubs.length)];
    if (!cat) throw new Error("No categories with subcategories to use");
    const sub = cat.subcategories[Math.floor(Math.random() * cat.subcategories.length)];
    return { parentId: cat.parent.id, childId: sub.id };
  };

  let created = 0;
  for (const promo of PrepareDataForPromotion(seedData)) {
    // The admin form refuses duplicate names, so re-running the seed skips them.
    const exists = await Prisma.promotion.findFirst({
      where: { name: promo.name },
      select: { id: true },
    });
    if (exists) {
      console.log(`  ℹ️  Promotion already exists: ${promo.name}`);
      continue;
    }

    const promotion = await Prisma.promotion.create({
      data: {
        name: promo.name,
        description: promo.description,
        expireAt: promo.expireAt,
      },
    });

    for (const product of promo.products) {
      const { parentId, childId } = pickCategory();
      const saved = await createProductInDb(product, parentId, childId);
      await Prisma.products.update({
        where: { id: saved.id },
        data: { promotion_id: promotion.id, discount: promo.discount },
      });
    }

    created++;
    console.log(
      `  ✅ ${promo.name}: ${promo.products.length} products at ${promo.discount}% off`,
    );
  }

  console.log(`✅ Promotions seeded: ${created}/${seedData.count}\n`);
};
