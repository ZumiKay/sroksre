import {
  ActionReturnType,
  ProductInfo,
  ProductState,
  Stocktype,
  Varianttype,
} from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType, Products } from "@prisma/client";

export interface updateProductData extends ProductState {
  id: number;
  type?: "editsize" | "editstock" | "editvariantstock" | "editvariant";
}

export const updateDetails = async (
  details: [] | ProductInfo[],
  id: number,
  transaction?: PrismaType.TransactionClient
): Promise<boolean> => {
  // Use provided transaction or fallback to direct Prisma client
  const prisma = transaction || Prisma;

  try {
    if (!details || details.length === 0) {
      return true; // Nothing to update
    }

    // Separate details by operation type
    const existingDetails = details.filter((detail) => !!detail.id);
    const newDetails = details.filter((detail) => !detail.id);

    // Get IDs of existing details that should be kept
    const detailIdsToKeep = existingDetails.map(
      (detail) => detail.id as number
    );

    await Promise.all([
      (async () => {
        if (detailIdsToKeep.length > 0) {
          await prisma.info.deleteMany({
            where: {
              product_id: id,
              id: { notIn: detailIdsToKeep },
            },
          });
        } else {
          await prisma.info.deleteMany({
            where: { product_id: id },
          });
        }
      })(),

      (async () => {
        if (existingDetails.length > 0) {
          await Promise.all(
            existingDetails.map((detail) =>
              prisma.info.update({
                where: { id: detail.id },
                data: {
                  info_title: detail.info_title,
                  info_value: detail.info_value as never,
                },
              })
            )
          );
        }
      })(),

      (async () => {
        if (newDetails.length > 0) {
          await prisma.info.createMany({
            data: newDetails.map((detail) => ({
              info_title: detail.info_title,
              info_type: detail.info_type,
              info_value: detail.info_value as never,
              product_id: id,
            })),
            skipDuplicates: true,
          });
        }
      })(),
    ]);

    return true;
  } catch (error) {
    console.error("Update Product Details Error:", error);

    // More detailed error message
    const errorMessage =
      error instanceof Error
        ? `Failed to update product details: ${error.message}`
        : "Failed to update product details: Unknown error";

    throw new Error(errorMessage);
  }
};

/**
 * Updates product variant stock information
 * @param variantstock Array of stock data to update or create
 * @param productId Product ID
 * @param tx Optional transaction client (for use within a larger transaction)
 * @returns Promise resolving to true if successful, null if error occurs
 */
