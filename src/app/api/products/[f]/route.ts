import { GetAllProduct } from "@/src/lib/adminlib";
import Prisma from "../../../../lib/prisma";

import { NextRequest } from "next/server";

import { calculateDiscountProductPrice } from "@/src/lib/utilities";
import { VariantColorValueType } from "@/src/context/GlobalContext";

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
  pid?: number;
  po?: number;
  dc?: string;
  ds?: string;
  dt?: string;
  vr?: number;
  vs?: number;
  sp?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { f: string } }
) {
  const { ty, limit, q, pc, sk, cc, p, pid, po, dc, ds, dt, vr, vs, sp } =
    queryStringToObject(params.f) as paramsType;

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
      pid,
      po,
      dc,
      ds,
      dt,
      sp
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
      where: { id: pid },
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        stock: true,
        stocktype: true,
        Variant: true,
        Stock: true,
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
      varaintstock: product.Stock,
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
        product_id: pid,
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
        product_id: pid,
      },
      select: {
        id: true,
        qty: true,
        variant_val: true,
      },
    });

    response = Response.json(
      { data: { varaintstock: stock, variants: variant } },
      { status: 200 }
    );
  } else if (ty === "size") {
    const size = await Prisma.products.findUnique({
      where: { id: pid },
      select: {
        details: true,
      },
    });

    response = Response.json({ data: size?.details }, { status: 200 });
  } else {
    response = new Response(null, { status: 404 });
  }
  return response;
}
