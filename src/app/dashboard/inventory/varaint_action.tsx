"use server";

import { FilterValue, Varianttype } from "@/src/context/GlobalContext";
import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import {
  DeleteImageFromStorage,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import dayjs from "dayjs";
import { revalidateTag } from "next/cache";

const INVENTORYENUM = {
  SIZE: "SIZE",
  NORMAL: "NORMAL",
  COLOR: "COLOR",
  TEXT: "TEXT",
};
export type InventoryType = keyof typeof INVENTORYENUM;
interface Returntype {
  success: boolean;
  message?: string;
  data?: any;
}
interface createdata extends Varianttype {
  product_id?: number;
}
export async function CreateVvaraint(data: createdata): Promise<Returntype> {
  try {
    const isExist = await Prisma.variant.findFirst({
      where: {
        option_title: data.option_title,
      },
    });
    if (isExist) {
      return { success: false, message: "Variant Exist" };
    }

    const create = await Prisma.variant.create({
      data: {
        option_title: data.option_title,
        option_type: data.option_type,
        option_value: data.option_value,
      },
    });
    return { success: true, data: create.id };
  } catch (error) {
    console.log("Variant", error);
    return { success: false };
  } finally {
    await Prisma.$disconnect();
  }
}

export async function Updatevaraint(data: createdata): Promise<Returntype> {
  try {
    const updated = await Prisma.variant.update({
      where: { id: data.id },
      data: {
        option_title: data.option_title,
        option_type: data.option_type,
        option_value: data.option_value,
      },
    });
    if (updated) {
      revalidateTag("variant");
      return { success: true, message: "Variant Update Successfully" };
    }
    return { success: false };
  } catch (error) {
    console.log("Varaint", error);
    return { success: false };
  } finally {
    await Prisma.$disconnect();
  }
}

export async function Deletevairiant(id: number): Promise<Returntype> {
  try {
    await Prisma.variant.delete({ where: { id } });

    return { success: true, message: "Delete Successfully" };
  } catch (error) {
    console.log("Variant", error);
    return { success: false };
  }
}

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

export const getTotalOfItems = async (
  ty: string,
  filtervalue?: FilterValue
) => {
  if (!ty) {
    return { success: false, message: "Invalid request" };
  }

  let expiredpromo = 0;

  try {
    let result = 0;

    if (ty === "product") {
      const products = await Prisma.products.findMany({
        where: {},
        select: {
          name: true,
          parentcategory_id: true,
          childcategory_id: true,
          promotion_id: true,
          promotion: true,
        },
      });

      result = products.filter((i) => {
        const isName =
          filtervalue?.name &&
          removeSpaceAndToLowerCase(i.name).includes(
            removeSpaceAndToLowerCase(filtervalue.name)
          );

        const isPid =
          filtervalue?.parentcate &&
          i.parentcategory_id === filtervalue.parentcate;
        const isChildId =
          filtervalue?.childcate &&
          i.childcategory_id === filtervalue.childcate;

        const isPromo =
          filtervalue?.promoselect && filtervalue.promotionid
            ? i.promotion_id === null ||
              i.promotion_id === filtervalue.promotionid
            : i.promotion_id === null;

        const conditions = [
          filtervalue?.parentcate ? isPid : true,
          filtervalue?.childcate ? isChildId : true,
          filtervalue?.name ? isName : true,
          filtervalue?.promoselect ? isPromo : true,
        ];

        return conditions.every((condition) => condition);
      }).length;
      if (filtervalue?.status) {
        let product = await Prisma.products.findMany({
          where: {},
          select: {
            stock: true,
            stocktype: true,
            Stock: {
              select: {
                id: true,
                Stockvalue: {
                  select: {
                    id: true,
                    qty: true,
                  },
                },
              },
            },
            details: true,
          },
        });

        product = product.filter((prod) => {
          const isVariant =
            prod.stocktype === "variant" &&
            prod.Stock.some((i) => i.Stockvalue.some(({ qty }) => qty <= 5));

          const isStock = prod.stock && prod.stock <= 3;
          return isVariant || isStock;
        });
        result = product.length;
      }
    } else if (ty === "banner") {
      result = await Prisma.banner.count({
        where: filtervalue?.name ? { name: filtervalue?.name } : {},
      });
    } else if (ty === "promotion") {
      let potentialresult = await Prisma.promotion.findMany({
        where:
          filtervalue?.name || filtervalue?.expiredate
            ? {
                OR: [
                  {
                    name: filtervalue.name,
                  },
                  {
                    expireAt: {
                      gte: new Date(
                        filtervalue.expiredate as unknown as string
                      ),
                    },
                  },
                ],
              }
            : {},
      });

      let filterdresult = potentialresult.filter((i) => {
        const promoexpire = dayjs(i.expireAt);
        const filterdate = filtervalue?.expiredate
          ? dayjs(filtervalue.expiredate)
          : dayjs(new Date());

        return (
          promoexpire.diff(filterdate, "day") < 1 ||
          promoexpire.isSame(filterdate)
        );
      });

      filtervalue?.expiredate
        ? (result = filterdresult.length)
        : (result = potentialresult.length);
      expiredpromo = filterdresult.length;
    }

    return { success: true, result, expiredpromo };
  } catch (error) {
    console.log("Count Items", error);
    return { success: false, message: "Error Occured" };
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
}

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
      await Promise.all(images.map((i) => DeleteImageFromStorage(i.name)));
    }
    return { success: true, message: "Delete Successfully" };
  } catch (error) {
    console.log("Delete Temp Image", error);
    return { success: false, message: "Failed To Delete" };
  }
};
