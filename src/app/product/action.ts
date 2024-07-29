"use server";

import { infovaluetype, ProductState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import {
  caculateArrayPagination,
  getDiscountedPrice,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { cache } from "react";

export const GetListProduct = cache(
  async (
    page: string,
    show: string,
    parentcate_id: string,
    childcate_id?: string,
    filtervalue?: {
      color?: string[];
      size?: string[];
      other?: string[];
      promo?: string[];
      search?: string;
      selectpids?: string[];
    }
  ) => {
    let data = {
      parentcate_id: parseInt(parentcate_id),
      childcate_id: childcate_id ? parseInt(childcate_id) : undefined,
      page: parseInt(page),
      show: parseInt(show),
    };

    let filterproduct = [];

    // Calculate the offset
    const skip = (data.page - 1) * data.show;

    const isFilter =
      filtervalue?.color ||
      filtervalue?.other ||
      filtervalue?.size ||
      filtervalue?.selectpids ||
      filtervalue?.promo;

    try {
      let totalproduct = 0;

      let products = await Prisma.products.findMany({
        where:
          data.parentcate_id !== 0 && !childcate_id
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
            : {},
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

        products = products.filter((prod) => {
          const matchesVariant = (type: string, values?: string[]) =>
            values &&
            prod.Variant.some(
              (variant) =>
                variant.option_type === type &&
                variant.option_value.some((value) => values.includes(value))
            );

          const isColor = matchesVariant("COLOR", filtervalue.color);
          const isText = matchesVariant("TEXT", filtervalue.other);

          const Sizes = prod.details
            .filter((i) => i.info_type === "SIZE")
            .map((i) => i.info_value) as unknown as infovaluetype[];

          const isSize =
            filtervalue.size &&
            Sizes.some((i) => filtervalue.size?.includes(i.val));

          const isPromo =
            filtervalue.promo &&
            prod.promotion &&
            filtervalue.promo.includes(prod.promotion.id.toString());

          const isName =
            filtervalue.search &&
            removeSpaceAndToLowerCase(prod.name).includes(
              removeSpaceAndToLowerCase(filtervalue.search)
            );

          const isProduct =
            filtervalue.selectpids &&
            filtervalue.selectpids.includes(prod.id.toString());

          const conditions = [
            filtervalue.color ? isColor : true,
            filtervalue.other ? isText : true,
            filtervalue.size ? isSize : true,
            filtervalue.promo ? isPromo : true,
            filtervalue.search ? isName : true,
            filtervalue.selectpids ? isProduct : true,
          ];

          return conditions.every((condition) => condition);
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
        : await Prisma.products.count({
            where:
              parentcate_id && !childcate_id
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
                : {},
          });

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

export interface filtervaluetype {
  variant: {
    color: string[];
    text: string[];
  };
  size?: string[];
  promotion?: string[];
  promo?: {
    id: number;
    name: string;
  }[];
  search?: string;
}
export const getFilterValue = async (parent_id: number, child_id?: number) => {
  try {
    let filtervalues: filtervaluetype = {
      variant: {
        color: [""],
        text: [""],
      },
      promo: [],
      promotion: [],
    };
    const result = await Prisma.products.findMany({
      where:
        parent_id && !child_id
          ? {
              parentcategory_id: parent_id,
            }
          : parent_id && child_id
          ? {
              AND: {
                parentcategory_id: parent_id,
                childcategory_id: child_id,
              },
            }
          : {},

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
      if (i.stocktype === "size") {
        const size = i.details
          .filter((j) => j.info_type === "SIZE")
          .map((i) => i.info_value) as unknown as infovaluetype[];
        filtervalues.size = size.map((i) => i.val);
      } else if (i.stocktype === "variant") {
        const color = i.Variant.filter(
          (j) => j.option_type === "COLOR"
        ).flatMap((j) => j.option_value);
        const text = i.Variant.filter((j) => j.option_type === "TEXT").flatMap(
          (j) => j.option_value
        );

        filtervalues.variant.color = color;
        filtervalues.variant.text = text;
      }

      if (i.promotion) {
        filtervalues.promotion?.push(i.promotion.name);
      }
    });

    if (
      filtervalues.variant.color.length > 0 ||
      filtervalues.variant.text.length > 0
    ) {
      filtervalues.variant.color = getUniqueOptionValues(
        filtervalues.variant.color
      );
      filtervalues.variant.text = getUniqueOptionValues(
        filtervalues.variant.text
      );
    }
    filtervalues.size &&
      (filtervalues.size = getUniqueOptionValues(filtervalues.size));

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
