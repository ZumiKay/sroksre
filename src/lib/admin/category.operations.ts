import Prisma from "../prisma";
import { SubcategoriesState } from "../../context/GlobalContext";
import { Categorytype } from "../../app/api/categories/route";

export interface Categorydata {
  name: string;
  description: string;
  type?: Categorytype;
  subcategories: Array<SubcategoriesState>;
}

interface ReturnType {
  success: boolean;
  error?: string;
  id?: number;
}

export const createCategory = async (
  data: Categorydata,
): Promise<ReturnType> => {
  try {
    const isCate = await Prisma.parentcategories.findFirst({
      where: {
        name: data.name,
      },
    });

    if (isCate) {
      return { success: false, error: "Parent Category Already Exists" };
    } else {
      const create = await Prisma.parentcategories.create({
        data: {
          name: data.name,
          description: data.description,
          sub: {
            createMany: {
              data: data.subcategories.map((name) => name),
            },
          },
        },
      });

      if (create) {
        return { success: true, id: create.id };
      } else {
        return { success: false, error: "Failed to create category" };
      }
    }
  } catch (error) {
    console.error("Create Category", error);
    return { success: false, error: "An error occurred" };
  }
};

export interface updateCategoryData extends Categorydata {
  id: number;
  childid: number[];
}

export const updateCategory = async (data: updateCategoryData) => {
  try {
    const existingCategory = await Prisma.parentcategories.findUnique({
      where: {
        id: data.id,
      },
      include: {
        sub: true,
      },
    });

    if (!existingCategory) {
      return { success: false, error: "Category not found" };
    }

    if (
      existingCategory.name === data.name &&
      JSON.stringify(
        existingCategory.sub.map((child) => ({
          id: child.id,
          name: child.name,
          type: child.type,
          pid: child.pid,
        })),
      ) === JSON.stringify(data.subcategories)
    ) {
      return { success: true, message: "No changes detected" };
    }

    if (
      existingCategory.name !== data.name ||
      existingCategory.description !== data.description
    ) {
      const update = await Prisma.parentcategories.update({
        where: {
          id: data.id,
        },
        data: {
          name: data.name,
          description: data.description,
        },
      });

      if (!update) {
        return { success: false, error: "Failed to update category" };
      }
    }

    const childIds = data.subcategories
      .filter((child) => child.id)
      .map((child) => child.id);

    await Prisma.childcategories.deleteMany({
      where: {
        parentcategoriesId: data.id,
        id: { notIn: childIds as Array<number> },
      },
    });

    await Promise.all(
      data.subcategories.map((child) =>
        Prisma.childcategories.upsert({
          where: {
            id: child.id ?? 0,
          },
          update: {
            name: child.name,
            type: child.type,
            pid: child.pid,
          },
          create: {
            name: child.name,
            type: child.type,
            pid: child.pid,
            Parentcategories: {
              connect: {
                id: data.id,
              },
            },
          },
        }),
      ),
    );

    return { success: true };
  } catch (error) {
    console.error("Update Category", error);
    return { success: false, error: "Error Occurred" };
  }
};

export interface Deletecategorydata {
  id: number[];
}

export const deleteCategory = async (data: Deletecategorydata) => {
  try {
    const categories = await Prisma.parentcategories.findMany({
      where: {
        id: { in: data.id },
      },
      select: {
        id: true,
        type: true,
      },
    });

    await Prisma.$transaction(async (prisma) => {
      await Promise.all(
        categories.map((cate) =>
          cate.type === "normal"
            ? prisma.products.updateMany({
                where: {
                  parentcategory_id: cate.id,
                },
                data: {
                  parentcategory_id: null,
                },
              })
            : prisma.productcategory.deleteMany({
                where: {
                  autocategory_id: cate.id,
                },
              }),
        ),
      );

      await prisma.childcategories.deleteMany({
        where: {
          parentcategoriesId: { in: data.id },
        },
      });

      await prisma.parentcategories.deleteMany({
        where: {
          id: { in: data.id },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Delete Category", error);
    throw new Error("Error Occurred");
  }
};
