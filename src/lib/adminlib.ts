import { Role } from "./userlib";
import prisma from "./prisma";
import { ProductState } from "../context/GlobalContext";
import {
  DeleteImageFromStorage,
  caculateArrayPagination,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "./utilities";
import { decode } from "punycode";

export const adminRoutes: string[] = ["adminRoutes"];
export const isAdmin = async (id: number) => {
  const admin = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (admin && admin.role === Role.ADMIN) {
    return true;
  } else {
    return false;
  }
};

//
//
//Products Operations
//
//
//
//
const hasProperties = (array: { [key: string]: any }[]): boolean => {
  // Check if every object in the array has at least one property
  return array.every((obj) => Object.keys(obj).length > 0);
};

export interface Categorydata {
  name: string;
  subcategories: {
    id?: number;
    name: string;
  }[];
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
    const isCate = await prisma.parentcategories.findFirst({
      where: {
        name: data.name,
      },
    });

    if (isCate) {
      return { success: false, error: "Parent Category Already Exists" };
    } else {
      const create = await prisma.parentcategories.create({
        data: {
          name: data.name,
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
  } finally {
    prisma.$disconnect();
  }
}; //
export interface updateCategoryData extends Categorydata {
  id: number;
  childid: number[];
}
export const updateCategory = async (
  data: updateCategoryData,
): Promise<ReturnType> => {
  try {
    const update = await prisma.parentcategories.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
      },
    });
    const updateChildren = await Promise.all(
      data.subcategories.map(async (child) => {
        if (child.id) {
          return prisma.childcategories.update({
            where: {
              id: child.id,
            },
            data: {
              name: child.name,
            },
          });
        } else {
          return prisma.childcategories.create({
            data: { name: child.name, parentcategoriesId: data.id },
          });
        }
      }),
    );
    if (update && updateChildren) {
      return { success: true };
    } else {
      return { success: false, error: "Failed To Update" };
    }
  } catch (error) {
    console.error("Update Category", error);
    return { success: false, error: "Error Occured" };
  } finally {
    prisma.$disconnect();
  }
};

export interface Deletecategorydata {
  id: number[];
}
export const deleteCategory = async (data: Deletecategorydata) => {
  try {
    const deletechild = prisma.childcategories.deleteMany({
      where: {
        parentcategoriesId: { in: data.id },
      },
    });
    const deleteparent = prisma.parentcategories.deleteMany({
      where: {
        id: { in: data.id },
      },
    });
    await prisma.$transaction([deletechild, deleteparent]);

    return { success: true };
  } catch (error) {
    console.error("Delete Category", error);
    throw new Error("Error Occured");
  } finally {
    prisma.$disconnect();
  }
};
//
//
export const CreateProduct = async (
  data: ProductState,
): Promise<ReturnType> => {
  try {
    const isProduct = await prisma.products.findFirst({
      where: {
        name: data.name,
      },
    });
    if (!isProduct) {
      const created = await prisma.products.create({
        data: {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price.toString()).toFixed(2),
          stock: parseInt(data.stock.toString()),
          parentcategory_id: parseInt(data.category.parent_id.toString()),
          childcategory_id: parseInt(data.category.child_id.toString()),
          covers: {
            createMany: {
              data: data.covers.map((i) => ({
                url: i.url,
                name: i.name,
                type: i.type,
              })),
            },
          },
          details: {
            createMany: {
              data: data.details,
            },
          },
        },
      });
      if (created) {
        return { success: true, error: "", id: created.id };
      } else {
        return { success: false, error: "Failed To Create Product" };
      }
    } else {
      return { success: false, error: "Product Already Exist" };
    }
  } catch (error) {
    console.error("Create Product", error);
    return { success: false, error: "Error Occured" };
  } finally {
    prisma.$disconnect();
  }
};
export interface updateProductData extends ProductState {
  id: number;
}

export const EditProduct = async (
  data: updateProductData,
): Promise<ReturnType> => {
  try {
    await prisma.products.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price.toString()).toFixed(2),
        stock: parseInt(data.stock.toString()),
        parentcategory_id: parseInt(data.category.parent_id.toString()),
        childcategory_id: parseInt(data.category.child_id.toString()),
      },
    });

    const isCoverid = data.covers.filter((i) => i.id);
    const isNotCoverid = data.covers.filter((i) => !i.id);

    isCoverid.length > 0 &&
      (await Promise.all(
        isCoverid.map((i) =>
          prisma.productcover.update({
            where: {
              id: i.id,
            },
            data: {
              url: i.url,
              name: i.name,
              type: i.type,
            },
          }),
        ),
      ));
    isNotCoverid.length > 0 &&
      (await Promise.all(
        isNotCoverid.map((i) =>
          prisma.productcover.create({
            data: {
              productId: data.id,
              name: i.name,
              type: i.type,
              url: i.url,
              isSaved: true,
            },
          }),
        ),
      ));

    await Promise.all(
      data.details.map((obj) =>
        prisma.info.update({
          where: { id: obj.id },
          data: { ...obj },
        }),
      ),
    );
    return { success: true };
  } catch (error) {
    console.error("Edit Product", error);
    return { success: false, error: "Faild To Update Product" };
  } finally {
    prisma.$disconnect();
  }
};
export const DeleteProduct = async (id: number) => {
  try {
    const covers = await prisma.productcover.findMany({
      where: { productId: id },
    });
    if (covers.length > 0) {
      await Promise.all(covers.map((i) => DeleteImageFromStorage(i.name)));
      await prisma.productcover.deleteMany({ where: { productId: id } });
    }
    await prisma.info.deleteMany({ where: { product_id: id } });
    await prisma.products.delete({ where: { id: id } });
    return null;
  } catch (error) {
    console.log("Delete Product", error);
    throw new Error("Failed To Delete");
  } finally {
    prisma.$disconnect();
  }
};

