import { ProductState, VariantValueObjType } from "@/src/types/product.type";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/types/order.type";

/**
 * Calculate additional price from selected options
 */
export const calculateAdditionalPrice = (
  details: Productorderdetailtype[] | undefined,
  variants: ProductState["Variant"],
): number => {
  if (!details || !variants) return 0;

  let total = 0;
  const selectedDetails = details.filter(
    (detail) => detail && detail.value && detail.value.length > 0,
  );

  selectedDetails.forEach((detail) => {
    const variant = variants.find((v) => v.id === detail.variant_id);
    if (!variant) return;

    // Find the selected option in the variant's option_value array
    const selectedOption = (
      variant.option_value as (string | VariantValueObjType)[]
    ).find((opt) =>
      typeof opt === "string" ? opt === detail.value : opt.val === detail.value,
    );

    // Add the price if the option has a price
    if (selectedOption && typeof selectedOption !== "string") {
      const optionPrice = selectedOption.price
        ? parseFloat(selectedOption.price)
        : 0;
      total += optionPrice;
    }

    // Also check if the variant itself has a price
    if (variant.price) {
      total += variant.price;
    }
  });

  return total;
};

/**
 * Check if an option is available (has stock)
 */
export const isOptionAvailable = (
  option: string | VariantValueObjType,
): boolean => {
  if (typeof option === "string") return true;

  if (option.qty !== undefined) {
    const qty =
      typeof option.qty === "number" ? option.qty : parseInt(option.qty || "0");
    return qty > 0;
  }

  return true;
};

/**
 * Get option quantity if available
 */
export const getOptionQuantity = (
  option: string | VariantValueObjType,
): number | undefined => {
  if (typeof option === "string") return undefined;

  if (option.qty !== undefined) {
    return typeof option.qty === "number"
      ? option.qty
      : parseInt(option.qty || "0");
  }

  return undefined;
};

/**
 * Check if all required variants are selected
 */
export const areRequiredVariantsSelected = (
  details: Productorderdetailtype[] | undefined,
  variants: ProductState["Variant"],
): boolean => {
  if (!details || !variants) return false;

  const selectedOptionSet = new Set(
    details
      .filter((d) => d && d.value && d.value.length > 0)
      .map((i) => i.variant_id),
  );

  const missingRequired = variants.filter(
    (v) => v.id && !v.optional && !selectedOptionSet.has(v.id),
  );

  return missingRequired.length === 0;
};

/**
 * Get required variant details (non-optional with values)
 */
export const getRequiredVariantDetails = (
  details: Productorderdetailtype[] | undefined,
  variants: ProductState["Variant"],
): Productorderdetailtype[] => {
  if (!details || !variants) return [];

  return details.filter((detail) => {
    if (!detail || !detail.value || detail.value.length === 0) return false;
    const variant = variants.find((v) => v.id === detail.variant_id);
    return variant && !variant.optional;
  });
};

/**
 * Get all selected variant details (both required and optional)
 */
export const getAllSelectedDetails = (
  details: Productorderdetailtype[] | undefined,
): Productorderdetailtype[] => {
  if (!details) return [];
  return details.filter(
    (detail) => detail && detail.value && detail.value.length > 0,
  );
};

/**
 * Check if any selections exist
 */
export const hasAnySelections = (
  productorderdetail: Productordertype | undefined,
): boolean => {
  const hasQty =
    productorderdetail?.quantity && productorderdetail.quantity > 0;
  const hasDetails = productorderdetail?.details?.some(
    (detail) => detail && detail.value && detail.value.length > 0,
  );
  return Boolean(hasQty || hasDetails);
};

/**
 * Separate variants by whether they're in sections
 */
export const separateVariantsBySections = (
  variants: ProductState["Variant"],
) => {
  if (!variants) {
    return {
      requiredVariantsNotInSection: [],
      optionalVariantsNotInSection: [],
    };
  }

  const variantsNotInSection = variants.filter((variant) => !variant.sectionId);
  const required = variantsNotInSection.filter((v) => !v.optional);
  const optional = variantsNotInSection.filter((v) => v.optional);

  return {
    requiredVariantsNotInSection: required,
    optionalVariantsNotInSection: optional,
  };
};

/**
 * Sort variants in section by required first, then optional
 */
export const sortVariantsByRequired = (section: any) => {
  return {
    ...section,
    Variants: [...(section.Variants || [])].sort((a: any, b: any) => {
      // Required (not optional) comes before optional
      if (!a.optional && b.optional) return -1;
      if (a.optional && !b.optional) return 1;
      return 0;
    }),
  };
};
