import Prisma from "../prisma";
import {
  DeleteImageFromStorage,
  caculateArrayPagination,
  removeSpaceAndToLowerCase,
} from "../utilities";
import { DeleteImageTempForCurrentUser } from "../../app/api/products/cover/helper/Cleanup";
import {
  ProductInfo,
  ProductState,
  StockTypeEnum,
  VariantSectionType,
  VariantValueObjType,
} from "../../types/product.type";
import { handleUpdateProductVariant } from "./variant.operations";
import { updateProductVariantStock } from "./stock.operations";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReturnType {
  success: boolean;
  error?: string;
  id?: number;
}

export interface updateProductData extends ProductState {
  id: number;
  type?:
    | "editsize"
    | "editstock"
    | "editvariantstock"
    | "editvariant"
    | "updateVariantSection";
  sectionId?: number;
}

type GetProductReturnType = {
  success: boolean;
  data?: any;
  total?: number;
  lowstock?: number;
  totalfilter?: number;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const updateDetails = async (details: [] | ProductInfo[], id: number) => {
  try {
    if (!details?.length) return true;

    const detailsToUpdate: ProductInfo[] = [];
    const detailsToCreate: ProductInfo[] = [];
    const existingDetailIds: number[] = [];

    details.forEach((detail) => {
      if (detail.id) {
        existingDetailIds.push(detail.id);
        detailsToUpdate.push(detail);
      } else {
        detailsToCreate.push(detail);
      }
    });

    await Prisma.$transaction(async (tx) => {
      if (existingDetailIds.length > 0) {
        await tx.info.deleteMany({
          where: {
            product_id: id,
            id: { notIn: existingDetailIds },
          },
        });
      }

      if (detailsToUpdate.length > 0) {
        await Promise.all(
          detailsToUpdate.map((detail) =>
            tx.info.update({
              where: { id: detail.id },
              data: {
                info_title: detail.info_title,
                info_value: detail.info_value as any,
              },
            }),
          ),
        );
      }

      if (detailsToCreate.length > 0) {
        await tx.info.createMany({
          data: detailsToCreate.map((detail) => ({
            info_title: detail.info_title,
            info_type: detail.info_type,
            info_value: detail.info_value as any,
            product_id: id,
          })),
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Failed to update product details:", error);
    throw new Error("Failed to update product details");
  }
};

const handleUpdateVariantSection = async (
  data: updateProductData,
): Promise<ReturnType> => {
  const {
    id: sectionId,
    productsId: productId,
    name: sectionName,
    Variants: sectionVariants,
    varaintId,
  } = data as unknown as VariantSectionType;

  if (!sectionVariants || !sectionName) {
    return { success: false, error: "Missing Required" };
  }

  // Create mode
  if (!sectionId) {
    const created = await Prisma.variantSection.create({
      data: { name: sectionName, productsId: productId },
    });
    await Prisma.variant.updateMany({
      where: { id: { in: sectionVariants.map((i) => i.id) as number[] } },
      data: { sectionId: created.id },
    });
    return { success: true, id: created.id };
  }

  const existingSection = await Prisma.variantSection.findUnique({
    where: { id: sectionId },
  });
  if (!existingSection) {
    return { success: false, error: "Variant section not found" };
  }

  // Remove a single variant from the section
  if (varaintId) {
    await Prisma.variant.update({
      where: { id: varaintId },
      data: { sectionId: null },
    });
    return { success: true };
  }

  const variantIds = sectionVariants.map((i) => i.id) as number[];
  await Prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.variant.updateMany({
        where: { sectionId, id: { notIn: variantIds } },
        data: { sectionId: null },
      }),
      tx.variant.updateMany({
        where: { sectionId: null, id: { in: variantIds } },
        data: { sectionId },
      }),
      tx.variantSection.update({
        where: { id: sectionId },
        data: { name: sectionName },
      }),
    ]);
  });

  return { success: true };
};

const handleRelatedProductsUpdate = async (
  id: number,
  relatedproductid: number[],
  existingRelatedProduct: { productId: unknown } | null,
): Promise<void> => {
  if (relatedproductid.length === 0) {
    if (existingRelatedProduct) {
      await Prisma.products.update({
        where: { id },
        data: { relatedproduct: { delete: {} } },
      });
    }
    return;
  }

  if (existingRelatedProduct) {
    const currentIds = existingRelatedProduct.productId as number[];
    const removedIds = currentIds.filter(
      (pid) => !relatedproductid.includes(pid),
    );
    if (removedIds.length > 0) {
      await Prisma.products.updateMany({
        where: { id: { in: removedIds } },
        data: { relatedproductId: null },
      });
    }
  }

  const updatedProduct = await Prisma.products.update({
    where: { id },
    data: {
      relatedproduct: {
        upsert: {
          create: { productId: relatedproductid },
          update: { productId: relatedproductid },
        },
      },
    },
    include: { relatedproduct: true },
  });

  if (updatedProduct.relatedproduct) {
    await Prisma.products.updateMany({
      where: { id: { in: relatedproductid } },
      data: { relatedproductId: updatedProduct.relatedproduct.id },
    });
  }
};

const mapWithDiscount = (products: any[]): any[] =>
  products.map((i) => ({
    ...i,
    ...(i.discount && {
      discount: {
        percent: i.discount,
        newprice: (
          parseFloat(i.price.toString()) -
          (parseFloat(i.price.toString()) * i.discount) / 100
        ).toFixed(2),
      },
    }),
  }));

// ─── Exported operations ──────────────────────────────────────────────────────

export const CreateProduct = async (
  data: ProductState,
): Promise<ReturnType> => {
  if (
    !data.name ||
    !data.category.parent_id ||
    !data.stocktype ||
    !data.description ||
    data.covers.length === 0
  ) {
    return { success: false, error: "Missing Information" };
  }

  try {
    const existing = await Prisma.products.findFirst({
      where: { name: data.name },
    });
    if (existing) {
      return { success: false, error: "Product Already Exist" };
    }

    const result = await Prisma.$transaction(async (tx) => {
      let relatedproduct = null;
      if (data.relatedproductid) {
        relatedproduct = await tx.producttype.create({
          data: { productId: data.relatedproductid as any },
        });
      }

      const created = await tx.products.create({
        data: {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price.toString()),
          stock: parseInt(`${data.stock}`),
          stocktype: data.stocktype,
          parentcategory_id: data.category.parent_id,
          childcategory_id: data.category?.child_id,
          covers: {
            createMany: {
              data: data.covers.map((i) => ({
                url: i.url,
                name: i.name,
                type: i.type,
              })),
            },
          },
          details: { createMany: { data: data.details as any } },
          relatedproductId: relatedproduct?.id,
        },
        include: { relatedproduct: true },
      });

      if (!created) throw new Error("Failed To Create Product");

      if (data.relatedproductid) {
        await tx.producttype.update({
          where: { id: relatedproduct?.id },
          data: { productId: [created.id, ...data.relatedproductid] },
        });
        await tx.products.updateMany({
          where: { id: { in: data.relatedproductid } },
          data: { relatedproductId: relatedproduct?.id },
        });
      }

      if (data.Variantsection?.length) {
        await Promise.all(
          data.Variantsection.map((section) =>
            tx.variantSection.create({
              data: {
                name: section.name,
                productsId: created.id,
                Variants: {
                  createMany: {
                    data: data.Variant?.filter(
                      (variant) => variant.sectionId === section.tempId,
                    ).map((i) => ({
                      option_title: i.option_title,
                      option_type: i.option_type,
                      option_value: i.option_value,
                      optional: i.optional,
                      product_id: created.id,
                      price: i.price,
                      qty: i.qty,
                    })) as never,
                  },
                },
              },
            }),
          ),
        );
      }

      const unsectionedVariants = data.Variant?.filter((v) => !v.sectionId);
      if (unsectionedVariants?.length) {
        await Promise.all(
          unsectionedVariants.map((i) =>
            tx.variant.create({
              data: {
                product_id: created.id,
                option_title: i.option_title,
                option_type: i.option_type,
                option_value: i.option_value,
                price: i.price,
                qty: i.qty,
                optional: i.optional,
              },
            }),
          ),
        );
      }

      if (data.Stock?.length) {
        await Promise.all(
          data.Stock.map((i) =>
            tx.stock.create({
              data: {
                product_id: created.id,
                Stockvalue: {
                  createMany: {
                    data: i.Stockvalue.map((sv) => ({
                      qty: sv.qty ?? 0,
                      variant_val: sv.variant_val,
                    })),
                  },
                },
              },
            }),
          ),
        );
      }

      return created;
    });

    const isDel = await DeleteImageTempForCurrentUser();
    if (!isDel?.success) {
      throw new Error(isDel?.error);
    }

    return { success: true, error: "", id: result.id };
  } catch (error) {
    console.error("Create Product", error);
    return { success: false, error: "Error Occured" };
  }
};

export const EditProduct = async (
  data: updateProductData,
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
      Variant,
      Stock,
      stocktype,
      type,
      relatedproductid,
    } = data;

    if (type) {
      switch (type) {
        case "editvariantstock": {
          if (!Stock || Stock.length === 0) {
            await Prisma.stock.deleteMany({ where: { product_id: id } });
            return { success: true };
          }
          const stockUpdated = await updateProductVariantStock(Stock, id);
          return stockUpdated
            ? { success: true }
            : { success: false, error: "Failed to update stock" };
        }

        case "editvariant": {
          if (!Variant) {
            return { success: false, error: "Variant data is required" };
          }
          const variantUpdated = await handleUpdateProductVariant(id, Variant);
          return variantUpdated.success
            ? variantUpdated
            : { success: false, error: "Failed to update variant" };
        }

        case "updateVariantSection":
          return handleUpdateVariantSection(data);

        default: {
          if (stock !== undefined) {
            await Prisma.products.update({ where: { id }, data: { stock } });
            return { success: true };
          }
          return { success: false, error: "Invalid update type" };
        }
      }
    }

    const existProduct = await Prisma.products.findUnique({
      where: { id },
      include: { relatedproduct: relatedproductid !== undefined },
    });

    if (!existProduct) {
      return { success: false, error: "Product not found" };
    }

    await Prisma.$transaction(async (tx) => {
      const productUpdates: any = {};

      if (stocktype !== undefined && existProduct.stocktype !== stocktype) {
        productUpdates.stocktype = stocktype;
        productUpdates.stock =
          stocktype === StockTypeEnum.variants ? null : existProduct.stock;
      }
      if (price !== undefined && existProduct.price !== price) {
        productUpdates.price = parseFloat(price.toString());
      }
      if (name && existProduct.name !== name) {
        productUpdates.name = name;
      }
      if (description && existProduct.description !== description) {
        productUpdates.description = description;
      }
      if (stock !== undefined && stock !== existProduct.stock) {
        productUpdates.stock = parseInt(stock.toString());
      }
      if (category) {
        if (
          category.parent_id &&
          existProduct.parentcategory_id !== category.parent_id
        ) {
          productUpdates.parentcategory_id = category.parent_id;
        }
        if (
          category.child_id &&
          existProduct.childcategory_id !== category.child_id
        ) {
          productUpdates.childcategory_id = category.child_id;
        }
      }

      if (Object.keys(productUpdates).length > 0) {
        await tx.products.update({ where: { id }, data: productUpdates });
      }

      if (covers?.length) {
        const existingCovers = covers.filter((c) => c.id);
        const newCovers = covers.filter((c) => !c.id);
        await Promise.all([
          ...existingCovers.map((cover) =>
            tx.productcover.update({
              where: { id: cover.id },
              data: { url: cover.url, name: cover.name, type: cover.type },
            }),
          ),
          ...(newCovers.length > 0
            ? [
                tx.productcover.createMany({
                  data: newCovers.map((cover) => ({
                    productId: id,
                    name: cover.name,
                    type: cover.type,
                    url: cover.url,
                  })),
                }),
              ]
            : []),
        ]);
      }
    });

    //Clean up methods after operations
    const postTransactionOps: Promise<any>[] = [];

    if (covers?.length) {
      postTransactionOps.push(DeleteImageTempForCurrentUser());
    }
    if (details?.length) {
      postTransactionOps.push(updateDetails(details, id));
    }

    if (Variant?.length) {
      postTransactionOps.push(
        handleUpdateProductVariant(id, Variant).then(async (variantUpdated) => {
          if (!variantUpdated) throw new Error("Failed to update variants");
          if (Stock?.length) {
            const stockUpdated = await updateProductVariantStock(Stock, id);
            if (!stockUpdated)
              throw new Error("Failed to update variant stock");
          } else {
            await Prisma.stock.deleteMany({ where: { product_id: id } });
          }
        }),
      );
    } else if (Variant !== undefined) {
      postTransactionOps.push(
        Prisma.variant.deleteMany({ where: { product_id: id } }).then(() => {}),
      );
    }

    if (relatedproductid !== undefined) {
      postTransactionOps.push(
        handleRelatedProductsUpdate(
          id,
          relatedproductid,
          (existProduct as any).relatedproduct ?? null,
        ),
      );
    }

    if (postTransactionOps.length > 0) {
      await Promise.all(postTransactionOps);
    }

    return { success: true };
  } catch (error) {
    console.error("Edit Product", error);
    return { success: false, error: "Failed To Update Product" };
  }
};

