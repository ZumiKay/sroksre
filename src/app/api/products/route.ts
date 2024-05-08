import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";

export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();
    const params: { pc?: number; cc?: number; lt?: number; p?: number } =
      extractQueryParams(URL);

    const product = await Prisma.products.findMany({
      where: {
        parentcategory_id: params.pc,
        childcategory_id: params.cc,
      },
      include: {
        covers: true,
      },
    });

    return Response.json({ data: product }, { status: 200 });
  } catch (error) {
    console.log("Fetch Product", error);
    return Response.error();
  }
}