export const updateProductVariantStock = async (
  variantstock: Stocktype[],
  productId: number,
  tx?: PrismaType.TransactionClient
): Promise<boolean | null> => {
  try {
    const runOperation = async (prisma: PrismaType.TransactionClient) => {
      if (!variantstock || variantstock.length === 0) {
        return true;
      }

      const existingStockIds = variantstock
        .filter((stock) => stock.id)
        .map((stock) => stock.id as number);

      if (existingStockIds.length > 0) {
        const stocksToDelete = await prisma.stock.findMany({
          where: {
            product_id: productId,
            id: { notIn: existingStockIds },
          },
          select: { id: true },
        });

        const stockIdsToDelete = stocksToDelete.map((s) => s.id);

        if (stockIdsToDelete.length > 0) {
          await prisma.stockvalue.deleteMany({
            where: { stockId: { in: stockIdsToDelete } },
          });

          await prisma.stock.deleteMany({
            where: { id: { in: stockIdsToDelete } },
          });
        }
      } else {
        const allProductStocks = await prisma.stock.findMany({
          where: { product_id: productId },
          select: { id: true },
        });

        const allStockIds = allProductStocks.map((s) => s.id);

        if (allStockIds.length > 0) {
          await prisma.stockvalue.deleteMany({
            where: { stockId: { in: allStockIds } },
          });

          await prisma.stock.deleteMany({
            where: { id: { in: allStockIds } },
          });
        }
      }

      for (const stock of variantstock) {
        if (stock.id) {
          // Get existing stock values
          const existingStockValues = await prisma.stockvalue.findMany({
            where: { stockId: stock.id },
            select: { id: true },
          });

          // Identify which stock values to keep
          const stockValueIdsToKeep = stock.Stockvalue.filter(
            (sv) => sv.id
          ).map((sv) => sv.id as number);

          const stockValueIdsToDelete = existingStockValues
            .map((sv) => sv.id)
            .filter((id) => !stockValueIdsToKeep.includes(id));

          if (stockValueIdsToDelete.length > 0) {
            await prisma.stockvalue.deleteMany({
              where: { id: { in: stockValueIdsToDelete } },
            });
          }

          // Update existing and create new stock values
          const updateOperations = stock.Stockvalue.filter((sv) => sv.id).map(
            (sv) =>
              prisma.stockvalue.update({
                where: { id: sv.id as number },
                data: {
                  qty: sv.qty ?? 0,
                  variant_val: sv.variant_val,
                },
              })
          );

          const createOperations = stock.Stockvalue.filter((sv) => !sv.id).map(
            (sv) =>
              prisma.stockvalue.create({
                data: {
                  stockId: stock.id as number,
                  qty: sv.qty ?? 0,
                  variant_val: sv.variant_val,
                },
              })
          );

          await Promise.all([...updateOperations, ...createOperations]);
        } else {
          await prisma.stock.create({
            data: {
              product_id: productId,
              Stockvalue: {
                createMany: {
                  data: stock.Stockvalue.map((sv) => ({
                    qty: sv.qty ?? 0,
                    variant_val: sv.variant_val,
                  })),
                },
              },
            },
          });
        }
      }

      return true;
    };

    if (tx) {
      return await runOperation(tx);
    } else {
      return await Prisma.$transaction(
        async (prisma) => {
          return await runOperation(prisma);
        },
        {
          timeout: 30000,
          maxWait: 5000,
          isolationLevel: "Serializable",
        }
      );
    }
  } catch (error) {
    console.error("Update Product Variant Stock Error:", error);
    return null;
  }
};

/**
 * Updates product variants for a given product ID
 * @param id Product ID
 * @param variants Array of variant data to update or create
 * @param tx Optional transaction client (for use within a larger transaction)
 * @returns Promise resolving to true if successful
 * @throws Error if the operation fails
 */
export const handleUpdateProductVariant = async (
  id: number,
  variants: Varianttype[],
  tx?: PrismaType.TransactionClient
): Promise<boolean> => {
  const prisma = tx || Prisma;

  try {
    if (!variants || variants.length === 0) {
      return true;
    }

    // Categorize variants by operation type
    const existingVariants = variants.filter((variant) => !!variant.id);
    const newVariants = variants.filter((variant) => !variant.id);
    const existingVariantIds = existingVariants.map(
      (variant) => variant.id as number
    );

    if (existingVariantIds.length > 0) {
      // Delete variants not in the updated list
      await prisma.variant.deleteMany({
        where: {
          product_id: id,
          id: { notIn: existingVariantIds },
        },
      });
    } else {
      // If no existing variants to keep, delete all variants for this product
      await prisma.variant.deleteMany({
        where: { product_id: id },
      });
    }

    const operations = [];

    if (existingVariants.length > 0) {
      operations.push(
        Promise.all(
          existingVariants.map((variant) =>
            prisma.variant.update({
              where: { id: variant.id as number },
              data: {
                option_title: variant.option_title,
                option_type: variant.option_type,
                option_value: variant.option_value as never,
              },
            })
          )
        )
      );
    }

    if (newVariants.length > 0) {
      operations.push(
        prisma.variant.createMany({
          data: newVariants.map((variant) => ({
            product_id: id,
            option_title: variant.option_title,
            option_type: variant.option_type,
            option_value: variant.option_value as never,
          })),
          skipDuplicates: true,
        })
      );
    }

    await Promise.all(operations);

    return true;
  } catch (error) {
    console.error("Update product variants error:", error);

    const errorMessage =
      error instanceof Error
        ? `Failed to update product variants: ${error.message}`
        : "Failed to update product variants: Unknown error";

    throw new Error(errorMessage);
  }
};

