"use server";

import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import {
  DeleteImageFromStorage,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";

const INVENTORYENUM = {
  SIZE: "SIZE",
  NORMAL: "NORMAL",
  COLOR: "COLOR",
  TEXT: "TEXT",
};
export type InventoryType = keyof typeof INVENTORYENUM;

export const GetProductName = async (productname: string) => {
  const product = await Prisma.products.findMany({
    where: {
      name: {
        contains: removeSpaceAndToLowerCase(productname),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (product.length === 0) {
    return { success: true, data: [] };
  }

  return { success: true, data: product };
};

export const getSubCategories = async (pid: number) => {
  if (!pid) {
    return { success: false };
  }
  try {
    const subcates = await Prisma.childcategories.findMany({
      where: {
        parentcategoriesId: pid,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return { success: true, data: subcates };
  } catch (error) {
    console.log("Sub categories", error);
    return { success: false };
  }
};

export interface InventoryParamType {
  ty?: string;
  p?: string;
  limit?: string;
  status?: string;
  name?: string;
  parentcate?: string;
  childcate?: string;
  expiredate?: string;
  pid?: string;
  promoselect?: "banner" | "product";
  bannertype?: string;
  bannersize?: string;
  search?: string;
  expired?: string;
  promoids?: string;
}

export const DeleteTempImage = async () => {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, message: "Unauthenticated" };
    }

    const images = await Prisma.tempimage.findMany({
      where: { user_id: user.userId },
    });

    if (images.length !== 0) {
      await Promise.all(images.map((i) => DeleteImageFromStorage(i.name)));
    }
    return { success: true, message: "Delete Successfully" };
  } catch (error) {
    console.log("Delete Temp Image", error);
    return { success: false, message: "Failed To Delete" };
  }
};
