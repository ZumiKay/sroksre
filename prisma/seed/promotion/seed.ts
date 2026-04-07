import { PrepareDataForPromotion, PrepareDataForPromotionType } from "./helper";
import Prisma from "@/src/lib/prisma";
import { Products, Promotion } from "@/prisma/generated/prisma/client";

/**Seed Promotion with standard stock type products */
export const createPromotion = async (
  seedData: PrepareDataForPromotionType,
) => {
  try {
    const preparedPromotions = PrepareDataForPromotion(seedData);

    //save to DB

    const createOpearations: Array<Promise<any>> = preparedPromotions.map(
      (item) =>
        Prisma.promotion.create({
          data: {
            ...item,
            Products: {
              createMany: {
                data: item.Products as unknown as Array<Products>,
              },
            },
          } as unknown as Promotion,
        }),
    );

    await Promise.all(createOpearations);
    console.log(`Seeded Promotion for ${seedData.count}`);
  } catch (error) {
    console.log("Create promotion", error);
    throw error;
  }
};
