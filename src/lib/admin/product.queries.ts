import Prisma from "../prisma";
import {
  caculateArrayPagination,
  removeSpaceAndToLowerCase,
} from "../utilities";
import { VariantValueObjType } from "../../types/product.type";

type GetProductReturnType = {
  success: boolean;
  data?: unknown[];
  total?: number;
  lowstock?: number;
  totalfilter?: number;
};

type FilterableProduct = {
  name: string;
  parentcategory_id: number | null;
  childcategory_id: number | null;
  stock: number | null;
  Stock?: Array<{ Stockvalue: Array<{ qty: number }> }>;
};

type InventoryFilters = {
  query?: string;
  parent_cate?: number;
  child_cate?: number;
  sk?: string;
};

const isLowStockProduct = (prod: FilterableProduct): boolean => {
  if (prod.Stock && prod.Stock.length > 0) {
    return prod.Stock.some((stock) => stock.Stockvalue.some((v) => v.qty <= 5));
  }
  return prod.stock !== null && prod.stock !== undefined && prod.stock <= 5;
};

const matchesInventoryFilters = (
  prod: FilterableProduct,
  { query, parent_cate, child_cate, sk }: InventoryFilters,
): boolean => {
  if (
    query &&
    !removeSpaceAndToLowerCase(prod.name).includes(
      removeSpaceAndToLowerCase(query.toString()),
    )
  ) {
    return false;
  }
  if (parent_cate && prod.parentcategory_id !== parent_cate) return false;
  if (child_cate && prod.childcategory_id !== child_cate) return false;
  if (sk === "Low" && !isLowStockProduct(prod)) return false;
  return true;
};

/**
 * Units in stock. Variant products keep their quantities per combination and
 * leave the product's own `stock` column at 0, so sum the combinations.
 */
const totalStock = (prod: FilterableProduct): number | null =>
  prod.Stock && prod.Stock.length > 0
    ? prod.Stock.reduce(
        (sum, stock) =>
          sum + stock.Stockvalue.reduce((sub, v) => sub + v.qty, 0),
        0,
      )
    : prod.stock;

const filterAndFlag = <T extends FilterableProduct>(
  products: T[],
  filters: InventoryFilters,
) =>
  products
    .filter((prod) => matchesInventoryFilters(prod, filters))
    .map((prod) => ({
      ...prod,
      stock: totalStock(prod),
      lowstock: isLowStockProduct(prod),
    }));

const putSelectedFirst = <T extends { id: number }>(
  items: T[],
  ids?: number[],
): T[] => {
  if (!ids || ids.length === 0) return items;
  const rank = new Map(ids.map((id, idx) => [id, idx]));
  const picked = items
    .filter((item) => rank.has(item.id))
    .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  return [...picked, ...items.filter((item) => !rank.has(item.id))];
};

const mapWithDiscount = <T extends { price: number; discount: number | null }>(
  products: T[],
) =>
  products.map((i) => ({
    ...i,
    ...(i.discount && {
      discount: {
        percent: i.discount,
        newprice: (i.price - (i.price * i.discount) / 100).toFixed(2),
      },
    }),
  }));

const splitList = (value?: string) =>
  value && value.includes(",") ? value.split(",") : [value];

const coversById = { orderBy: { id: "asc" } } as const;

type ListArgs = {
  filters: InventoryFilters;
  promotionids?: string;
  selectedids?: number[];
};

