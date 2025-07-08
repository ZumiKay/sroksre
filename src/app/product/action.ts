"use server";

import {
  ProductState,
  SelectType,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import {
  caculateArrayPagination,
  calculateDiscountPrice,
  GetOneWeekAgoDate,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { Childcategories, Parentcategories } from "@prisma/client";
import { cache } from "react";
import { updateProductPromotion } from "../api/products/helper";

export const GetListProduct = async (
  page: string,
  show: string,
  parentcate_id: string,
  childcate_id?: string,
  latestcate?: boolean,
  filtervalue?: {
    color?: string[];
    size?: string[];
    other?: string[];
    promo?: string[];
    search?: string;
    selectpids?: string[];
    parent_id?: string[];
    child_id?: string[];
  },
  all?: string,
  sort?: number,
  promoid?: string
) => {
  const data = {
    parentcate_id: parseInt(parentcate_id),
    childcate_id: childcate_id ? parseInt(childcate_id) : undefined,
    page: parseInt(page),
    show: parseInt(show),
    promoid: promoid ? parseInt(promoid) : undefined,
  };

  const skip = (data.page - 1) * data.show;
  const isFilter = Boolean(
    filtervalue?.color ||
      filtervalue?.other ||
      filtervalue?.selectpids ||
      filtervalue?.promo ||
      filtervalue?.search ||
      filtervalue?.parent_id ||
      filtervalue?.child_id
  );

  try {
    // Build where clause once
    const getWhereClause = () => {
      if (promoid) return { promotion_id: data.promoid };
      if (latestcate) return { createdAt: { gte: GetOneWeekAgoDate() } };
      if (all === "1") return {};

      if (data.parentcate_id && data.childcate_id) {
        return {
          AND: [
            { parentcategory_id: data.parentcate_id },
            { childcategory_id: data.childcate_id },
          ],
        };
      }

      if (data.parentcate_id !== 0 && !childcate_id) {
        return { parentcategory_id: data.parentcate_id };
      }

      if (!data.parentcate_id && data.childcate_id) {
        return { childcategory_id: data.childcate_id };
      }

      return {};
    };

    const whereClause = getWhereClause();
    const orderBy = { price: sort === 1 ? "asc" : "desc" } as const;

    // Optimized select clause - only get what we need
    const selectClause = {
      id: true,
      name: true,
      parentcategory_id: true,
      childcategory_id: true,
      discount: true,
      price: true,
      stock: true,
      stocktype: true,
      promotion: {
        select: {
          id: true,
          name: true,
          banner: true,
          expireAt: true,
        },
      },
      Variant: {
        select: {
          option_type: true,
          option_value: true,
        },
      },
      details: {
        select: {
          info_type: true,
          info_value: true,
        },
      },
      covers: {
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
        },
      },
    };

    // Use Promise.all for parallel queries when possible
    const [products, totalCount] = await Promise.all([
      Prisma.products.findMany({
        where: whereClause,
        orderBy,
        select: selectClause,
        ...(!isFilter && { skip, take: data.show }),
      }),
      !isFilter
        ? Prisma.products.count({ where: whereClause })
        : Promise.resolve(0),
    ]);

    let result = products;
    let countproduct = totalCount;

    // Handle autocategories fallback
    if (products.length === 0 && data.parentcate_id) {
      const autoProduct = await Prisma.parentcategories.findFirst({
        where: { id: data.parentcate_id },
        select: {
          autocategories: {
            orderBy: { product: { price: sort === 1 ? "asc" : "desc" } },
            select: { product: { select: selectClause } },
          },
        },
      });

      if (autoProduct?.autocategories) {
        const autoProducts = autoProduct.autocategories.map((i) => i.product);
        countproduct = autoProducts.length;
        result = isFilter
          ? autoProducts
          : (caculateArrayPagination(
              autoProducts,
              data.page,
              data.show
            ) as never);
      }
    }

    // Apply filters if needed
    if (isFilter && result.length > 0) {
      if (!filtervalue) return;
      // Pre-compile search term for better performance
      const searchTerm = filtervalue.search
        ? removeSpaceAndToLowerCase(filtervalue.search)
        : null;
      const promoNamesLower =
        filtervalue.promo?.map(removeSpaceAndToLowerCase) || [];
      const parentIds = new Set(
        filtervalue.parent_id?.map((id) => parseInt(id)) || []
      );
      const childIds = new Set(
        filtervalue.child_id?.map((id) => parseInt(id)) || []
      );
      const selectPids = new Set(filtervalue.selectpids || []);

      result = result.filter((prod) => {
        // Early returns for performance
        if (
          searchTerm &&
          !removeSpaceAndToLowerCase(prod.name).includes(searchTerm)
        )
          return false;
        if (filtervalue.selectpids && !selectPids.has(prod.id.toString()))
          return false;
        if (
          filtervalue.parent_id &&
          prod.parentcategory_id &&
          !parentIds.has(prod.parentcategory_id)
        )
          return false;
        if (
          filtervalue.child_id &&
          prod.childcategory_id &&
          !childIds.has(prod.childcategory_id)
        )
          return false;

        // Check promotion
        if (filtervalue.promo) {
          if (!prod.promotion?.name) return false;
          if (
            !promoNamesLower.includes(
              removeSpaceAndToLowerCase(prod.promotion.name)
            )
          )
            return false;
        }

        // Check variants
        if (filtervalue.color || filtervalue.other) {
          const hasMatchingVariant = prod.Variant.some((variant) => {
            if (filtervalue.color && variant.option_type === "COLOR") {
              const colorValues =
                variant.option_value as VariantColorValueType[];
              return colorValues.some((value) =>
                filtervalue.color!.includes(value.val)
              );
            }
            if (filtervalue.other && variant.option_type === "TEXT") {
              const textValues = variant.option_value as string[];
              return textValues.some((value) =>
                filtervalue.other!.includes(value)
              );
            }
            return false;
          });
          if (!hasMatchingVariant) return false;
        }

        return true;
      });

      countproduct = result.length;
      result = caculateArrayPagination(result, data.page, data.show) as never;
    }

    // Handle promotions with batch processing
    const inValidPromoProdIds: number[] = [];
    const processedResult = result.map((prod) => {
      if (prod.discount && prod.promotion?.expireAt) {
        const discountResult = calculateDiscountPrice({
          price: prod.price,
          discount: prod.discount,
          promoExpiry: prod.promotion.expireAt,
          id: prod.id,
        });

        if (discountResult?.id) {
          inValidPromoProdIds.push(discountResult.id);
        }

        return {
          ...prod,
          discount: discountResult?.newprice ? discountResult : prod.discount,
        };
      }
      return prod;
    });

    // Batch update invalid promotions
    if (inValidPromoProdIds.length > 0) {
      await updateProductPromotion(inValidPromoProdIds);
    }

    return {
      success: true,
      data: processedResult as unknown as ProductState[],
      count: Math.ceil(countproduct / data.show),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Problem Occured" };
  }
};

export interface ListproductCateType extends Parentcategories {
  sub?: Childcategories;
}
export const getCate = async (
  pid: string,
  cid?: string
): Promise<ListproductCateType | null> => {
  try {
    const categories = await Prisma.parentcategories.findUnique({
      where: { id: parseInt(pid) },
      select: {
        id: true,
        name: true,
        type: true,
        sub: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return {
      ...categories,
      sub: cid
        ? (categories?.sub.find((i) => i.id === parseInt(cid)) as never)
        : undefined,
    } as ListproductCateType;
  } catch (error) {
    console.log("Fetch categories", error);
    return null;
  }
};

export async function getSubCate(cid: string) {
  const id = parseInt(cid, 10);
  const subcate = await Prisma.childcategories.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      Parentcategories: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  });
  return subcate;
}

function getUniqueOptionValues(options: string[]) {
  // Use flatMap to combine all option_value arrays into one array
  const allValues = options;

  // Create a Set from the combined array to ensure uniqueness
  const uniqueValuesSet = new Set(allValues);

  // Convert the Set back to an array
  const uniqueValuesArray = Array.from(uniqueValuesSet);

  return uniqueValuesArray;
}
function getUniqueColor(
  options: VariantColorValueType[]
): VariantColorValueType[] {
  const uniqueValuesSet = new Set<string>();
  const uniqueOptions: VariantColorValueType[] = [];

  options.forEach((option) => {
    if (!uniqueValuesSet.has(option.val)) {
      uniqueValuesSet.add(option.val);
      uniqueOptions.push(option);
    }
  });

  return uniqueOptions;
}

export interface filtervaluetype {
  variant: {
    color: VariantColorValueType[];
    text: {
      id: number;
      option_title: string;
      option_value: string[];
    }[];
  };
  size?: string[];
  promotion?: string[];
  promo?: {
    id: number;
    name: string;
  }[];
  search?: string;
  category?: {
    parent: Array<SelectType>;
    child?: Array<SelectType>;
  };
}
export const getFilterValue = async (
  parent_id: number,
  child_id?: number,
  latest?: boolean
) => {
  try {
    const filtervalues: filtervaluetype = {
      variant: {
        color: [],
        text: [],
      },
      promo: [],
      promotion: [],
    };
    const result = await Prisma.products.findMany({
      where: !latest
        ? parent_id && !child_id
          ? {
              parentcategory_id: parent_id,
            }
          : parent_id && child_id
          ? {
              AND: [
                { parentcategory_id: parent_id },
                { childcategory_id: child_id },
              ],
            }
          : {}
        : {
            createdAt: {
              gte: GetOneWeekAgoDate(),
            },
          },

      select: {
        stocktype: true,
        stock: true,
        Variant: true,
        details: true,
        promotion: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (result.length === 0) {
      return null;
    }

    result.forEach((i) => {
      if (i.stocktype === "variant") {
        const color = i.Variant.filter(
          (j) => j.option_type === "COLOR"
        ).flatMap((j) => j.option_value) as VariantColorValueType[];
        const text = i.Variant.filter((j) => j.option_type === "TEXT");

        filtervalues.variant.color = [...filtervalues.variant.color, ...color];
        filtervalues.variant.text = [
          ...filtervalues.variant.text,
          ...text.map((i) => ({
            id: i.id,
            option_title: i.option_title,
            option_value: i.option_value as string[],
          })),
        ];
      }

      if (i.promotion) {
        filtervalues.promotion?.push(i.promotion.name);
      }
    });

    if (
      filtervalues.variant.color.length > 0 ||
      filtervalues.variant.text.length > 0
    ) {
      filtervalues.variant.color = getUniqueColor(filtervalues.variant.color);
      filtervalues.variant.text = filtervalues.variant.text.map((i) => ({
        ...i,
        option_value: getUniqueOptionValues(i.option_value),
      }));
    }

    if (filtervalues.promotion) {
      filtervalues.promotion = getUniqueOptionValues(filtervalues.promotion);

      result.forEach((prod) => {
        if (
          prod.promotion &&
          filtervalues.promotion?.includes(prod.promotion.name)
        ) {
          filtervalues.promo?.push(prod.promotion);
        }
      });
    }

    return filtervalues;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const GetBannerLink = cache(async (id: number) => {
  try {
    const banner = await Prisma.banner.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    return banner;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return null;
  }
});
