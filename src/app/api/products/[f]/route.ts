import { GetAllProduct } from "@/src/lib/adminlib";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";

function queryStringToObject(queryString: string) {
  const pairs = queryString.split("_");
  const result: any = {};

  pairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    result[key] = isNaN(Number(value)) ? value : parseInt(value, 10);
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { f: string } },
) {
  const { ty, limit, q, pc, sk, cc, p } = queryStringToObject(
    params.f,
  ) as paramsType;

  let response;
  if (ty === "all" || ty === "filter") {
    const allProduct = await GetAllProduct(
      limit,
      ty,
      p as number,
      q,
      pc,
      sk,
      cc,
    );

    if (allProduct.success) {
      response = Response.json(
        {
          data: allProduct.data,
          total: allProduct.total,
        },
        { status: 200 },
      );
    } else {
      response = Response.json({ message: "Error Occurred" }, { status: 500 });
    }
  } else {
    response = Response.json({ message: "Type is Undefined" }, { status: 500 });
  }

  return response;
}
