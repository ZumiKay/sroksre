import Prisma from "./prisma";
import { Prisma as prisma, Products } from "@prisma/client";
import { calculateDiscountPrice } from "./utilities";
import { ProductState } from "../context/GlobalType.type";

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

    const where: prisma.ProductsWhereInput | prisma.ProductsWhereUniqueInput = {
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

    // Common select clause
    const select: prisma.ProductsSelect = {
      id: true,
      name: true,
      price: true,
      discount: true,
      stock: true,
      stocktype: true,
      promotion_id: true,
      covers: {
        orderBy: { id: "asc" },
        select: { id: true, url: true, name: true },
      }, // Adjust fields as needed
      parentcateogries: { select: { id: true, name: true } },
      childcategories: { select: { id: true, name: true } },
      Stock: {
        select: { id: true, Stockvalue: { select: { id: true, qty: true } } },
      },
    };

    let totalproduct = 0;
    let allproduct: Array<Partial<Products | ProductState>> = [];
    let lowstock = 0;

    if (ty === "filter" || ty === "all") {
      // Add low stock filter
      if (sk === "Low") {
        where.OR = [
          {
            Stock: { some: { Stockvalue: { some: { qty: { lte: 5 } } } } },
            stock: { lte: 5 },
          },
        ];
      }

      const products = await Prisma.products.findMany({
        where,
        select: {
          ...select,
          Stock: {
            select: {
              id: true,
              Stockvalue: { select: { id: true, qty: true } },
            },
          },
        },
        orderBy: { price: priceorder === 1 ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      totalproduct = await Prisma.products.count({ where });
      allproduct = products.map((prod) => ({
        ...prod,
        category: {
          parent: prod.parentcateogries,
          child: prod.childcategories,
        },
        lowstock:
          prod.Stock.some((stock) =>
            stock.Stockvalue.some((val) => val.qty <= LowStockValue)
          ) ||
          (prod.stock && prod.stock <= LowStockValue),
      })) as unknown as Array<ProductState>;
      lowstock = allproduct.filter((p) => (p as ProductState)?.lowstock).length;
    } else if (ty === "detail") {
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

      const products = await Prisma.products.findMany({
        where,
        select: {
          ...select,
          Variant: true,
          details: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      totalproduct = await Prisma.products.count({ where });
      allproduct = products as never;
    } else {
      // Default case for promotionid handling
      const products = await Prisma.products.findMany({
        where,
        select: {
          id: true,
          discount: true,
          price: true,
          name: true,
          covers: select.covers,
          promotion_id: true,
        },
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      totalproduct = await Prisma.products.count({ where });
      allproduct = products as unknown as ProductState[];
    }

    // Transform results
    const result: ProductState[] = allproduct.map((product) => {
      const prod = product as Products;
      return {
        ...product,
        ...(prod.discount && {
          discount: calculateDiscountPrice(prod.price, prod.discount),
        }),
      } as ProductState;
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