/**
 * Updates a product with comprehensive changes
 * @param data Product update data
 * @returns Promise resolving to success status and optional error message
 */
export const EditProduct = async (
  data: updateProductData
): Promise<ActionReturnType> => {
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

    const existProduct = await Prisma.products.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        stocktype: true,
        parentcategory_id: true,
        childcategory_id: true,
        relatedproduct: {
          select: {
            id: true,
            productId: true,
          },
        },
      },
    });

    if (!existProduct) {
      return { success: false, error: "Product not found" };
    }

    if (type) {
      return await handleSpecificUpdateType(
        type,
        id,
        details,
        varaintstock,
        stock
      );
    }

    return await Prisma.$transaction(
      async (tx) => {
        // Group 1: Basic product info updates
        await updateBasicProductInfo(tx, id, existProduct as never, {
          name,
          description,
          price,
          stocktype,
          stock,
        });

        // Group 2: Category updates
        await updateProductCategory(tx, id, existProduct as never, category);

        // Group 3: Cover image updates
        await updateProductCovers(tx, covers as never);

        // Group 4: Product details updates
        if (details?.length) {
          await updateDetails(details, id, tx);
        }

        // Group 5: Variants and variant stock updates
        await updateProductVariants(tx, id, variants, varaintstock);

        // Group 6: Related products updates
        await updateRelatedProducts(
          tx,
          id,
          existProduct as never,
          relatedproductid
        );

        return { success: true };
      },
      {
        timeout: 30000, // 30 second timeout
        maxWait: 5000, // Maximum wait time for transaction
        isolationLevel: "Serializable", // Highest isolation level
      }
    );
  } catch (error) {
    console.error("Edit Product Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: `Failed to update product: ${errorMessage}`,
    };
  }
};

/**
 * Handles specific update types that don't require a full product update
 */
const handleSpecificUpdateType = async (
  type: string,
  id: number,
  details?: ProductInfo[],
  varaintstock?: Stocktype[],
  stock?: number
): Promise<ActionReturnType> => {
  try {
    if (type === "editsize" && details?.length) {
      const updateResult = await updateDetails(details, id);
      return { success: !!updateResult };
    }

    if (type === "editvariantstock" && varaintstock?.length) {
      const updateResult = await updateProductVariantStock(varaintstock, id);
      return { success: !!updateResult };
    }

    if (!varaintstock || varaintstock.length === 0) {
      await Prisma.stock.deleteMany({ where: { product_id: id } });
      return { success: true };
    }

    // Handle simple stock update
    await Prisma.products.update({
      where: { id },
      data: { stock },
    });
    return { success: true };
  } catch (error) {
    console.error("Handle specific update type error:", error);
    return { success: false, error: "Failed to process specific update" };
  }
};

/**
 * Updates basic product information
 */
const updateBasicProductInfo = async (
  tx: PrismaType.TransactionClient,
  id: number,
  existProduct: Products,
  {
    name,
    description,
    price,
    stocktype,
    stock,
  }: {
    name?: string;
    description?: string;
    price?: number | string;
    stocktype?: string;
    stock?: number;
  }
): Promise<void> => {
  // Update price and stock type if changed
  if (
    (stocktype !== undefined || price !== undefined) &&
    (existProduct.stocktype !== stocktype ||
      existProduct.price !== (price ? parseFloat(price.toString()) : undefined))
  ) {
    await tx.products.update({
      where: { id },
      data: {
        stocktype,
        price: price ? parseFloat(price.toString()) : undefined,
        stock:
          stocktype === "variant" || stocktype === "size" ? null : undefined,
      },
    });
  }

  // Update name and description if changed
  if (
    (name || description) &&
    (existProduct.name !== name || existProduct.description !== description)
  ) {
    await tx.products.update({
      where: { id },
      data: { name, description },
    });
  }

  // Update stock if valid and changed
  const isStockValid =
    stock !== undefined && stock !== 0 && existProduct.stock !== stock;
  if (isStockValid) {
    await tx.products.update({
      where: { id },
      data: { stock: parseInt(stock!.toString()) },
    });
  }
};

