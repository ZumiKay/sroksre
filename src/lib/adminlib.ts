import { Role, hashedpassword } from "./userlib";

import {
  ProductInfo,
  ProductState,
  Stocktype,
  Varianttype,
  infovaluetype,
  userdata,
} from "../context/GlobalContext";
import {
  DeleteImageFromStorage,
  caculateArrayPagination,
  removeSpaceAndToLowerCase,
} from "./utilities";

import Prisma from "./prisma";

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
}; //
export interface updateCategoryData extends Categorydata {
  id: number;
  childid: number[];
}
export const updateCategory = async (
  data: updateCategoryData
): Promise<ReturnType> => {
  try {
    const update = await Prisma.parentcategories.update({
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
  }
};

export interface Deletecategorydata {
  id: number[];
}
export const deleteCategory = async (data: Deletecategorydata) => {
  try {
    const deletechild = Prisma.childcategories.deleteMany({
      where: {
        parentcategoriesId: { in: data.id },
      },
    });
    const deleteparent = Prisma.parentcategories.deleteMany({
      where: {
        id: { in: data.id },
      },
    });
    await Prisma.$transaction([deletechild, deleteparent]);

    return { success: true };
  } catch (error) {
    console.error("Delete Category", error);
    throw new Error("Error Occured");
  }
};
//
//
export const CreateProduct = async (
  data: ProductState
): Promise<ReturnType> => {
  try {
    const isProduct = await Prisma.products.findFirst({
      where: {
        name: data.name,
      },
    });
    if (!isProduct) {
      let relatedproduct = null;
      if (data.relatedproductid) {
        relatedproduct = await Prisma.producttype.create({
          data: {
            productId: data.relatedproductid as any,
          },
        });
      }
      const created = await Prisma.products.create({
        data: {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price.toString()),
          stock: parseInt(`${data.stock}`),
          stocktype: data.stocktype,
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
          relatedproductId: relatedproduct?.id,
        },
        include: {
          relatedproduct: true,
        },
      });

      if (data.relatedproductid) {
        await Prisma.producttype.update({
          where: { id: relatedproduct?.id },
          data: { productId: [created.id, ...data.relatedproductid] },
        });
        //update all related product
        await Prisma.products.updateMany({
          where: {
            id: { in: data.relatedproductid },
          },
          data: {
            relatedproductId: relatedproduct?.id,
          },
        });
      }

      if (!created) {
        return { success: false, error: "Failed To Create Product" };
      }

      //remove Image temp

      await Promise.all(
        data.covers.map((i) =>
          Prisma.tempimage.deleteMany({ where: { name: i.name } })
        )
      );

      //create product variant
      if (data.variants && data.variants?.length > 0) {
        await Promise.all(
          data.variants.map((i) =>
            Prisma.variant.create({
              data: {
                product_id: created.id,
                option_title: i.option_title,
                option_type: i.option_type,
                option_value: i.option_value,
              },
            })
          )
        );
      }
      //created product stock
      if (data.varaintstock && data.varaintstock.length > 0) {
        await Promise.all(
          data.varaintstock.map((i) =>
            Prisma.stock.create({
              data: {
                product_id: created.id,
                variant_val: i.variant_val,
                qty: i.qty,
              },
            })
          )
        );
      }

      return { success: true, error: "", id: created.id };
    } else {
      return { success: false, error: "Product Already Exist" };
    }
  } catch (error) {
    console.error("Create Product", error);
    return { success: false, error: "Error Occured" };
  }
};
export interface updateProductData extends ProductState {
  id: number;
  type?: "editsize" | "editstock" | "editvariantstock" | "editvariant";
}

const updateDetails = async (details: [] | ProductInfo[], id: number) => {
  try {
    // Delete Details
    const detailsToDelete = details
      .filter((i) => i.id)
      .map((i) => i.id) as number[];
    await Prisma.info.deleteMany({
      where: {
        AND: [{ product_id: id }, { id: { notIn: detailsToDelete } }],
      },
    });

    // Update or create new details
    await Promise.all(
      details.map(async (obj) => {
        if (obj.id) {
          return Prisma.info.update({
            where: { id: obj.id },
            data: {
              info_title: obj.info_title,
              info_value: obj.info_value as any,
            },
          });
        } else {
          return Prisma.info.create({
            data: {
              info_title: obj.info_title,
              info_type: obj.info_type,
              info_value: obj.info_value as any,
              product_id: id,
            },
          });
        }
      })
    );
    return true;
  } catch (error) {
    throw Error("Failed update product detail");
  }
};

const updateProductVariantStock = async (
  varaintstock: Stocktype[],
  id: number
) => {
  try {
    const stockIdsToDelete = varaintstock
      .filter((i) => i.id)
      .map((i) => i.id) as number[];
    await Prisma.stock.deleteMany({
      where: {
        AND: [{ product_id: id }, { id: { notIn: stockIdsToDelete } }],
      },
    });
    await Promise.all(
      varaintstock.map((stock) => {
        if (stock.id) {
          return Prisma.stock.update({
            where: {
              id: stock.id,
            },
            data: {
              variant_val: stock.variant_val,
              qty: stock.qty,
            },
          });
        } else {
          return Prisma.stock.create({
            data: {
              variant_val: stock.variant_val.map((i) => {
                if (i === null) {
                  return `${i}`;
                }
                return i;
              }),
              qty: stock.qty,
              product_id: id,
            },
          });
        }
      })
    );
    return true;
  } catch (error) {
    console.log("Edit Product", error);
    return null;
  }
};

const handleUpdateProductVariant = async (
  id: number,
  variants: Varianttype[]
) => {
  try {
    const variantIdsToDelete = variants
      .filter((i) => i.id)
      .map((i) => i.id) as number[];
    await Prisma.variant.deleteMany({
      where: {
        AND: [
          {
            id: { notIn: variantIdsToDelete },
          },
          { product_id: id },
        ],
      },
    });

    await Promise.all(
      variants.map((i) => {
        if (i.id) {
          return Prisma.variant.update({
            where: { id: i.id },
            data: {
              option_title: i.option_title,
              option_type: i.option_type,
              option_value: i.option_value,
            },
          });
        } else {
          return Prisma.variant.create({
            data: {
              product_id: id,
              option_title: i.option_title,
              option_type: i.option_type,
              option_value: i.option_value,
            },
          });
        }
      })
    );
    return true;
  } catch (error) {
    throw new Error("Failed to update variant");
  }
};

export const EditProduct = async (
  data: updateProductData
): Promise<ReturnType> => {
  try {
    const {
      id,
      name,
      description,
      price,
      stock,
      category,
      covers,
      details,
      variants,
      varaintstock,
      stocktype,
      type,
      relatedproductid,
    } = data;

    //update stocktype and detail of stock

    await Prisma.products.update({
      where: { id },
      data: {
        stock:
          stocktype === "variant" || stocktype === "size" ? null : undefined,
        stocktype,
        price: parseFloat(price.toString()),
      },
    });

    if (name || description) {
      await Prisma.products.update({
        where: { id },
        data: { name, description },
      });
    }

    if (type) {
      if (type === "editsize") {
        const response = await Prisma.products.findUnique({
          where: { id },
          select: {
            details: true,
          },
        });
        if (!response) {
          return { success: false };
        }

        const updatedetail = await updateDetails(details, id);
        if (updatedetail) {
          return { success: true };
        }
      } else if (
        type === "editvariantstock" &&
        varaintstock &&
        varaintstock.length !== 0
      ) {
        const updatestock = await updateProductVariantStock(varaintstock, id);
        if (updatestock) {
          return { success: true };
        }
      } else if (!varaintstock || varaintstock.length === 0) {
        await Prisma.stock.deleteMany({ where: { product_id: id } });
      } else {
        await Prisma.products.update({
          where: { id },
          data: {
            stock: stock,
          },
        });
        return { success: true };
      }
      return { success: false };
    }

    const isCategoryValid =
      Object.entries(category).length !== 0 &&
      category.parent_id !== 0 &&
      category.child_id !== 0;
    const isStockValid = stock && stock !== 0;

    if (isCategoryValid && isStockValid) {
      const updateData: any = {
        name,
        description,
        price: parseFloat(price.toString()),
      };

      if (isStockValid) {
        updateData.stock = parseInt(stock.toString(), 10);
      }

      if (isCategoryValid) {
        updateData.parentcategory_id = parseInt(
          category.parent_id.toString(),
          10
        );
        updateData.childcategory_id = parseInt(
          category.child_id.toString(),
          10
        );
      }

      await Prisma.products.update({
        where: { id },
        data: updateData,
      });
    }

    // Update existing covers
    if (covers && covers.length !== 0) {
      const existingCovers = covers.filter((i) => i.id);
      await Promise.all(
        existingCovers.map((i) =>
          Prisma.productcover.update({
            where: { id: i.id },
            data: { url: i.url, name: i.name, type: i.type },
          })
        )
      );

      // Create new covers
      const newCovers = covers.filter((i) => !i.id);
      await Promise.all(
        newCovers.map((i) =>
          Prisma.productcover.create({
            data: {
              productId: id,
              name: i.name,
              type: i.type,
              url: i.url,
              isSaved: true,
            },
          })
        )
      );
      await Promise.all(
        data.covers.map((i) =>
          Prisma.tempimage.deleteMany({ where: { name: i.name } })
        )
      );
    }

    //update details
    if (details && details.length !== 0) {
      await updateDetails(details, id);
    }

    //delete deleted variants andt stock

    // Update or create variants
    if (variants && variants?.length !== 0) {
      const updatevariant = await handleUpdateProductVariant(id, variants);
      if (!updatevariant) {
        return { success: false };
      }

      // Update or create stock variants
      if (varaintstock && varaintstock.length !== 0) {
        const updatestock = await updateProductVariantStock(varaintstock, id);

        if (!updatestock) {
          return { success: false };
        }
      } else {
        await Prisma.stock.deleteMany({ where: { product_id: id } });
      }
    } else {
      await Prisma.variant.deleteMany({ where: { product_id: id } });
    }
    if (relatedproductid) {
      if (relatedproductid.length === 0) {
        await Prisma.products.update({
          where: { id },
          data: {
            relatedproduct: {
              delete: {},
            },
          },
        });
      } else {
        const prevdata = await Prisma.products.findUnique({
          where: { id },
          select: { relatedproduct: true },
        });

        if (prevdata?.relatedproduct) {
          const ids = prevdata.relatedproduct?.productId as number[];

          const notinids = ids.filter((i) => !relatedproductid.includes(i));

          if (notinids.length > 0) {
            await Prisma.products.updateMany({
              where: { id: { in: notinids } },
              data: {
                relatedproductId: null,
              },
            });
          }
        }
        const updaterelated = await Prisma.products.update({
          where: { id },
          data: {
            relatedproduct: {
              upsert: {
                create: { productId: relatedproductid },
                update: { productId: relatedproductid },
              },
            },
          },
          include: {
            relatedproduct: true,
          },
        });
        //update related product
        await Prisma.products.updateMany({
          where: {
            id: { in: relatedproductid },
          },
          data: { relatedproductId: updaterelated.relatedproduct?.id },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Edit Product", error);
    return { success: false, error: "Failed To Update Product" };
  }
};

export const DeleteProduct = async (id: number) => {
  try {
    const Products = await Prisma.products.findUnique({
      where: { id: id },
      select: {
        covers: true,
        Variant: true,
        Stock: true,
        relatedproduct: true,
        relatedproductId: true,
      },
    });
    if (!Products) {
      return false;
    }

    if (Products.covers.length > 0) {
      await Promise.all(
        Products.covers.map((i) => DeleteImageFromStorage(i.name))
      );
      await Prisma.productcover.deleteMany({ where: { productId: id } });
      await Promise.all(
        Products.covers.map((i) =>
          Prisma.tempimage.deleteMany({ where: { name: i.name } })
        )
      );
    }
    if (Products.Variant.length !== 0) {
      await Prisma.variant.deleteMany({ where: { product_id: id } });
    }
    if (Products.Stock.length !== 0) {
      await Prisma.stock.deleteMany({ where: { product_id: id } });
    }
    await Prisma.info.deleteMany({ where: { product_id: id } });

    await Prisma.orderproduct.deleteMany({ where: { productId: id } });

    if (Products.relatedproductId && Products.relatedproduct) {
      let currentid = Products.relatedproduct.productId as number[];
      currentid = currentid.filter((i) => i !== id);

      if (currentid.length !== 0) {
        await Prisma.producttype.update({
          where: { id: Products.relatedproductId },
          data: { productId: currentid },
        });
      } else {
        await Prisma.producttype.delete({
          where: { id: Products.relatedproductId },
        });
      }
    }

    await Prisma.products.delete({ where: { id: id } });

    return true;
  } catch (error) {
    console.log("Delete Product", error);
    throw new Error("Failed To Delete");
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
  detailsize?: string,
  detailtext?: string
): Promise<GetProductReturnType> => {
  try {
    let totalproduct: number = 0;

    let filteroptions = {};
    let allproduct: any = [];
    let lowstock = 0;

    if (!promotionid) {
      if (ty === "all") {
        let totallowstock = 0;
        const allproduct = await Prisma.products.findMany({
          select: { details: true, stock: true, Stock: true, stocktype: true },
        });
        totalproduct = allproduct.length;
        allproduct.forEach((product) => {
          const isStock = product.stocktype === "stock";
          const isVariant = product.stocktype === "variant";

          if (isStock) {
            totallowstock += product.stock && product.stock <= 1 ? 1 : 0;
          } else if (isVariant) {
            product.Stock.forEach((variant) => {
              totallowstock += variant.qty <= 1 ? 1 : 0;
            });
          } else {
            const sizeDetails =
              product.details &&
              (product?.details?.find((detail) => detail.info_type === "SIZE")
                ?.info_value as any[]);
            sizeDetails?.forEach((size) => {
              totallowstock += size.qty <= 1 ? 1 : 0;
            });
          }
        });

        lowstock = totallowstock;

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
        };
        totalproduct = await Prisma.products.count({
          where: {
            ...filteroptions,
          },
        });
      }

      if (ty === "filter" || ty === "all") {
        let products = await Prisma.products.findMany({
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
            stock: true,
            discount: true,
            Stock: true,
            stocktype: true,
            details: true,
          },

          orderBy: {
            price: priceorder === 1 ? "asc" : "desc",
          },
        });

        if (sk && sk === "Low") {
          products = products.filter((item) => {
            const isLowStockVariant =
              item.Stock && item.Stock.some((i) => i.qty <= 1);
            const isLowStock = item.stock && item.stock <= 1;

            return isLowStockVariant || isLowStock;
          });
        }

        products = products.map((i) => {
          const isLowStock = i.stock && i.stock <= 1;
          const isLowStockVariant = i.Stock && i.Stock.some((j) => j.qty <= 1);
          const isSize = i.details.find((j) => j.info_type === "SIZE")
            ?.info_value as unknown as infovaluetype[];
          const isLowStockSize = isSize && isSize.some((j) => j.qty <= 1);

          if (isLowStock || isLowStockVariant || isLowStockSize) {
            return { ...i, lowstock: true };
          }
          return i;
        });

        totalproduct = products.length;

        allproduct = caculateArrayPagination(products, page, limit);
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
        const texts =
          detailtext && detailtext.includes(",")
            ? detailtext.split(",")
            : [detailtext];

        let product = await Prisma.products.findMany({
          where: {
            parentcategory_id: parent_cate ?? undefined,
            childcategory_id: child_cate ?? undefined,
          },
          include: {
            details: true,
            Variant: true,
            covers: true,
          },
        });

        const filteredproduct = product.filter((i) => {
          const color = i.Variant.find((j) => j.option_type === "COLOR");
          const text = i.Variant.find((j) => j.option_type === "TEXT");
          const size = i.details.find((j) => j.info_type === "SIZE") as any;

          if (color || size) {
            const productColors = color?.option_value
              .filter((k) => k !== "")
              .map((l) => {
                return l.replace("#", "");
              });
            const productSize = size?.info_value.map((l: string) => {
              return removeSpaceAndToLowerCase(l);
            });
            const otherFilter = text?.option_value.map((l) => {
              return removeSpaceAndToLowerCase(l);
            });

            const hasSelectedColor =
              colors &&
              colors?.some((item) => productColors?.includes(item as string));

            const hasSelectedSize =
              sizes &&
              sizes?.some((item) => productSize?.includes(item as string));
            const hasSeletecFilter =
              otherFilter &&
              texts?.some((item) => otherFilter.includes(item as string));
            return hasSelectedColor || hasSelectedSize || hasSeletecFilter;
          }
          return false;
        });
        totalproduct = filteredproduct.length;

        allproduct = caculateArrayPagination(filteredproduct, page, limit);
      }
    } else {
      let product = await Prisma.products.findMany({
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

      const filterproduct =
        promotionid === -1
          ? product.filter((i) => i.promotion_id === null)
          : product.filter(
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
            percent: i.discount,
            newPrice: (
              parseFloat(i.price.toString()) -
              (parseFloat(i.price.toString()) * i.discount) / 100
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
    const products = await Prisma.products.findMany({
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
    const isExist = await Prisma.promotion.findFirst({
      where: {
        name: data.name,
      },
    });
    if (isExist) {
      return { success: false, error: "Promotion Already Existed" };
    } else {
      const create = await Prisma.promotion.create({
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
  }
};
export const EditPromotion = async (
  data: PromotionData
): Promise<ReturnType> => {
  try {
    const update = await Prisma.promotion.update({
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
    await Prisma.promotion.delete({ where: { id: id } });
    return { success: true };
  } catch (error) {
    console.error("Delete Promotion", error);
    return { success: false, error: "Delete Promotion Failed" };
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
  const createdAdmin = await Prisma.user.create({
    data: {
      firstname: data.firstname as string,
      lastname: data.lastname,
      password: hashedpassword(data.password as string),
      email: data.email as string,
      role: "ADMIN",
    },
  });

  if (createdAdmin) {
    return true;
  } else {
    return null;
  }
};
