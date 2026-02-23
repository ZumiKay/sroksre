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
import { JsonArray } from "@/prisma/generated/prisma/internal/prismaNamespace";

interface ReturnType {
  success: boolean;
  error?: string;
  id?: number;
}

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
    console.log("Failed to update product details:", error);
    throw new Error("Failed to update product details");
  }
};

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
    const isProduct = await Prisma.products.findFirst({
      where: {
        name: data.name,
      },
    });

    if (!isProduct) {
      const result = await Prisma.$transaction(async (tx) => {
        let relatedproduct = null;
        if (data.relatedproductid) {
          relatedproduct = await tx.producttype.create({
            data: {
              productId: data.relatedproductid as any,
            },
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
          await tx.producttype.update({
            where: { id: relatedproduct?.id },
            data: { productId: [created.id, ...data.relatedproductid] },
          });

          await tx.products.updateMany({
            where: {
              id: { in: data.relatedproductid },
            },
            data: {
              relatedproductId: relatedproduct?.id,
            },
          });
        }

        if (!created) {
          throw new Error("Failed To Create Product");
        }

        if (data.Variantsection && data.Variantsection.length > 0) {
          await Promise.all(
            data.Variantsection.map((section) =>
              tx.variantSection.create({
                data: {
                  name: section.name,
                  productsId: created.id,
                  Variants: {
                    createMany: {
                      data: data.Variant?.filter(
                        (V) => V.sectionId === section.id,
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

        if (data.Variant && data.Variant?.length > 0) {
          await Promise.all(
            data.Variant.filter((v) => !v.sectionId).map((i) =>
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

        if (data.Stock && data.Stock.length > 0) {
          await Promise.all(
            data.Stock.map((i) =>
              tx.stock.create({
                data: {
                  product_id: created.id,
                  Stockvalue: {
                    createMany: {
                      data: i.Stockvalue.map((i) => ({
                        qty: i.qty ?? 0,
                        variant_val: i.variant_val,
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
    } else {
      return { success: false, error: "Product Already Exist" };
    }
  } catch (error) {
    console.log("Create Product", error);
    return { success: false, error: "Error Occured" };
  }
};

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

    // Handle type-specific updates early for faster response
    if (type) {
      switch (type) {
        case "editvariantstock":
          if (!Stock || Stock.length === 0) {
            await Prisma.stock.deleteMany({ where: { product_id: id } });
            return { success: true };
          }
          const stockUpdated = await updateProductVariantStock(Stock, id);
          return stockUpdated
            ? { success: true }
            : { success: false, error: "Failed to update stock" };

        case "editvariant":
          if (!Variant) {
            return { success: false, error: "Variant data is required" };
          }
          const variantUpdated = await handleUpdateProductVariant(id, Variant);
          return variantUpdated.success
            ? { ...variantUpdated }
            : { success: false, error: "Failed to update variant" };

        case "updateVariantSection": {
          const {
            id: sectionId,
            productsId: id,
            name: sectionName,
            Variants: sectionVariants,
            varaintId,
          } = data as unknown as VariantSectionType;

          if (!sectionVariants || !sectionName) {
            return {
              success: false,
              error: "Missing Required",
            };
          }

          //Create mode
          if (!sectionId) {
            const createdVariantSection = await Prisma.variantSection.create({
              data: {
                name: sectionName,
                productsId: id,
              },
            });
            await Prisma.variant.updateMany({
              where: {
                id: {
                  in: sectionVariants?.map((i) => i.id) as number[],
                },
              },
              data: {
                sectionId: createdVariantSection.id,
              },
            });

            return { success: true, id: createdVariantSection.id };
          }
          const existingSection = await Prisma.variantSection.findUnique({
            where: { id: sectionId },
          });

          if (!existingSection) {
            return { success: false, error: "Variant section not found" };
          }

          //remove single variants
          if (varaintId) {
            await Prisma.variant.update({
              where: { id: varaintId },
              data: { sectionId: null },
            });
            return { success: true };
          }

          // Batch variant section updates in a transaction
          await Prisma.$transaction(async (tx) => {
            const variantIds = sectionVariants.map((i) => i.id) as number[];

            await Promise.all([
              // Remove variants not in the list
              tx.variant.updateMany({
                where: {
                  sectionId,
                  id: { notIn: variantIds },
                },
                data: { sectionId: null },
              }),
              // Add newly added variants
              tx.variant.updateMany({
                where: {
                  sectionId: null,
                  id: { in: variantIds },
                },
                data: { sectionId },
              }),
              // Update section name
              tx.variantSection.update({
                where: { id: sectionId },
                data: { name: sectionName },
              }),
            ]);
          });

          return { success: true };
        }

        default:
          if (stock !== undefined) {
            await Prisma.products.update({
              where: { id },
              data: { stock },
            });
            return { success: true };
          }
          return { success: false, error: "Invalid update type" };
      }
    }

    // Fetch product with only necessary relations
    const includeRelations = {
      relatedproduct: relatedproductid !== undefined,
      covers: false,
      details: false,
      Variant: false,
      Stock: false,
    };

    const existProduct = await Prisma.products.findUnique({
      where: { id },
      include: includeRelations,
    });

    if (!existProduct) {
      return { success: false, error: "Product not found" };
    }

    // Batch all updates in a single transaction for better performance
    await Prisma.$transaction(async (tx) => {
      // Build comprehensive product update object
      const productUpdates: any = {};
      let hasProductUpdates = false;

      if (stocktype !== undefined && existProduct.stocktype !== stocktype) {
        productUpdates.stocktype = stocktype;
        productUpdates.stock =
          stocktype === StockTypeEnum.variants ? null : existProduct.stock;
        hasProductUpdates = true;
      }

      if (price !== undefined && existProduct.price !== price) {
        productUpdates.price = parseFloat(price.toString());
        hasProductUpdates = true;
      }

      if (name && existProduct.name !== name) {
        productUpdates.name = name;
        hasProductUpdates = true;
      }

      if (description && existProduct.description !== description) {
        productUpdates.description = description;
        hasProductUpdates = true;
      }

      if (stock !== undefined && stock !== existProduct.stock) {
        productUpdates.stock = parseInt(stock.toString());
        hasProductUpdates = true;
      }

      if (category) {
        if (
          category.parent_id &&
          existProduct.parentcategory_id !== category.parent_id
        ) {
          productUpdates.parentcategory_id = category.parent_id;
          hasProductUpdates = true;
        }
        if (
          category.child_id &&
          existProduct.childcategory_id !== category.child_id
        ) {
          productUpdates.childcategory_id = category.child_id;
          hasProductUpdates = true;
        }
      }

      // Execute product update if needed
      if (hasProductUpdates) {
        await tx.products.update({
          where: { id },
          data: productUpdates,
        });
      }

      // Parallel execution of independent operations
      const parallelOps = [];

      // Handle covers update
      if (covers?.length) {
        const existingCovers = covers.filter((cover) => cover.id);
        const newCovers = covers.filter((cover) => !cover.id);

        if (existingCovers.length > 0) {
          parallelOps.push(
            ...existingCovers.map((cover) =>
              tx.productcover.update({
                where: { id: cover.id },
                data: { url: cover.url, name: cover.name, type: cover.type },
              }),
            ),
          );
        }

        if (newCovers.length > 0) {
          parallelOps.push(
            tx.productcover.createMany({
              data: newCovers.map((cover) => ({
                productId: id,
                name: cover.name,
                type: cover.type,
                url: cover.url,
              })),
            }),
          );
        }
      }

      // Execute all parallel operations
      if (parallelOps.length > 0) {
        await Promise.all(parallelOps);
      }
    });

    // Handle operations that need to be outside transaction
    const postTransactionOps = [];

    if (covers?.length) {
      postTransactionOps.push(DeleteImageTempForCurrentUser());
    }

    if (details?.length) {
      postTransactionOps.push(updateDetails(details, id));
    }

    // Handle variants and stock
    if (Variant?.length) {
      postTransactionOps.push(
        handleUpdateProductVariant(id, Variant).then(async (variantUpdated) => {
          if (!variantUpdated) {
            throw new Error("Failed to update variants");
          }
          if (Stock?.length) {
            const stockUpdated = await updateProductVariantStock(Stock, id);
            if (!stockUpdated) {
              throw new Error("Failed to update variant stock");
            }
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

    // Handle related products
    if (relatedproductid !== undefined) {
      if (relatedproductid.length === 0) {
        if (existProduct.relatedproduct) {
          postTransactionOps.push(
            Prisma.products
              .update({
                where: { id },
                data: { relatedproduct: { delete: {} } },
              })
              .then(() => {}),
          );
        }
      } else {
        postTransactionOps.push(
          (async () => {
            if (existProduct.relatedproduct) {
              const currentIds = existProduct.relatedproduct
                .productId as number[];
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
          })(),
        );
      }
    }

    // Execute all post-transaction operations in parallel
    if (postTransactionOps.length > 0) {
      await Promise.all(postTransactionOps);
    }

    return { success: true };
  } catch (error) {
    console.log("Edit Product", error);
    return { success: false, error: "Failed To Update Product" };
  }
};

export const DeleteProduct = async (id: number) => {
  try {
    // Fetch only necessary data for deletion logic
    const Products = await Prisma.products.findUnique({
      where: { id },
      select: {
        covers: { select: { name: true } },
        Stock: { select: { id: true } },
        relatedproduct: { select: { productId: true } },
        relatedproductId: true,
      },
    });

    if (!Products) {
      return false;
    }

    // Delete images from storage first (outside transaction)
    if (Products.covers.length > 0) {
      await Promise.all(
        Products.covers.map((cover) => DeleteImageFromStorage(cover.name)),
      );
    }

    // Execute all database operations in a single transaction
    await Prisma.$transaction(async (tx) => {
      const deleteOps = [];

      // Delete stock values if stock exists
      if (Products.Stock.length > 0) {
        const stockIds = Products.Stock.map((stock) => stock.id);
        deleteOps.push(
          tx.stockvalue.deleteMany({
            where: { stockId: { in: stockIds } },
          }),
          tx.stock.deleteMany({ where: { product_id: id } }),
        );
      }

      // Delete all related data in parallel
      deleteOps.push(
        tx.variant.deleteMany({ where: { product_id: id } }),
        tx.productcover.deleteMany({ where: { productId: id } }),
        tx.info.deleteMany({ where: { product_id: id } }),
        tx.orderproduct.deleteMany({ where: { productId: id } }),
        tx.containeritems.deleteMany({ where: { product_id: id } }),
      );

      // Handle temp images cleanup
      if (Products.covers.length > 0) {
        deleteOps.push(
          ...Products.covers.map((cover) =>
            tx.tempimage.deleteMany({ where: { name: cover.name } }),
          ),
        );
      }

      // Execute all delete operations in parallel
      await Promise.all(deleteOps);

      // Handle related products
      if (Products.relatedproductId && Products.relatedproduct) {
        const currentIds = (
          Products.relatedproduct.productId as number[]
        ).filter((productId) => productId !== id);

        if (currentIds.length > 0) {
          await tx.producttype.update({
            where: { id: Products.relatedproductId },
            data: { productId: currentIds },
          });
        } else {
          await tx.producttype.delete({
            where: { id: Products.relatedproductId },
          });
        }
      }

      // Delete the product itself last
      await tx.products.delete({ where: { id } });
    });

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
            let lowstock = false;
            if (prod.Stock) {
              prod.Stock.forEach((stock) => {
                lowstock = stock.Stockvalue.some((sub) => sub.qty <= 5);
              });
            }
            return { ...prod, lowstock };
          });

        totalproduct = products.length;
        allproduct = caculateArrayPagination(products, page, limit);
      } else if (ty === "detail") {
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
            const opt_val = color?.option_value as
              | string[]
              | VariantValueObjType[];
            const productColors = opt_val
              .filter((k: any) => k.val !== "")
              .map((l: any) => {
                return l.val.replace("#", "");
              });

            const productSize = size?.info_value.map((l: string) => {
              return removeSpaceAndToLowerCase(l);
            });
            const text_value = text?.option_value as string[];
            const otherFilter = text_value?.map((l) => {
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

    const result = allproduct.map((i: any) => {
      return {
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
    console.log("GetProductByCategory", error);
    return { success: false };
  }
};
