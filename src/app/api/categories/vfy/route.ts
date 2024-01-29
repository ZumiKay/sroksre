import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();
    const params: { pcid?: number; ccid?: number } = extractQueryParams(URL);
    const cate = await Prisma.parentcategories.findUnique({
      where: {
        id: params.pcid,
      },
      select: {
        id: true,
        name: true,
      },
    });
    if (cate) {
      if (params.ccid) {
        const subcate = await Prisma.childcategories.findUnique({
          where: { id: params.ccid },
          select: {
            id: true,
            name: true,
          },
        });
        if (!subcate) {
          return new Response(null, { status: 404 });
        }
        return Response.json(
          { data: { ...cate, sub: subcate } },
          { status: 200 }
        );
      }
      return Response.json({ data: cate, valid: true }, { status: 200 });
    }
    return new Response(null, { status: 404 });
  } catch (error) {
    console.log("Vfy Cate", error);
    return Response.error();
  } finally {
    await Prisma.$disconnect();
  }
}
