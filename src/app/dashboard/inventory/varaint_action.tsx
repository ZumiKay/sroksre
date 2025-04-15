"use server";

import { InventoryPage } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { getUser } from "../../action";

export interface InventoryParamType {
  ty?: InventoryPage;
  p?: string;
  limit?: string;
  parentcate?: string;
  childcate?: string;
  status?: string;
  promoids?: string;
  pid?: string;
  expired?: string;
  promotiononly?: string;
  expiredate?: string;
  search?: string;
  promoselect?: "banner" | "product";
}

export const GetRelatedProduct = async (ids: number[]) => {
  const relatedProd = await Prisma.products.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      name: true,
      parentcategory_id: true,
      childcategory_id: true,
      covers: {
        select: {
          url: true,
        },
      },
    },
  });

  return { success: true, data: relatedProd };
};

export const DeleteTempImage = async () => {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, message: "Unauthenticated" };
    }

    const images = await Prisma.tempimage.findMany({
      where: { user_id: user.id },
    });

    if (images.length !== 0) {
      //Delete Temp Image
    }
    return { success: true, message: "Delete Successfully" };
  } catch (error) {
    console.log("Delete Temp Image", error);
    return { success: false, message: "Failed To Delete" };
  }
};
