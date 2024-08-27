"use server";

import {
  ProductState,
  SelectType,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import {
  caculateArrayPagination,
  getDiscountedPrice,
  GetOneWeekAgoDate,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { cache } from "react";

export const GetListProduct = cache(
  async (
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
          ? data.parentcate_id !== 0 && !childcate_id
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
          promotion: {
            select: {
              id: true,
              name: true,
              banner: true,
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
                    promotion: {
                      select: {
                        id: true,
                        name: true,
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
                  },
                },
              },
            },
          },
        });

        products = (product?.autocategories.map((i) => i.product) as any) ?? [];
        totalproduct = products.length;
        products = caculateArrayPagination(
          products,
          parseInt(page),
          parseInt(show)
        );
      }

      if (isFilter) {
        //filter base on color & size & other (custom variants)

        console.log({ isFilter });
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
              (i) => prod.parentcategory_id === parseInt(i)
            );
          const isChild =
            filtervalue.child_id &&
            filtervalue.child_id.some(
              (i) => prod.childcategory_id === parseInt(i)
            );
          const isColor = filtervalue.color
            ? matchesVariant("COLOR", filtervalue.color)
            : false;
          const isText = filtervalue.other
            ? matchesVariant("TEXT", filtervalue.other)
            : false;

          const isPromo = filtervalue.promo
            ? prod.promotion &&
              filtervalue.promo.some(
                (i) =>
                  prod.promotion?.name &&
                  removeSpaceAndToLowerCase(i) ===
                    removeSpaceAndToLowerCase(prod.promotion?.name)
              )
            : false;

          const isName = filtervalue.search
            ? removeSpaceAndToLowerCase(prod.name).includes(
                removeSpaceAndToLowerCase(filtervalue.search)
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
          parseInt(show)
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
                }
          );

      isFilter && (products = filterproduct);
      let result = products.map((prod) => {
        if (prod.discount) {
          const discount = getDiscountedPrice(prod.discount, prod.price);
          return {
            ...prod,
            discount: { ...discount, newprice: discount.newprice.toFixed(2) },
          };
        }
        return { ...prod };
      }) as unknown as ProductState[];

      return {
        success: true,
        data: result,
        count: Math.ceil(countproduct / parseInt(show)),
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      return { success: false, error: "Problem Occured" };
    }
  }
);

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
  } catch (error) {
    return null;
  }
});
