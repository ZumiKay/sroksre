import { GetAllProduct } from "@/src/lib/adminlib";
import Prisma from "../../../../lib/prisma";

import { NextRequest } from "next/server";

import {
  calculateDiscountProductPrice,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { Stocktype, VariantColorValueType } from "@/src/context/GlobalContext";

function queryStringToObject(queryString: string) {
  const pairs = queryString.split("_");
  const result: any = {};

  pairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key !== "dc" && key !== "ds") {
      result[key] = isNaN(Number(value)) ? value : parseInt(value, 10);
      return;
    }
    result[key] = value;
  });

  return result;
}
interface paramsType {
  ty: string;
  limit: number;
  q?: string;
  pc?: number;
  cc?: number;
  sk?: string;
  p?: number;
  pid?: string; //Promotion id
  pids?: string; //Promotion Ids
  po?: number;
  dc?: string;
  ds?: string;
  dt?: string;
  vr?: number;
  vs?: number;
  sp?: number;
}
interface SubStockType {
  id?: number;
  qty: number;
  variant_val: string[];
}

const convertStockData = (stock: Stocktype[]) => {
  const lowstock = parseInt(process.env.LOWSTOCK ?? "3");

  const Stock = stock.map((i) => {
    const isLowStock = i.Stockvalue.some((sub) => sub.qty <= lowstock);

    return {
      id: i.id,
      Stockvalue: i.Stockvalue.flatMap((sub) => {
        return {
          id: sub.id,
          ...sub,
        };
      }),
      isLowStock,
    };
  });

  return Stock;
};
export async function GET(
  request: NextRequest,
  { params }: { params: { f: string } }
) {
  const { ty, limit, q, pc, sk, cc, p, pid, po, dc, ds, dt, vr, vs, sp, pids } =
    queryStringToObject(params.f) as paramsType;

  const productId = pid ? parseInt(pid, 10) : undefined;

  let response;
  if (ty === "all" || ty === "filter" || ty === "detail") {
    const allProduct = await GetAllProduct(
      limit,
      ty,
      p as number,
      q,
      pc,
      sk,
      cc,
      productId,
      po,
      dc,
      ds,
      dt,
      sp,
      pids?.toString()
    );

    const total = await Prisma.products.count();

    if (allProduct.success) {
      response = Response.json(
        {
          data: allProduct.data,
          total: total,
          totalpage: allProduct.total,
          lowstock: allProduct.lowstock,
          totalfilter: allProduct.totalfilter,
        },
        { status: 200 }
      );
    } else {
      response = Response.json({ message: "Error Occurred" }, { status: 500 });
    }
  } else if (ty === "getfilval") {
    const allfilter = await Prisma.products.findMany({
      where: {
        parentcategory_id: pc,
        childcategory_id: cc,
      },
      select: {
        Variant: true,
      },
    });
    let allval = {
      size: new Set<String>(),
      color: new Set<String>(),
      text: new Set<String>(),
    };

    allfilter.forEach((filval) => {
      filval.Variant.forEach((variant) => {
        if (variant.option_type === "COLOR") {
          const opt_val = variant.option_value as VariantColorValueType[];
          opt_val.map((i) => allval.color.add(i.val));
        } else if (variant.option_type === "TEXT") {
          const opt_val = variant.option_value as string[];
          opt_val.map((i) => allval.text.add(i));
        }
      });
    });
    const allvalarr = {
      text: Array.from(allval.text),
      size: Array.from(allval.size),
      color: Array.from(allval.color).filter((i) => i !== ""),
    };

    response = Response.json({ data: allvalarr }, { status: 200 });
  } else if (ty === "info") {
    const product = await Prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        stock: true,
        stocktype: true,
        Variant: {
          orderBy: { id: "asc" },
        },
        Stock: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            Stockvalue: {
              select: {
                id: true,
                qty: true,
                variant_val: true,
              },
            },
          },
        },
        description: true,
        parentcategory_id: true,
        childcategory_id: true,
        relatedproductId: true,
        promotion_id: true,
        details: true,
        relatedproduct: {
          select: {
            id: true,
            productId: true,
          },
        },
        covers: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
      },
    });

    if (!product) {
      return new Response(null, { status: 404 });
    }

    const otherProduct =
      product.relatedproductId && product.relatedproduct
        ? await Prisma.products.findMany({
            where: { id: { in: product.relatedproduct.productId as number[] } },
            select: {
              id: true,
              name: true,
              parentcategory_id: true,
              childcategory_id: true,
              covers: {
                select: {
                  id: true,
                  url: true,
                },
              },
            },
          })
        : [];

    const result: any = {
      ...product,
      discount: product.promotion_id
        ? product.discount
          ? calculateDiscountProductPrice({
              price: product.price,
              discount: product.discount,
            }).discount
          : undefined
        : undefined,
      category: {
        parent_id: product.parentcategory_id,
        child_id: product.childcategory_id,
      },
      variants: product.Variant,
      varaintstock: convertStockData(product.Stock as Stocktype[]),
      relatedproduct: otherProduct.filter((i) => i.id !== product.id),
      // Remove properties that are no longer needed
      parentcategory_id: undefined,
      childcategory_id: undefined,
      Variant: undefined,
      Stock: undefined,
    };

    return Response.json({ data: result }, { status: 200 });
  } else if (ty === "stock") {
    const variant = await Prisma.variant.findMany({
      where: {
        product_id: productId,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        option_title: true,
        option_type: true,
        option_value: true,
      },
    });
    const stock = await Prisma.stock.findMany({
      where: {
        product_id: productId,
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        Stockvalue: {
          select: {
            id: true,
            qty: true,
            variant_val: true,
          },
        },
      },
    });

    response = Response.json(
      {
        data: {
          varaintstock: convertStockData(stock as Stocktype[]),
          variants: variant,
        },
      },
      { status: 200 }
    );
  } else if (ty === "search") {
    if (!q) {
      return Response.json({ data: [] }, { status: 200 });
    }

    const searchproduct = await Prisma.products.findMany({
      where: {
        name: {
          contains: removeSpaceAndToLowerCase(q),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        covers: { select: { name: true, url: true } },
        parentcategory_id: true,
        childcategory_id: true,
        price: true,
        discount: true,
      },
    });
    let result = searchproduct.map((i) => ({
      ...i,
      price: calculateDiscountProductPrice({
        price: i.price,
        discount: i.discount ?? undefined,
      }),
      covers: i.covers[0],
    }));

    response = Response.json({ data: result }, { status: 200 });
  } else {
    response = new Response(null, { status: 404 });
  }
  return response;
}
