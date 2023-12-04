"use server";

import { prisma } from "@/src/lib/userlib";

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
    await prisma.info.create({
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
    await prisma.banner.create({
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        image: data.image,
        promotion_id: 0,
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
export const createPromotion = async (data: promotiontype) => {
  try {
    await prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description,
        product_id: data.products_id,
        banner_id: data.bannerid,
      },
    });
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
export const editPromotion = async (data: promotiontype) => {};
