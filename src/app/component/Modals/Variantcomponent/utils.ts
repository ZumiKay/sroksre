import { VariantValueObjType as VariantColorValueType } from "@/src/types/product.type";
import {
  Stocktype,
  Varianttype,
  VariantValueObjType,
} from "@/src/types/product.type";

export const ArraysAreEqualSets = (
  array1: string[],
  array2: string[],
): boolean => {
  if (array1.length !== array2.length) return false;

  const set1 = new Set(array1);
  const set2 = new Set(array2);

  if (set1.size !== set2.size) return false;

  const set1Array = Array.from(set1);
  for (let i = 0; i < set1Array.length; i++) {
    if (!set2.has(set1Array[i])) return false;
  }

  return true;
};

export const checkVariantExists = (
  variants: any[] | undefined,
  name: string,
): boolean => {
  return !!variants?.some((i) => i.option_title === name);
};

export const checkColorTypeExists = (variants: any[] | undefined): boolean => {
  return !!variants?.some((i) => i.option_type === "COLOR");
};

export const getColorRgb = (hex: string) => {
  const tinycolor = require("tinycolor2");
  return tinycolor(hex).toRgb();
};

export const updateStockOnVariantEdit = (
  varaintstock: Stocktype[],
  variants: Varianttype[],
): any[] => {
  return varaintstock.map((stockItem) => ({
    ...stockItem,
    Stockvalue: stockItem.Stockvalue.map((stockValue) => ({
      ...stockValue,
      variant_val: stockValue.variant_val.map((val: string) =>
        variants.some((vars) =>
          (vars.option_value as VariantValueObjType[]).some(
            (color) => color.val === val,
          ),
        )
          ? val
          : "",
      ),
    })).filter((stockValue) =>
      stockValue.variant_val.some((val) => val !== ""),
    ),
  }));
};

export const cleanEmptyStock = (varaintstock: any[] | undefined) => {
  if (!varaintstock) return [];
  const isStockEmpty = varaintstock.findIndex((i) => i.Stockvalue.length === 0);
  if (isStockEmpty !== -1) {
    return varaintstock.filter((_, idx) => idx !== isStockEmpty);
  }
  return varaintstock;
};