export const DeleteProduct = async (id: number) => {
  try {
    const product = await Prisma.products.findUnique({
      where: { id },
      select: {
        covers: { select: { name: true } },
        Stock: { select: { id: true } },
        relatedproduct: { select: { productId: true } },
        relatedproductId: true,
      },
    });

    if (!product) return false;

    if (product.covers.length > 0) {
      await Promise.all(
        product.covers.map((cover) => DeleteImageFromStorage(cover.name)),
      );
    }

    await Prisma.$transaction(async (tx) => {
      const deleteOps: Promise<any>[] = [
        tx.variant.deleteMany({ where: { product_id: id } }),
        tx.productcover.deleteMany({ where: { productId: id } }),
        tx.info.deleteMany({ where: { product_id: id } }),
        tx.orderproduct.deleteMany({ where: { productId: id } }),
        tx.containeritems.deleteMany({ where: { product_id: id } }),
        ...product.covers.map((cover) =>
          tx.tempimage.deleteMany({ where: { name: cover.name } }),
        ),
      ];

      if (product.Stock.length > 0) {
        const stockIds = product.Stock.map((s) => s.id);
        deleteOps.push(
          tx.stockvalue.deleteMany({ where: { stockId: { in: stockIds } } }),
          tx.stock.deleteMany({ where: { product_id: id } }),
        );
      }

      await Promise.all(deleteOps);

      if (product.relatedproductId && product.relatedproduct) {
        const remainingIds = (
          product.relatedproduct.productId as number[]
        ).filter((pid) => pid !== id);

        if (remainingIds.length > 0) {
          await tx.producttype.update({
            where: { id: product.relatedproductId },
            data: { productId: remainingIds },
          });
        } else {
          await tx.producttype.delete({
            where: { id: product.relatedproductId },
          });
        }
      }

      await tx.products.delete({ where: { id } });
    });

    return true;
  } catch (error) {
    console.error("Delete Product", error);
    throw new Error("Failed To Delete");
  }
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
  detailtext?: string,
  selectpromo?: number,
  promotionids?: string,
): Promise<GetProductReturnType> => {
  try {
    let totalproduct: number = 0;
    let allproduct: any = [];
    let lowstock = 0;

    if (!promotionid || promotionid === -1) {
      if (ty === "filter" || ty === "all") {
        let products = await Prisma.products.findMany({
          where: {
            ...(!promotionids && selectpromo === 1
              ? { promotion_id: null }
              : {}),
            ...(promotionids
              ? {
                  promotion: {
                    id:
                      promotionids.length > 1
                        ? {
                            in: promotionids
                              .split(",")
                              .map((i) => parseInt(i, 10)),
                          }
                        : { equals: parseInt(promotionids, 10) },
                  },
                }
              : {}),
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
            stocktype: true,
            details: true,
            parentcategory_id: true,
            childcategory_id: true,
            promotion_id: true,
            promotion: true,
          },
          orderBy: {
            price: priceorder === 1 ? "asc" : "desc",
          },
        });

        products = products
          .filter((prod) => {
            const isName =
              query &&
              removeSpaceAndToLowerCase(prod.name).includes(
                removeSpaceAndToLowerCase(query),
              );

            const isPid = parent_cate && prod.parentcategory_id === parent_cate;
            const isChildId =
              child_cate && prod.childcategory_id === child_cate;

            const isLowStock =
              sk && sk === "Low" && prod.Stock
                ? prod.Stock.some((stock) =>
                    stock.Stockvalue.some((i) => i.qty <= 5),
                  )
                : prod.stock
                  ? prod.stock <= 5
                  : false;

            const conditions = [
              query ? isName : true,
              parent_cate ? isPid : true,
              child_cate ? isChildId : true,
              sk ? isLowStock : true,
            ];

            return conditions.every((i) => i);
          })
          .map((prod) => {
            let isLowStock = false;
            if (prod.Stock && prod.Stock.length > 0) {
              isLowStock = prod.Stock.some((stock) =>
                stock.Stockvalue.some((sub) => sub.qty <= 5),
              );
            } else if (prod.stock !== null && prod.stock !== undefined) {
              isLowStock = prod.stock <= 5;
            }
            return { ...prod, lowstock: isLowStock };
          });

        lowstock = products.filter((p) => (p as any).lowstock).length;
        totalproduct = products.length;
        allproduct = caculateArrayPagination(products, page, limit);
      } else if (ty === "detail") {
        const colors =
          detailcolor && detailcolor.includes(",")
            ? detailcolor?.split(",")
            : [detailcolor];
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

          if (color) {
            const opt_val = color?.option_value as
              | string[]
              | VariantValueObjType[];
            const productColors = opt_val
              .filter((k: any) => k.val !== "")
              .map((l: any) => {
                return l.val.replace("#", "");
              });

            const text_value = text?.option_value as string[];
            const otherFilter = text_value?.map((l) => {
              return removeSpaceAndToLowerCase(l);
            });

            const hasSelectedColor =
              colors &&
              colors?.some((item) => productColors?.includes(item as string));

            const hasSeletecFilter =
              otherFilter &&
              texts?.some((item) => otherFilter.includes(item as string));
            return hasSelectedColor || hasSeletecFilter;
          }
          return false;
        });

        totalproduct = filteredproduct.length;
        allproduct = caculateArrayPagination(filteredproduct, page, limit);
      }
    } else {
      let product = await Prisma.products.findMany({
        where: {
          ...(promotionid !== -1
            ? { OR: [{ promotion_id: null }, { promotion_id: promotionid }] }
            : {}),
          ...(promotionids ? { promotion_id: parseInt(promotionids, 10) } : {}),
        },
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
        orderBy: {
          id: "asc",
        },
      });

      totalproduct = product.length;
      allproduct = caculateArrayPagination(product, page, limit);
    }

    return {
      success: true,
      data: mapWithDiscount(allproduct),
      lowstock: lowstock,
      total: Math.ceil(totalproduct / limit),
      totalfilter: totalproduct,
    };
  } catch (error) {
    console.error("Get Allproduct", error);
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
