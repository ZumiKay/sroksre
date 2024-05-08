import { GetAllProduct } from "@/src/lib/adminlib";
import Prisma from "../../../../lib/prisma";

import { NextRequest } from "next/server";
import { ProductState } from "@/src/context/GlobalContext";

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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { f: string } }
) {
  const { ty, limit, q, pc, sk, cc, p, pid, po, dc, ds, dt, vr, vs } =
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
      dt
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
          variant.option_value.map((i) => allval.color.add(i));
        } else if (variant.option_type === "TEXT") {
          variant.option_value.map((i) => allval.text.add(i));
        } else {
          variant.option_value.map((i) => allval.size.add(i));
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
      include: {
        details: true,
        covers: true,
        Variant: true,
        Stock: true,
        Orderproduct: true,
        relatedproduct: {
          select: {
            id: true,
            productId: true,
          },
        },
      },
    });

    if (!product) {
      return new Response(null, { status: 404 });
    }

    const result: any = {
      ...product,
      category: {
        parent_id: product.parentcategory_id,
        child_id: product.childcategory_id,
      },
      stocktype: product.stocktype,
      variants: product.Variant,
      varaintstock: product.Stock,
      Variant: undefined,
      Stock: undefined,
      parentcategory_id: undefined,
      childcategory_id: undefined,
    };

    if (product.discount) {
      result.discount = {
        percent: product.discount,
        newPrice: (
          parseFloat(product.price.toString()) -
          (parseFloat(product.price.toString()) *
            parseFloat(product.discount.toString())) /
            100
        ).toFixed(2),
      };
    }
    if (product.relatedproduct) {
      const ids = product.relatedproduct?.productId as number[];
      result.relatedproduct = await Prisma.products.findMany({
        where: {
          id: {
            in: ids.filter((i) => i !== pid),
          },
        },
        select: {
          id: true,
          name: true,
          parentcategory_id: true,
          childcategory_id: true,
          covers: {
            select: {
              url: true,
            },
          },
        },
      });
    }
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
