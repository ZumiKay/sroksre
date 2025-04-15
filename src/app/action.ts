"use server";

import { getServerSession } from "next-auth";
import Prisma from "../lib/prisma";
import { removeSpaceAndToLowerCase } from "../lib/utilities";
import { Usersessiontype } from "../context/GlobalType.type";
import { authConfig } from "./api/auth/[...nextauth]/route";

export type Homepagecontype = "banner" | "category" | "scrollcontainer";
export type Scrollcontainertype = "popular" | "latest" | "custom";

export const getSelectCategory = async (value: string) => {
  try {
    const category = await Prisma.parentcategories.findMany({
      where: {
        name: {
          contains: removeSpaceAndToLowerCase(value),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      success: true,
      data: category.map((i) => ({ label: i.name, value: i.id })),
    };
  } catch (error) {
    console.log("Get category for banner", error);
    return { success: false };
  }
};

export const getProductByCategory = async (
  value: string,
  parent_id: number,
  limit: number,
  child_id?: number
) => {
  try {
    const product = await Prisma.products.findMany({
      where: {
        parentcategory_id: parent_id,
        childcategory_id: child_id || undefined,
        name: {
          contains: removeSpaceAndToLowerCase(value),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
    });

    const data = product.map((i) => ({ label: i.name, value: i.id }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.log("Get product for banner", error);
    return { success: false };
  }
};

export const getUser = async (): Promise<Usersessiontype | null> => {
  const user = await getServerSession(authConfig);
  const result = user?.user as Usersessiontype | null;

  return result;
};
