"use server";

import { Stocktype, Varianttype } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import { revalidateTag } from "next/cache";

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

interface stocktype extends Stocktype {
  product_id: number;
}
export async function CreateStock(data: stocktype): Promise<Returntype> {
  try {
    const create = await Prisma.stock.create({
      data: {
        product_id: data.product_id,
        qty: data.qty,
        variant_val: data.variant_val,
      },
    });
    if (create) {
      return { success: true, data: { id: create.id } };
    }
    return { success: false, message: "Failed To Create" };
  } catch (error) {
    console.log("Stock", error);
    return { success: false };
  } finally {
    await Prisma.$disconnect();
  }
}

export async function Editstock(data: stocktype): Promise<Returntype> {
  try {
    await Prisma.stock.update({
      where: { id: data.id },
      data: {
        variant_val: data.variant_val,
        qty: data.qty,
      },
    });
    return { success: true, message: "Update Sucessfully" };
  } catch (error) {
    console.log("Stock", error);
    return { success: false, message: "Failed To Update" };
  } finally {
    await Prisma.$disconnect();
  }
}
export async function Deletestock(id: number): Promise<Returntype> {
  try {
    await Prisma.stock.delete({ where: { id } });
    return { success: true, message: "Delete Successfully" };
  } catch (error) {
    console.log("Stock", error);
    return { success: false, message: "Failed To Delete" };
  } finally {
    await Prisma.$disconnect();
  }
}

export const GetProductName = async (productname: string) => {
  const product = await Prisma.products.findMany({
    where: {
      name: {
        contains: productname,
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
