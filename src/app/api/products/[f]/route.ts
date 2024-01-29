import { infovaluetype } from "@/src/context/GlobalContext";
import { GetAllProduct } from "@/src/lib/adminlib";
import Prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";
import { NextRequest } from "next/server";

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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { f: string } }
) {
  const { ty, limit, q, pc, sk, cc, p, pid, po, dc, ds } = queryStringToObject(
    params.f
  ) as paramsType;

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
      ds
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
      include: {
        details: true,
      },
    });
    let allval = {
      size: new Set<String>(),
      color: new Set<String>(),
    };

    allfilter.forEach((item) => {
      item.details.forEach((detail) => {
        if (detail.info_type === "SIZE" || detail.info_type === "COLOR") {
          detail.info_type === "SIZE" &&
            detail?.info_value?.forEach((value) => allval.size.add(value));
          detail.info_type === "COLOR" &&
            detail.info_value.forEach((value) => allval.color.add(value));
        }
      });
    });
    let allvalarr = {
      size: Array.from(allval.size),
      color: Array.from(allval.color).filter((i) => i !== ""),
    };

    response = Response.json({ data: allvalarr }, { status: 200 });
  } else if (ty === "info") {
    let result: any = {};
    const product = await Prisma.products.findUnique({
      where: { id: pid },
      include: {
        details: true,
        covers: true,
      },
    });
    if (!product) {
      response = new Response(null, { status: 404 });
    } else {
      if (product.discount) {
        result = product;

        result.discount = {
          percent: parseFloat(result.discount.toString()) * 100,
          newPrice: (
            parseFloat(result.price.toString()) -
            (parseFloat(result.price.toString()) *
              parseFloat(result.discount.toString())) /
              100
          ).toFixed(2),
        };
      } else {
        result = product;
      }
      result.category = {
        parent_id: result.parentcategory_id,
        child_id: result.childcategory_id,
      };
      delete result.parentcategory_id;
      delete result.childcategory_id;

      response = Response.json({ data: result }, { status: 200 });
    }
  } else {
    response = new Response(null, { status: 404 });
  }

  await Prisma.$disconnect();

  return response;
}
