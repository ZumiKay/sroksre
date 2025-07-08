"use server";

import Prisma from "./prisma";
import { Prisma as prisma } from "@prisma/client";
import { calculateDiscountPrice } from "./utilities";
import {
  ProductCategoriesType,
  ProductState,
  Stocktype,
} from "../context/GlobalType.type";

export type GetProductReturnType = {
  success: boolean;
  data?: unknown;
  total?: number;
  lowstock?: number;
  totalfilter?: number;
};

type GetProductParamsType = {
  limit: number;
  ty: string;
  page: number;
  query?: string;
  parent_cate?: number;
  sk?: string;
  child_cate?: number;
  promotionid?: number;
  priceorder?: number;
  detailcolor?: string;
  detailtext?: string;
  selectpromo?: number;
  promotionids?: Array<string>;
};

const LowStockValue = 5;

export const GetAllProduct = async ({
  limit,
  ty,
  page,
  query,
  parent_cate,
  sk,
  child_cate,
  promotionid,
  priceorder,
  detailcolor,
  detailtext,
  selectpromo,
  promotionids,
}: GetProductParamsType): Promise<GetProductReturnType> => {
  try {
    // Base where clause
    const where: prisma.ProductsWhereInput = {
      ...(query && {
        name: {
          contains: query,
          mode: "insensitive" as const,
        },
      }),
      ...(parent_cate && { parentcategory_id: parent_cate }),
      ...(child_cate && { childcategory_id: child_cate }),
      ...(promotionids && {
        promotion_id: {
          in: promotionids.map((id) => parseInt(id, 10)),
        },
      }),
      ...(selectpromo === 1 && !promotionids && { promotion_id: null }),
      ...(promotionid &&
        promotionid !== -1 && {
          OR: [{ promotion_id: null }, { promotion_id: promotionid }],
        }),
    };

    // Add low stock filter early
    if (ty === "filter" && sk === "Low") {
      where.OR = [
        {
          Stock: {
            some: { Stockvalue: { some: { qty: { lte: LowStockValue } } } },
          },
          stock: { lte: LowStockValue },
        },
      ];
    }

    // Detail type variant filter
    if (ty === "detail") {
      const colors = detailcolor?.split(",");
      const texts = detailtext?.split(",");
      where.Variant = {
        some: {
          OR: [
            ...(colors
              ? [
                  {
                    option_type: "COLOR",
                    option_value: { some: { val: { in: colors } } },
                  },
                ]
              : []),
            ...(texts
              ? [{ option_type: "TEXT", option_value: { contains: texts } }]
              : []),
          ],
        },
      } as never;
    }

    // Optimize select based on type
    const getSelectForType = (type: string): prisma.ProductsSelect => {
      const baseSelect: prisma.ProductsSelect = {
        id: true,
        name: true,
        price: true,
        discount: true,
        promotion_id: true,
        promotion: {
          select: { expireAt: true },
        },
        covers: {
          orderBy: { id: "asc" },
          select: { id: true, url: true, name: true },
        },
      };

      if (type === "filter" || type === "all") {
        return {
          ...baseSelect,
          stock: true,
          stocktype: true,
          parentcateogries: { select: { id: true, name: true } },
          childcategories: { select: { id: true, name: true } },
          Stock: {
            select: {
              id: true,
              Stockvalue: { select: { id: true, qty: true } },
            },
          },
        };
      }

      if (type === "detail") {
        return {
          ...baseSelect,
          stock: true,
          stocktype: true,
          parentcateogries: { select: { id: true, name: true } },
          childcategories: { select: { id: true, name: true } },
          Stock: {
            select: {
              id: true,
              Stockvalue: { select: { id: true, qty: true } },
            },
          },
          Variant: true,
          details: true,
        };
      }

      return baseSelect;
    };

    const select = getSelectForType(ty);

    // Execute both queries in parallel
    const [products, totalproduct] = await Promise.all([
      Prisma.products.findMany({
        where,
        select,
        orderBy: priceorder
          ? { price: priceorder === 1 ? "asc" : "desc" }
          : { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      Prisma.products.count({ where }),
    ]);

    let lowstock = 0;
    const result: ProductState[] = products.map((prod) => {
      const transformedProduct: Partial<ProductState> = {
        ...(prod as unknown as ProductState),
      };

      // Add category structure for filter/all/detail types
      if (ty === "filter" || ty === "all" || ty === "detail") {
        transformedProduct.category = {
          parent: prod.parentcateogries as ProductCategoriesType,
          child: prod.childcategories as ProductCategoriesType,
        };

        // Calculate low stock
        const isLowStock =
          (prod.Stock as unknown as Stocktype[])?.some((stock) =>
            stock.Stockvalue.some((val) => val.qty <= LowStockValue)
          ) ||
          (prod.stock && prod.stock <= LowStockValue);

        transformedProduct.lowstock = (isLowStock ?? false) as boolean;
        if (isLowStock) lowstock++;
      }

      // Handle discount calculation

      if (prod.discount && prod.promotion) {
        const discountResult = calculateDiscountPrice({
          price: prod.price as number,
          discount: prod.discount as unknown as number,
          promoExpiry: prod.promotion.expireAt as unknown as Date,
        });

        if (discountResult && discountResult.newprice) {
          transformedProduct.discount = discountResult;
        }
      }

      return transformedProduct as ProductState;
    });

    return {
      success: true,
      data: result,
      lowstock,
      total: Math.ceil(totalproduct / limit),
      totalfilter: totalproduct,
    };
  } catch (error) {
    console.error("Get Allproduct:", error);
    return { success: false, data: [], lowstock: 0, total: 0, totalfilter: 0 };
  }
};
