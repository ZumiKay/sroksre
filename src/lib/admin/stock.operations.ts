import Prisma from "../prisma";
import { Stocktype } from "../../types/product.type";

export const updateProductVariantStock = async (
  variantstock: Stocktype[],
  id: number,
): Promise<boolean | null> => {
  try {
    if (!variantstock?.length) {
      await Prisma.stock.deleteMany({ where: { product_id: id } });
      return true;
    }

    const stocksToUpdate: Stocktype[] = [];
    const stocksToCreate: Stocktype[] = [];
    const existingStockIds: number[] = [];

    variantstock.forEach((stock) => {
      if (stock.id) {
        existingStockIds.push(stock.id);
        stocksToUpdate.push(stock);
      } else {
        stocksToCreate.push(stock);
      }
    });

    await Prisma.$transaction(async (tx) => {
      if (existingStockIds.length > 0) {
        await tx.stock.deleteMany({
          where: {
            product_id: id,
            id: { notIn: existingStockIds },
          },
        });
      }

      for (const stock of stocksToUpdate) {
        if (!stock.id) continue;

        const stockValueIdsToKeep = stock.Stockvalue.filter((sv) => sv.id).map(
          (sv) => sv.id!,
        );

        if (stockValueIdsToKeep.length > 0) {
          await tx.stockvalue.deleteMany({
            where: {
              stockId: stock.id,
              id: { notIn: stockValueIdsToKeep },
            },
          });
        } else {
          await tx.stockvalue.deleteMany({
            where: { stockId: stock.id },
          });
        }

        const valuesToUpdate = stock.Stockvalue.filter((sv) => sv.id);
        const valuesToCreate = stock.Stockvalue.filter((sv) => !sv.id);

        if (valuesToUpdate.length > 0) {
          await Promise.all(
            valuesToUpdate.map((sv) =>
              tx.stockvalue.update({
                where: { id: sv.id },
                data: {
                  qty: sv.qty ?? 0,
                  variant_val: sv.variant_val,
                },
              }),
            ),
          );
        }

        if (valuesToCreate.length > 0) {
          await tx.stockvalue.createMany({
            data: valuesToCreate.map((sv) => ({
              stockId: stock.id!,
              qty: sv.qty ?? 0,
              variant_val: sv.variant_val,
            })),
          });
        }
      }

      if (stocksToCreate.length > 0) {
        await Promise.all(
          stocksToCreate.map((stock) =>
            tx.stock.create({
              data: {
                product_id: id,
                Stockvalue: {
                  createMany: {
                    data: stock.Stockvalue.map((sv) => ({
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
    });

    return true;
  } catch (error) {
    console.log("Failed to update product variant stock:", error);
    return null;
  }
};
