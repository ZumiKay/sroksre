"use server";

import { SelectType } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";

interface returnType {
  success: boolean;
  isLimit?: boolean;
  data?: Array<SelectType>;
}

const BannerType = {
  normal: "normal",
  product: "product",
  category: "category",
};

export type BannerType = keyof typeof BannerType;

const getDataForBanner = async (
  limit: number,
  value: string,
  model: any
): Promise<returnType> => {
  try {
    const data = await model.findMany({
      where: {
        name: {
          contains: removeSpaceAndToLowerCase(value),
          mode: "insensitive",
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
      },
    });

    return {
      success: true,
      isLimit: data.length <= limit,
      data: data.map((item: any) => ({ label: item.name, value: item.id })),
    };
  } catch (error) {
    console.log(`Get data for banner error:`, error);
    return { success: false };
  }
};

export const getProductForBanner = (limit: number, value: string) => {
  return getDataForBanner(limit, value, Prisma.products);
};

export const getPromotionForBanner = (limit: number, value: string) => {
  return getDataForBanner(limit, value, Prisma.promotion);
};

export const getParentCategoryForBanner = async (
  value: string
): Promise<returnType> => {
  try {
    const data = await Prisma.parentcategories.findMany({
      where: {
        name: {
          contains: removeSpaceAndToLowerCase(value),
          mode: "insensitive",
        },
      },
      select: { id: true, name: true },
    });

    return {
      success: true,
      isLimit: true,
      data: data.map((item) => ({ label: item.name, value: item.id })),
    };
  } catch (error) {
    console.log("Category", error);
    return { success: false };
  }
};

export const getChildCategoryForBanner = async (
  value: string,
  pid: number
): Promise<returnType> => {
  try {
    const data = await Prisma.parentcategories.findUnique({
      where: {
        id: pid,
        sub: {
          some: {
            name: {
              contains: removeSpaceAndToLowerCase(value),
              mode: "insensitive",
            },
          },
        },
      },
      select: {
        sub: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      data: data?.sub.map((i) => ({ label: i.name, value: i.id })),
      isLimit: true,
    };
  } catch (error) {
    console.log("Category", error);
    return { success: false };
  }
};
