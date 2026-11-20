import Prisma from "../prisma";
import { DeleteImageFromStorage } from "../utilities";
import { DeleteImageTempForCurrentUser } from "../../app/api/products/cover/helper/Cleanup";
import {
  ProductInfo,
  ProductState,
  StockTypeEnum,
  VariantSectionType,
} from "../../types/product.type";
import {
  handleUpdateProductVariant,
  handleUpdateVariantSection,
} from "./variant.operations";
import { updateProductVariantStock } from "./stock.operations";
import type { InputJsonValue } from "@/prisma/generated/prisma/internal/prismaNamespace";
import type {
  InfoCreateManyProductInput,
  ProductsUncheckedUpdateInput,
} from "@/prisma/generated/prisma/models";

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
                info_value: detail.info_value as InputJsonValue,
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
            info_value: detail.info_value as InputJsonValue,
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
          data: { productId: data.relatedproductid },
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
              data: data.details as unknown as InfoCreateManyProductInput[],
            },
          },
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
                      condition: (i.condition ?? undefined) as InputJsonValue | undefined,
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
                condition: (i.condition ?? undefined) as InputJsonValue | undefined,
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
          return handleUpdateVariantSection(
            data as unknown as VariantSectionType,
          );

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
      const productUpdates: ProductsUncheckedUpdateInput = {};

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
        // A cover can arrive without an id even though it is already stored
        // (e.g. saved from the image modal, then sent again with the product
        // form). Blob URLs are unique, so skip any URL the product already has.
        const storedUrls = new Set(
          (
            await tx.productcover.findMany({
              where: { productId: id },
              select: { url: true },
            })
          ).map((c) => c.url),
        );
        const newCovers = covers.filter(
          (c) => !c.id && !storedUrls.has(c.url),
        );
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
    const postTransactionOps: Promise<unknown>[] = [];

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
          (existProduct as { relatedproduct?: { productId: unknown } | null })
            .relatedproduct ?? null,
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
      const deleteOps: Promise<unknown>[] = [
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
