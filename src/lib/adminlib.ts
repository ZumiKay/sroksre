import { Role, hashedpassword } from "./userlib";
import prisma from "./prisma";
import {
  ProductState,
  infovaluetype,
  userdata,
} from "../context/GlobalContext";
import {
  DeleteImageFromStorage,
  caculateArrayPagination,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "./utilities";

import { Info, Productcover, Products } from "@prisma/client";

//
//
//Products Operations
//
//
//
//

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
  data: Categorydata
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
    await prisma.$disconnect();
  }
}; //
export interface updateCategoryData extends Categorydata {
  id: number;
  childid: number[];
}
export const updateCategory = async (
  data: updateCategoryData
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

    if (!update) {
      return { success: false };
    }

    const childIds = data.subcategories
      .filter((child) => child.id)
      .map((child) => child.id);

    await prisma.childcategories.deleteMany({
      where: {
        parentcategoriesId: data.id,
        id: { notIn: childIds as Array<number> },
      },
    });

    await Promise.all(
      data.subcategories.map((child) =>
        prisma.childcategories.upsert({
          where: {
            id: child.id ?? 0,
          },
          update: {
            name: child.name,
          },
          create: {
            name: child.name,
            Parentcategories: {
              connect: {
                id: data.id,
              },
            },
          },
        })
      )
    );

    return { success: true };
  } catch (error) {
    console.error("Update Category", error);
    return { success: false, error: "Error Occurred" };
  } finally {
    await prisma.$disconnect();
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
    await prisma.$disconnect();
  }
};
//
//
export const CreateProduct = async (
  data: ProductState
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
              data: data.details as any,
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
    await prisma.$disconnect();
  }
};
export interface updateProductData extends ProductState {
  id: number;
}

export const EditProduct = async (
  data: updateProductData
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
          })
        )
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
          })
        )
      ));

    //delete Details
    await prisma.info.deleteMany({
      where: {
        AND: [
          {
            product_id: data.id,
          },
          {
            id: {
              notIn: data.details
                .filter((i) => i.id)
                .map((i) => i.id) as number[],
            },
          },
        ],
      },
    });

    await Promise.all(
      data.details.map(async (obj) => {
        if (obj.id) {
          return prisma.info.update({
            where: { id: obj.id },
            data: {
              info_title: obj.info_title,
              info_value: obj.info_value as any,
            },
          });
        } else {
          return prisma.info.create({
            data: {
              info_title: obj.info_title,
              info_type: obj.info_type,
              info_value: obj.info_value as any,
              product_id: data.id,
            },
          });
        }
      })
    );

    return { success: true };
  } catch (error) {
    console.error("Edit Product", error);
    return { success: false, error: "Faild To Update Product" };
  } finally {
    await prisma.$disconnect();
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
    return true;
  } catch (error) {
    console.log("Delete Product", error);
    throw new Error("Failed To Delete");
  } finally {
    await prisma.$disconnect();
  }
};

type GetProductReturnType = {
  success: boolean;
  data?: any;
  total?: number;
  lowstock?: number;
  totalfilter?: number;
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
  priceorder?: number,
  detailcolor?: string,
  detailsize?: string
): Promise<GetProductReturnType> => {
  try {
    let totalproduct: number = 0;

    let filteroptions = {};
    let allproduct: any = [];

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
      if (ty === "filter" || ty === "all") {
        const { startIndex, endIndex } = calculatePagination(
          totalproduct,
          limit,
          page
        );
        const products = await prisma.products.findMany({
          where: {
            ...filteroptions,
          },
          select: {
            id: true,
            name: true,
            covers: {
              orderBy: {
                id: "asc",
              },
            },
            price: true,
            discount: true,
          },

          take: endIndex - startIndex + 1,
          skip: startIndex,
          orderBy: {
            price: priceorder === 1 ? "asc" : "desc",
          },
        });

        allproduct = products;
      } else if (ty === "detail") {
        //filter list product based on color and size
        const colors =
          detailcolor && detailcolor.includes(",")
            ? detailcolor?.split(",")
            : [detailcolor];
        const sizes =
          detailsize && detailsize.includes(",")
            ? detailsize?.split(",")
            : [detailsize];
        let product = await prisma.products.findMany({
          where: {
            parentcategory_id: parent_cate ?? undefined,
            childcategory_id: child_cate ?? undefined,
          },
          include: {
            details: true,
            covers: true,
          },
        });

        const filteredproduct = product.filter((i) => {
          const color = i.details.find((j) => j.info_type === "COLOR") as any;
          const size = i.details.find((j) => j.info_type === "SIZE") as any;

          if (color || size) {
            const productColors = color?.info_value
              .filter((k: infovaluetype) => k.val !== "")
              .map((l: infovaluetype) => {
                return l.val.replace("#", "");
              });
            const productSize = size?.info_value.map((l: string) => {
              return removeSpaceAndToLowerCase(l);
            });

            const hasSelectedColor =
              colors &&
              colors?.some((item) => productColors?.includes(item as string));

            const hasSelectedSize =
              sizes &&
              sizes?.some((item) => productSize?.includes(item as string));
            return hasSelectedColor || hasSelectedSize;
          }
          return false;
        });
        totalproduct = filteredproduct.length;

        allproduct = caculateArrayPagination(filteredproduct, page, limit);
      }
    } else {
      let product = await prisma.products.findMany({
        select: {
          id: true,
          discount: true,
          price: true,
          name: true,
          covers: {
            orderBy: {
              id: "asc",
            },
          },
          promotion_id: true,
        },
      });

      const filterproduct = product.filter(
        (i) => i.promotion_id === promotionid || i.promotion_id === null
      );

      totalproduct = filterproduct.length;
      allproduct = caculateArrayPagination(filterproduct, page, limit);
    }

    const result = allproduct.map((i: any) => {
      return {
        ...i,

        ...(i.discount && {
          discount: {
            percent: parseFloat(i.discount.toString()) * 100,
            newPrice: (
              parseFloat(i.price.toString()) -
              (parseFloat(i.price.toString()) *
                parseFloat(i.discount.toString())) /
                100
            ).toFixed(2),
          },
        }),
      };
    });

    return {
      success: true,
      data: result || [],
      lowstock: lowstock,
      total: Math.ceil(totalproduct / limit),
      totalfilter: totalproduct,
    };
  } catch (error) {
    console.log("Get Allproduct", error);
    return { success: false };
  } finally {
    await prisma.$disconnect();
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
    await prisma.$disconnect();
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
  data: PromotionData
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
    await prisma.$disconnect();
  }
};
export const EditPromotion = async (
  data: PromotionData
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
  } finally {
    await prisma.$disconnect();
  }
};
export const DeletePromotion = async (id: number): Promise<ReturnType> => {
  try {
    await prisma.promotion.delete({ where: { id: id } });
    return { success: true };
  } catch (error) {
    console.error("Delete Promotion", error);
    return { success: false, error: "Delete Promotion Failed" };
  } finally {
    await prisma.$disconnect();
  }
};

export interface admindata {
  firstname: string;
  lastname: string;
  password: string;
  email: string;
  role: Role;
}

export const Createadmin = async (data: userdata) => {
  const createdAdmin = await prisma.user.create({
    data: {
      firstname: data.firstname as string,
      lastname: data.lastname,
      password: hashedpassword(data.password as string),
      email: data.email as string,
      role: "ADMIN",
    },
  });
  await prisma.$disconnect();
  if (createdAdmin) {
    return true;
  } else {
    return null;
  }
};
