"use server";

import Prisma from "@/src/lib/prisma";

export enum infotype {
  COLOR = "COLOR",
  TEXT = "TEXT",
  SELECT = "SELECT",
}
export type info = {
  title: string;
  type: infotype;
  value: string;
  product_id: number;
};
export const createProductInfo = async (data: info) => {
  try {
    await Prisma.info.create({
      data: {
        info_title: data.title,
        info_value: data.value,
        product_id: data.product_id,
        info_type: data.type,
      },
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
export type bannerType = {
  name: string;
  type: string;
  color: string;
  image: string;
};
export const createBanner = async (data: bannerType) => {
  try {
    await Prisma.banner.create({
      data: {
        name: data.name,
        type: data.type,
        image: data.image,
      },
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
type promotiontype = {
  name: string;
  description: string | undefined;
  bannerid: number | undefined;
  products_id: number[];
};

export const editPromotion = async (data: promotiontype) => {};
