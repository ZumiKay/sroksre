"use server";

import {
  ProductState,
  VariantValueObjType as VariantColorValueType,
} from "@/src/types/product.type";
import { PromotionState, SelectType } from "@/src/types/productAction.type";
import Prisma from "@/src/lib/prisma";
import {
  caculateArrayPagination,
  calculateDiscountProductPrice,
  GetOneWeekAgoDate,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { cache } from "react";

interface GetListProductReturnType {
  success: boolean;
  data?: Array<ProductState>;
  promotion?: PromotionState;
  count?: number;
  error?: string;
}

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
  promoid?: string,
): Promise<GetListProductReturnType> => {
  let data = {
    parentcate_id: parseInt(parentcate_id),
    childcate_id: childcate_id ? parseInt(childcate_id) : undefined,
    page: parseInt(page),
    show: parseInt(show),
    promoid: promoid ? parseInt(promoid) : undefined,
  };

  let filterproduct = [];

  // Calculate the offset
  const skip = (data.page - 1) * data.show;

  const isFilter =
    filtervalue?.color ||
    filtervalue?.other ||
    filtervalue?.selectpids ||
    filtervalue?.promo ||
    filtervalue?.search ||
    filtervalue?.parent_id ||
    filtervalue?.child_id;

  try {
    let totalproduct = 0;

    let products = await Prisma.products.findMany({
      where: promoid
        ? { promotion_id: data.promoid }
        : !latestcate
          ? !data.parentcate_id && data.childcate_id
            ? {
                childcategory_id: data.childcate_id,
              }
            : data.parentcate_id !== 0 && !childcate_id
              ? {
                  parentcategory_id: data.parentcate_id,
                }
              : data.parentcate_id !== 0 && childcate_id
                ? {
                    AND: {
                      parentcategory_id: data.parentcate_id,
                      childcategory_id: data.childcate_id,
                    },
                  }
                : all && all === "1"
                  ? {}
                  : {}
          : {
              createdAt: { gte: GetOneWeekAgoDate() },
            },

      orderBy: {
        price: sort ? (sort === 1 ? "asc" : "desc") : "asc",
      },
      select: {
        id: true,
        name: true,
        parentcategory_id: true,
        childcategory_id: true,
        discount: true,
        price: true,
        stock: true,
        stocktype: true,
        promotion_id: true,
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
      },
      ...(!isFilter
        ? {
            skip: skip,
            take: data.show,
          }
        : {}),
    });

    if (products.length === 0) {
      const product = await Prisma.parentcategories.findFirst({
        where: {
          id: data.parentcate_id,
        },

        select: {
          autocategories: {
            orderBy: {
              product: {
                price: sort === 1 ? "asc" : "desc",
              },
            },
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  parentcategory_id: true,
                  childcategory_id: true,
                  discount: true,
                  price: true,
                  stock: true,
                  stocktype: true,
                  promotion_id: true,
                  Variant: {
                    select: {
                      option_type: true,
                      option_value: true,
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
                },
              },
            },
          },
        },
      });

      products =
        (product?.autocategories
          .map((i) => i.product)
          .filter((prod): prod is NonNullable<typeof prod> =>
            Boolean(prod),
          ) as any) ?? [];
      totalproduct = products.length;
      products = caculateArrayPagination(
        products,
        parseInt(page),
        parseInt(show),
      );
    }

    if (isFilter) {
      //filter base on color & size & other (custom variants)

      products = products.filter((prod) => {
        const matchesVariant = (type: string, values?: string[]) => {
          if (!values) return false;

          return prod.Variant.some((variant) => {
            if (variant.option_type !== type) return false;

            if (type === "COLOR") {
              const val = variant.option_value as VariantColorValueType[];
              return val.some((value) => values.includes(value.val));
            } else {
              const val = variant.option_value as string[];
              return val.some((v) => values.includes(v));
            }
          });
        };

        const isParent =
          filtervalue.parent_id &&
          filtervalue.parent_id.some(
            (i) => prod.parentcategory_id === parseInt(i),
          );
        const isChild =
          filtervalue.child_id &&
          filtervalue.child_id.some(
            (i) => prod.childcategory_id === parseInt(i),
          );
        const isColor = filtervalue.color
          ? matchesVariant("COLOR", filtervalue.color)
          : false;
        const isText = filtervalue.other
          ? matchesVariant("TEXT", filtervalue.other)
          : false;

        const prodPromotion = (prod as any).promotion as
          | { name: string }
          | null
          | undefined;
        const isPromo = filtervalue.promo
          ? prodPromotion &&
            filtervalue.promo.some(
              (i) =>
                prodPromotion?.name &&
                removeSpaceAndToLowerCase(i) ===
                  removeSpaceAndToLowerCase(prodPromotion?.name),
            )
          : false;

        const isName = filtervalue.search
          ? removeSpaceAndToLowerCase(prod.name).includes(
              removeSpaceAndToLowerCase(filtervalue.search),
            )
          : false;

        const isProduct = filtervalue.selectpids
          ? filtervalue.selectpids.includes(prod.id.toString())
          : false;

        const conditions = [
          isColor,
          isText,
          isPromo,
          isName,
          isProduct,
          isParent,
          isChild,
        ];

        // Check if at least one condition is true
        return conditions.some((condition) => condition);
      });

      filterproduct = caculateArrayPagination(
        products,
        parseInt(page),
        parseInt(show),
      );
    }

    const countproduct = totalproduct
      ? totalproduct
      : isFilter
        ? products.length
        : await Prisma.products.count(
            all
              ? { where: {} }
              : {
                  where: promoid
                    ? { promotion_id: data.promoid }
                    : !latestcate
                      ? parentcate_id && !childcate_id
                        ? {
                            parentcategory_id: data.parentcate_id,
                          }
                        : parentcate_id && childcate_id
                          ? {
                              AND: {
                                parentcategory_id: data.parentcate_id,
                                childcategory_id: data.childcate_id,
                              },
                            }
                          : {}
                      : {
                          createdAt: {
                            gte: GetOneWeekAgoDate(),
                          },
                        },
                },
          );

    isFilter && (products = filterproduct);

    const safeProducts = products.filter(
      (prod): prod is NonNullable<typeof prod> => Boolean(prod),
    );

    let result =
      safeProducts.length > 0
        ? (safeProducts.map((prod) => {
            if (prod.discount) {
              const discount = calculateDiscountProductPrice({
                price: prod.price,
                discount: prod.discount,
              });
              return {
                ...prod,
                discount,
              };
            }
            return { ...prod };
          }) as unknown as ProductState[])
        : [];

    //If the child categories promotion category Fetch related promotion
    let promotion: PromotionState | undefined = undefined;
    const firstPromotionId = safeProducts[0]?.promotion_id;
    if (
      safeProducts.length > 0 &&
      firstPromotionId &&
      safeProducts.every((i) => i?.promotion_id === firstPromotionId)
    ) {
      promotion = (await Prisma.promotion.findUnique({
        where: { id: firstPromotionId as number },
        select: {
          id: true,
          name: true,
          expireAt: true,
          banner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      })) as unknown as PromotionState;
    }

    return {
      success: true,
      data: result,
      promotion,
      count: Math.ceil(countproduct / parseInt(show)),
    };
  } catch (error) {
    console.log("Error fetching products:", error);
    return { success: false, error: "Problem Occured" };
  }
};

export const getCate = async (pid: string, cid?: string) => {
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
      sub: cid && categories?.sub.find((i) => i.id === parseInt(cid)),
    };
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
  options: VariantColorValueType[],
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
  latest?: boolean,
) => {
  try {
    let filtervalues: filtervaluetype = {
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
        Variant: {
          where: {
            sectionId: null,
            optional: null,
          },
        },
        details: true,
        promotion_id: true,
      },
    });

    if (result.length === 0) {
      return null;
    }

    result.forEach((i) => {
      if (i.stocktype === "variant") {
        const color = i.Variant.filter(
          (j) => j.option_type === "COLOR",
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

    // Fetch unique promotions once instead of per-product
    const uniquePromoIds = [
      ...new Set(
        result
          .map((i) => (i as any).promotion_id)
          .filter((id): id is number => id != null),
      ),
    ];
    if (uniquePromoIds.length > 0) {
      const promotions = await Prisma.promotion.findMany({
        where: { id: { in: uniquePromoIds } },
        select: { id: true, name: true },
      });
      filtervalues.promotion = promotions.map((p) => p.name);
      filtervalues.promo = promotions;
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
  } catch (error) {
    return null;
  }
});