/**
 * Updates product category
 */
const updateProductCategory = async (
  tx: PrismaType.TransactionClient,
  id: number,
  existProduct: Products,
  category?: { parent: { id: number }; child?: { id: number } }
): Promise<void> => {
  if (!category) return;

  const isCategoryChange =
    (category.parent.id &&
      existProduct.parentcategory_id !== category.parent.id) ||
    (category.child?.id && existProduct.childcategory_id !== category.child.id);

  if (isCategoryChange) {
    await tx.products.update({
      where: { id },
      data: {
        parentcategory_id: category.parent.id,
        childcategory_id: category.child?.id,
      },
    });
  }
};

/**
 * Updates product cover images
 */
const updateProductCovers = async (
  tx: PrismaType.TransactionClient,
  covers?: { id: number; temp: boolean }[]
): Promise<void> => {
  if (!covers?.length) return;

  // Create new covers (mark temporary ones as permanent)
  const newCovers = covers.filter((i) => i.temp);
  if (newCovers.length) {
    await tx.image.updateMany({
      where: { id: { in: newCovers.map((i) => i.id as number) } },
      data: { temp: false },
    });
  }
};

/**
 * Updates product variants and variant stock
 */
const updateProductVariants = async (
  tx: PrismaType.TransactionClient,
  id: number,
  variants?: Varianttype[],
  varaintstock?: Stocktype[]
): Promise<void> => {
  if (variants?.length) {
    // Update variants
    await handleUpdateProductVariant(id, variants, tx);

    // Update variant stock if provided
    if (varaintstock?.length) {
      await updateProductVariantStock(varaintstock, id, tx);
    } else {
      // Delete all stock if no variant stock is provided
      await tx.stock.deleteMany({ where: { product_id: id } });
    }
  } else {
    // Delete all variants if no variants are provided
    await tx.variant.deleteMany({ where: { product_id: id } });
  }
};

/**
 * Updates product related products
 */
const updateRelatedProducts = async (
  tx: PrismaType.TransactionClient,
  id: number,
  existProduct: ProductState,
  relatedproductid?: number[]
): Promise<void> => {
  if (relatedproductid === undefined) return;

  if (relatedproductid.length === 0) {
    // Delete all related products
    if (existProduct.relatedproduct) {
      await tx.products.update({
        where: { id },
        data: {
          relatedproduct: {
            delete: true,
          },
        },
      });
    }
    return;
  }

  // Handle existing related products that need to be removed
  if (existProduct.relatedproduct) {
    const existingIds = existProduct.relatedproduct.map(
      (i) => i.id
    ) as number[];
    const idsToRemove = existingIds.filter(
      (i) => !relatedproductid.includes(i)
    );

    if (idsToRemove.length > 0) {
      await tx.products.updateMany({
        where: { id: { in: idsToRemove } },
        data: { relatedproductId: null },
      });
    }
  }

  // Update or create related products
  const updateResult = await tx.products.update({
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
      relatedproduct: {
        select: { id: true },
      },
    },
  });

  // Update the related products to point back to this product
  if (updateResult.relatedproduct?.id) {
    await tx.products.updateMany({
      where: { id: { in: relatedproductid } },
      data: { relatedproductId: updateResult.relatedproduct.id },
    });
  }
};
