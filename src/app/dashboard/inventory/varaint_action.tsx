"use server";

import {
  FilterValueType,
  InventoryPage,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { getUser } from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import {
  DeleteImageFromStorage,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import dayjs from "dayjs";
import { revalidateTag } from "next/cache";

interface Returntype {
  success: boolean;
  message?: string;
  data?: unknown;
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

export interface InventoryParamType extends FilterValueType {
  ty?: InventoryPage;
  p?: string;
  limit?: string;
  parentcate?: string;
  childcate?: string;
  status?: string;
  promoids?: string;
  pid?: string;
  promoselect?: "banner" | "product";
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
