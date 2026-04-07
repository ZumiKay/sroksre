"use server";

import Prisma from "@/src/lib/prisma";

export const GetChildCategoriesByPromotionId = async (promoid: number) => {
  const isCategories = await Prisma.childcategories.findFirst({
    where: {
      pid: promoid,
    },
    select: {
      id: true,
      parentcategoriesId: true,
    },
  });

  if (!isCategories) return null;

  return isCategories;
};