/** Inventory list: every product, optionally narrowed to some promotions. */
const listInventoryProducts = async ({
  filters,
  promotionids,
  selectedids,
  selectpromo,
  priceorder,
}: ListArgs & { selectpromo?: number; priceorder?: number }) => {
  const products = await Prisma.products.findMany({
    where: {
      ...(!promotionids && selectpromo === 1 ? { promotion_id: null } : {}),
      ...(promotionids
        ? {
            promotion: {
              id: {
                in: promotionids.split(",").map((i) => parseInt(i, 10)),
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      covers: coversById,
      price: true,
      stock: true,
      discount: true,
      Stock: {
        select: { id: true, Stockvalue: { select: { id: true, qty: true } } },
      },
      stocktype: true,
      details: true,
      parentcategory_id: true,
      childcategory_id: true,
      promotion_id: true,
      promotion: true,
    },
    orderBy: { price: priceorder === 1 ? "asc" : "desc" },
  });

  return putSelectedFirst(filterAndFlag(products, filters), selectedids);
};

/** Products that can be picked for one promotion: unassigned ones plus its own. */
const listPromotionProducts = async ({
  filters,
  promotionids,
  selectedids,
  promotionid,
}: ListArgs & { promotionid: number }) => {
  const products = await Prisma.products.findMany({
    where: {
      OR: [{ promotion_id: null }, { promotion_id: promotionid }],
      ...(promotionids ? { promotion_id: parseInt(promotionids, 10) } : {}),
    },
    select: {
      id: true,
      discount: true,
      price: true,
      name: true,
      covers: coversById,
      promotion_id: true,
      stock: true,
      parentcategory_id: true,
      childcategory_id: true,
      Stock: { select: { Stockvalue: { select: { qty: true } } } },
    },
    orderBy: { id: "asc" },
  });

  return putSelectedFirst(filterAndFlag(products, filters), selectedids);
};

/** Products in a category that have one of the given colours or text options. */
const listProductsByDetail = async ({
  parent_cate,
  child_cate,
  detailcolor,
  detailtext,
}: {
  parent_cate?: number;
  child_cate?: number;
  detailcolor?: string;
  detailtext?: string;
}) => {
  const colors = splitList(detailcolor);
  const texts = splitList(detailtext);

  const products = await Prisma.products.findMany({
    where: {
      parentcategory_id: parent_cate ?? undefined,
      childcategory_id: child_cate ?? undefined,
    },
    include: { details: true, Variant: true, covers: true },
  });

  return products.filter((product) => {
    const color = product.Variant.find((v) => v.option_type === "COLOR");
    if (!color) return false;
    const text = product.Variant.find((v) => v.option_type === "TEXT");

    const productColors = (color.option_value as VariantValueObjType[])
      .filter((value) => value.val !== "")
      .map((value) => value.val.replace("#", ""));
    const productTexts = (text?.option_value as string[] | undefined)?.map(
      (value) => removeSpaceAndToLowerCase(value),
    );

    return (
      colors.some((item) => productColors.includes(item as string)) ||
      Boolean(
        productTexts &&
        texts.some((item) => productTexts.includes(item as string)),
      )
    );
  });
};

export const GetAllProduct = async (
  limit: number,
  ty: string,
  page: number,
  query?: string,
  parent_cate?: number,
  sk?: string,
  child_cate?: number,
  promotionid?: number,
  priceorder?: number,
  detailcolor?: string,
  detailtext?: string,
  selectpromo?: number,
  promotionids?: string,
  selectedids?: number[],
): Promise<GetProductReturnType> => {
  try {
    const filters = { query, parent_cate, child_cate, sk };
    const forPromotion = Boolean(promotionid && promotionid !== -1);

    let products: Array<{
      price: number;
      discount: number | null;
      lowstock?: boolean;
    }> = [];

    if (forPromotion) {
      products = await listPromotionProducts({
        filters,
        promotionids,
        selectedids,
        promotionid: promotionid as number,
      });
    } else if (ty === "filter" || ty === "all") {
      products = await listInventoryProducts({
        filters,
        promotionids,
        selectedids,
        selectpromo,
        priceorder,
      });
    } else if (ty === "detail") {
      products = await listProductsByDetail({
        parent_cate,
        child_cate,
        detailcolor,
        detailtext,
      });
    }

    return {
      success: true,
      data: mapWithDiscount(caculateArrayPagination(products, page, limit)),
      lowstock: products.filter((p) => p.lowstock).length,
      total: Math.ceil(products.length / limit),
      totalfilter: products.length,
    };
  } catch (error) {
    console.error("Get Allproduct", error);
    return { success: false };
  }
};
