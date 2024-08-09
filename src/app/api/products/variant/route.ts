import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";
import { notFound } from "next/navigation";

interface paramtype {
  ty?: string;
  pid?: number;
}
export default async function GET(req: NextRequest) {
  try {
    const request = req.nextUrl.toString();
    const { ty, pid }: paramtype = extractQueryParams(request);
    let result;

    if (ty === "stock") {
      //check if the varaint already selected in stock

      const variant = await Prisma.variant.findMany({
        where: {
          product_id: pid,
        },
      });
      const stock = await Prisma.stock.findMany({
        where: {
          product_id: pid,
        },
        include: { Stockvalue: true },
      });

      if (stock.length > 0 || variant.length > 0) {
        return Response.json({ data: result }, { status: 200 });
      } else {
        return notFound();
      }
    } else if (ty === "variant") {
      const varaint = await Prisma.variant.findMany({
        where: { product_id: pid },
        select: {
          id: true,
          option_title: true,
          option_type: true,
          option_value: true,
        },
      });
      return Response.json({ data: varaint }, { status: 200 });
    } else {
      return notFound();
    }
  } catch (error) {
    console.log("Fetch Varant", error);
    return new Response(null, { status: 500 });
  }
}
