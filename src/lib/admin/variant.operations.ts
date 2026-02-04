import Prisma from "../prisma";
import { Varianttype, VariantValueObjType } from "../../types/product.type";
import { updateProductVariantStock } from "./stock.operations";

export const handleUpdateProductVariant = async (
  id: number,
  variants: Varianttype | Varianttype[],
) => {
  try {
    // Normalize input to array
    const variantsArray = Array.isArray(variants) ? variants : [variants];

    const existingVariants = await Prisma.variant.findMany({
      where: { product_id: id },
      select: {
        id: true,
        option_title: true,
        option_type: true,
        option_value: true,
      },
    });

    const existingVariantsMap = new Map(existingVariants.map((v) => [v.id, v]));

    const variantsToUpdate: Array<{ id: number; data: Varianttype }> = [];
    const variantsToCreate: Varianttype[] = [];
    const existingVariantIds: number[] = [];
    const variantValueChanges: Array<{
      oldValues: string[];
      newValues: string[];
    }> = [];
    let createdVariantIds: number[] = [];

    variantsArray.forEach((variant) => {
      if (variant.id) {
        existingVariantIds.push(variant.id);
        variantsToUpdate.push({ id: variant.id, data: variant });

        const existingVariant = existingVariantsMap.get(variant.id);
        if (existingVariant) {
          const oldValues = (existingVariant.option_value as any[]).map((v) =>
            typeof v === "string" ? v : v.val,
          );
          const newValues = variant.option_value.map((v) =>
            typeof v === "string" ? v : (v as VariantValueObjType).val,
          );

          const hasChanges =
            oldValues.length !== newValues.length ||
            oldValues.some((oldVal, idx) => oldVal !== newValues[idx]);

          if (hasChanges) {
            variantValueChanges.push({ oldValues, newValues });
          }
        }
      } else {
        variantsToCreate.push(variant);
      }
    });

    // Get all stockvalues to filter out option_values that are already in use
    const stockValues = await Prisma.stockvalue.findMany({
      where: {
        stock: {
          product_id: id,
        },
      },
      select: {
        variant_val: true,
      },
    });

    // Collect all variant values from stockvalues
    const usedVariantValues = new Set<string>();
    stockValues.forEach((sv) => {
      if (sv.variant_val && Array.isArray(sv.variant_val)) {
        (sv.variant_val as string[]).forEach((val) =>
          usedVariantValues.add(val),
        );
      }
    });

    const buildVariantData = (
      val: Varianttype,
      pId?: number,
      filterUsedValues = false,
    ) => {
      let optionValue = val.option_value;

      // Filter out option_values that are in stockvalue variant_val
      if (filterUsedValues && usedVariantValues.size > 0) {
        optionValue = val.option_value.filter((v) => {
          const valStr =
            typeof v === "string" ? v : (v as VariantValueObjType).val;
          return !usedVariantValues.has(valStr);
        });
      }

      const data: Varianttype = {
        option_title: val.option_title,
        option_type: val.option_type,
        option_value: optionValue,
        optional: val.optional,
      };

      // Only include sectionId if it's a valid number, otherwise set to null or disconnect
      if (val.sectionId !== undefined) {
        if (val.sectionId === null || val.sectionId === 0) {
          data.sectionId = undefined;
        } else {
          data.sectionId = val.sectionId;
        }
      }

      if (pId) data.product_id = pId;
      return data;
    };

    await Prisma.$transaction(async (tx) => {
      if (variantsToUpdate.length > 0) {
        await Promise.all(
          variantsToUpdate.map(({ id: variantId, data: variant }) =>
            tx.variant.update({
              where: { id: variantId },
              data: buildVariantData(variant, undefined, true) as never,
            }),
          ),
        );
      }

      if (variantsToCreate.length > 0) {
        const createdVariants = await Promise.all(
          variantsToCreate.map((variant) =>
            tx.variant.create({
              data: buildVariantData(variant, id, true) as never,
            }),
          ),
        );
        createdVariantIds = createdVariants.map((v) => v.id);
      }

      if (variantValueChanges.length > 0) {
        for (const { oldValues, newValues } of variantValueChanges) {
          const stockValues = await tx.stockvalue.findMany({
            where: {
              stock: {
                product_id: id,
              },
            },
          });

          for (const stockValue of stockValues) {
            if (
              !stockValue.variant_val ||
              !Array.isArray(stockValue.variant_val)
            ) {
              continue;
            }

            const currentVariantVal = stockValue.variant_val as string[];
            const updatedVariantVal = currentVariantVal.map((val: string) => {
              const oldIndex = oldValues.indexOf(val);
              return oldIndex !== -1 ? newValues[oldIndex] : val;
            });

            if (
              JSON.stringify(currentVariantVal) !==
              JSON.stringify(updatedVariantVal)
            ) {
              await tx.stockvalue.update({
                where: { id: stockValue.id },
                data: { variant_val: updatedVariantVal },
              });
            }
          }
        }
      }
    });

    // Return single ID if single variant was passed, otherwise return array
    const isSingleVariant = !Array.isArray(variants);
    const result: {
      success: boolean;
      id: number;
      createdVariantId: Array<number> | number;
    } = {
      success: true,
      id,
      createdVariantId: 0,
    };

    if (createdVariantIds.length > 0) {
      result.createdVariantId = isSingleVariant
        ? createdVariantIds[0]
        : createdVariantIds;
    }

    return result;
  } catch (error) {
    console.error("Failed to update variant:", error);
    throw new Error("Failed to update variant");
  }
};

export const handleDeleteVariant = async (
  prodId: number,
  variantIds: Array<number>,
): Promise<{ success: boolean }> => {
  if (!variantIds || variantIds.length === 0 || !prodId)
    return { success: false };

  try {
    const isVariant = await Prisma.variant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        option_value: true,
      },
    });

    //Invalid Variants
    if (isVariant.length !== variantIds.length) {
      return { success: false };
    }

    // Collect all option_values from variants to be deleted
    const valuesToRemove = new Set<string>();
    isVariant.forEach((variant) => {
      if (variant.option_value && Array.isArray(variant.option_value)) {
        (variant.option_value as any[]).forEach((v) => {
          const valStr = typeof v === "string" ? v : v.val;
          valuesToRemove.add(valStr);
        });
      }
    });

    // Remove these values from stockvalue variant_val arrays
    if (valuesToRemove.size > 0) {
      const stockValues = await Prisma.stockvalue.findMany({
        where: {
          stock: {
            product_id: prodId,
          },
        },
        select: {
          id: true,
          variant_val: true,
        },
      });

      await Promise.all(
        stockValues.map(async (sv) => {
          if (sv.variant_val && Array.isArray(sv.variant_val)) {
            const currentVariantVal = sv.variant_val as string[];
            const updatedVariantVal = currentVariantVal.filter(
              (val) => !valuesToRemove.has(val),
            );

            // Only update if there are changes
            if (currentVariantVal.length !== updatedVariantVal.length) {
              await Prisma.stockvalue.update({
                where: { id: sv.id },
                data: { variant_val: updatedVariantVal },
              });
            }
          }
        }),
      );
    }

    await Prisma.variant.deleteMany({
      where: {
        id: { in: variantIds },
      },
    });

    return { success: true };
  } catch (error) {
    console.log("Delete Variant", error);
    throw Error("Error Occured");
  }
};
