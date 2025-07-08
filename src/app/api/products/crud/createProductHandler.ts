import { ActionReturnType, ProductState } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType } from "@prisma/client";
import { del } from "@vercel/blob";

export const CreateProduct = async (
  data: ProductState
): Promise<ActionReturnType> => {
  try {
    if (!data.covers || data.covers.length === 0) {
      return { success: false, error: "Image is required" };
    }

    return await Prisma.$transaction(
      async (tx) => {
        const existingProduct = await tx.products.findFirst({
          where: { name: data.name },
          select: { id: true },
        });

        if (existingProduct) {
          return { success: false, error: "Product Already Exists" };
        }

        const productData: Record<string, unknown> = {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price.toString()),
          stock: parseInt(`${data.stock}`),
          stocktype: data.stocktype,
          parentcategory_id: data.category.parent.id,
          childcategory_id: data.category?.child?.id ?? null,
          details: {
            createMany: {
              data: data.details as never,
            },
          },
        };

        // Create related product type if needed
        let relatedProductTypeId = null;
        if (data.relatedproductid && data.relatedproductid.length > 0) {
          const relatedProductType = await tx.producttype.create({
            data: { productId: data.relatedproductid },
            select: { id: true },
          });
          relatedProductTypeId = relatedProductType.id;
          productData.relatedproductId = relatedProductTypeId;
        }

        const createdProduct = await tx.products.create({
          data: productData as PrismaType.ProductsCreateInput,
          select: { id: true },
        });

        await Promise.all([
          // Update cover images (mark as non-temporary and associate with product)
          (async () => {
            const coverIds = data.covers
              .filter((cover) => cover.id)
              .map((cover) => cover.id as number);

            if (coverIds.length > 0) {
              await tx.image.updateMany({
                where: { id: { in: coverIds } },
                data: {
                  temp: false,
                  productId: createdProduct.id,
                },
              });
            }
          })(),

          // Update related product connections if needed
          (async () => {
            if (
              relatedProductTypeId &&
              data.relatedproductid &&
              data.relatedproductid.length > 0
            ) {
              await tx.producttype.update({
                where: { id: relatedProductTypeId },
                data: {
                  productId: [createdProduct.id, ...data.relatedproductid],
                },
              });

              await tx.products.updateMany({
                where: { id: { in: data.relatedproductid } },
                data: { relatedproductId: relatedProductTypeId },
              });
            }
          })(),

          // Create variants
          (async () => {
            if (data.variants && data.variants.length > 0) {
              await tx.variant.createMany({
                data: data.variants.map((variant) => ({
                  product_id: createdProduct.id,
                  option_title: variant.option_title,
                  option_type: variant.option_type,
                  option_value: variant.option_value,
                })),
              });
            }
          })(),

          // Create variant stock
          (async () => {
            if (data.varaintstock && data.varaintstock.length > 0) {
              // Create each stock entry
              for (const stockItem of data.varaintstock) {
                await tx.stock.create({
                  data: {
                    product_id: createdProduct.id,
                    Stockvalue: {
                      createMany: {
                        data: stockItem.Stockvalue.map((value) => ({
                          qty: value.qty ?? 0,
                          variant_val: value.variant_val,
                        })),
                      },
                    },
                  },
                });
              }
            }
          })(),
        ]);

        return {
          success: true,
          id: createdProduct.id,
        };
      },
      {
        timeout: 30000, // Reasonable timeout for product creation with many related items
        maxWait: 5000, // Maximum time to wait for transaction to start
        isolationLevel: "Serializable", // Strongest isolation level to prevent conflicts
      }
    );
  } catch (error) {
    console.error("Create Product Error:", error);
    return {
      success: false,
      error: `Failed to create product: ${
        error instanceof Error ? error.message : "Error Occured"
      }`,
    };
  }
};

export const DeleteProduct = async (ids: Array<number>): Promise<boolean> => {
  try {
    return await Prisma.$transaction(
      async (tx) => {
        const products = await tx.products.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            covers: { select: { url: true } },
            Variant: { select: { id: true } },
            Stock: { select: { id: true } },
            relatedproduct: { select: { id: true, productId: true } },
            relatedproductId: true,
          },
        });

        if (products.length === 0) return false;

        const allImageUrls = products.flatMap((product) =>
          product.covers.map((cover) => cover.url)
        );

        await Promise.all([
          // Delete related records for all products
          tx.image.deleteMany({ where: { productId: { in: ids } } }),
          tx.variant.deleteMany({ where: { product_id: { in: ids } } }),
          tx.info.deleteMany({ where: { product_id: { in: ids } } }),
          tx.orderproduct.deleteMany({ where: { productId: { in: ids } } }),
          tx.containeritems.deleteMany({ where: { product_id: { in: ids } } }),

          // Handle stock deletion for all products
          (async () => {
            const allStockIds = products.flatMap((product) =>
              product.Stock.map((s) => s.id)
            );

            if (allStockIds.length > 0) {
              await tx.stockvalue.deleteMany({
                where: { stockId: { in: allStockIds } },
              });
              await tx.stock.deleteMany({ where: { product_id: { in: ids } } });
            }
          })(),

          // Handle related product references for all products
          (async () => {
            for (const product of products) {
              if (product.relatedproductId && product.relatedproduct) {
                const currentIds = (
                  product.relatedproduct.productId as number[]
                ).filter((productId) => !ids.includes(productId));

                if (currentIds.length > 0) {
                  await tx.producttype.update({
                    where: { id: product.relatedproductId },
                    data: { productId: currentIds },
                  });
                } else {
                  await tx.producttype.delete({
                    where: { id: product.relatedproductId },
                  });
                }
              }
            }
          })(),
        ]);

        // Finally delete all products
        await tx.products.deleteMany({ where: { id: { in: ids } } });

        // After all DB operations succeed, delete the images from storage
        if (allImageUrls.length > 0) {
          await del(allImageUrls);
        }

        return true;
      },
      {
        timeout: 30000,
      }
    );
  } catch (error) {
    console.error("Delete Product Error:", error);
    throw new Error(
      `Failed to delete products ${ids.join(", ")}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