type GetProductReturnType = {
  success: boolean;
  data?: any;
  total?: number;
  lowstock?: number;
};
export const GetAllProduct = async (
  limit: number,
  ty: string,
  page: number,
  query?: string,
  parent_cate?: number,
  sk?: string,
  child_cate?: number,
  promotionid?: number,
): Promise<GetProductReturnType> => {
  try {
    let totalproduct: number = 0;
    let filteroptions = {};
    let allproduct: Array<any> = [];

    const lowstock = await prisma.products.count({
      where: {
        stock: {
          lte: 1,
        },
      },
    });
    if (!promotionid) {
      if (ty === "all") {
        totalproduct = await prisma.products.count();
        filteroptions = {};
      } else if (ty === "filter") {
        const namequery = decodeURIComponent(query ?? "")
          .toString()
          .toLowerCase();
        filteroptions = {
          name: query
            ? {
                contains: namequery,
                mode: "insensitive",
              }
            : undefined,
          parentcategory_id: parent_cate ?? undefined,
          childcategory_id: child_cate ?? undefined,
          stock:
            sk && sk === "Low"
              ? {
                  lte: 1,
                }
              : {},
        };
        totalproduct = await prisma.products.count({
          where: {
            ...filteroptions,
          },
        });
      }
      const { startIndex, endIndex } = calculatePagination(
        totalproduct,
        limit,
        ty === "filter" ? 1 : page,
      );
      allproduct = await prisma.products.findMany({
        where: {
          ...filteroptions,
        },
        include: {
          details: {
            orderBy: {
              id: "asc",
            },
          },
          covers: {
            orderBy: {
              id: "asc",
            },
          },
        },
        take: endIndex - startIndex + 1,
        skip: startIndex,
      });
    } else {
      let product = await prisma.products.findMany({
        include: {
          details: {
            orderBy: {
              id: "asc",
            },
          },
          covers: {
            orderBy: { id: "asc" },
          },
        },
      });

      const filterproduct = product.filter(
        (i) => i.promotion_id === promotionid || i.promotion_id === null,
      );

      totalproduct = filterproduct.length;
      allproduct = caculateArrayPagination(filterproduct, page, limit);
    }

    const result = allproduct.map((i) => {
      if (i.discount) {
        const price = parseFloat(i.price.toString());
        const discount = parseFloat(i.discount.toString()) * 100;

        return {
          ...i,
          discount: {
            percent: discount,
            newPrice: (price - (price * discount) / 100).toFixed(2),
          },
        };
      }
      return { ...i };
    });

    return {
      success: true,
      data: result || [],
      lowstock: lowstock,
      total: Math.ceil(totalproduct / limit),
    };
  } catch (error) {
    console.log("Get Allproduct", error);
    return { success: false };
  } finally {
    prisma.$disconnect();
  }
};
export const GetProductByCategory = async ({
  limit,
  skip,
  category,
}: {
  limit: number;
  skip: number;
  category: { parent: number; child: number };
}): Promise<GetProductReturnType> => {
  try {
    const products = await prisma.products.findMany({
      where: {
        parentcategory_id: category.parent,
        childcategory_id: category.child,
      },
      skip: skip,
      take: limit,
      include: {
        details: true,
        covers: true,
      },
    });
    return { success: true, data: products };
  } catch (error) {
    console.error("GetProductByCategory", error);
    return { success: false };
  } finally {
    prisma.$disconnect();
  }
};

//
//
//
//Promotion Operations
//
//
//
interface PromotionData {
  id?: number;
  name: string;
  description?: string;
  products: {
    id: number;
    discount: number;
  }[];
  banner_id?: number;
  expireAt: Date;
}
export const CreatePromotion = async (
  data: PromotionData,
): Promise<ReturnType> => {
  try {
    const isExist = await prisma.promotion.findFirst({
      where: {
        name: data.name,
      },
    });
    if (isExist) {
      return { success: false, error: "Promotion Already Existed" };
    } else {
      const create = await prisma.promotion.create({
        data: {
          name: data.name,
          description: data.description,
          banner_id: data.banner_id,
          expireAt: data.expireAt,
        },
      });
      if (create) {
        return { success: true };
      } else {
        return { success: false };
      }
    }
  } catch (error) {
    console.log("Create Promotion", error);
    return { success: false, error: "Create Promotion Saved" };
  } finally {
    prisma.$disconnect();
  }
};
export const EditPromotion = async (
  data: PromotionData,
): Promise<ReturnType> => {
  try {
    const update = await prisma.promotion.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        description: data.description,
        banner_id: data.banner_id,
        expireAt: data.expireAt,
      },
    });
    if (update) {
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    return { success: false, error: "Edit Promotion Failed" };
  }
};
export const DeletePromotion = async (id: number): Promise<ReturnType> => {
  try {
    await prisma.promotion.delete({ where: { id: id } });
    return { success: true };
  } catch (error) {
    console.error("Delete Promotion", error);
    return { success: false, error: "Delete Promotion Failed" };
  }
};
