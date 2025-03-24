import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";
import { SearchAndSelectReturnType } from "@/src/context/GlobalType.type";

interface Paramtype {
  ty?: string;
  pid?: string;
  promoid?: string;
  take?: number;
  catetype?: string;
}

export async function GET(request: NextRequest) {
  const url = request.url.toString();
  const { ty, pid, promoid, take, catetype } = extractQueryParams(
    url
  ) as Paramtype;

  if (!ty)
    return Response.json({ message: "Type is required" }, { status: 400 });

  try {
    const result: SearchAndSelectReturnType | { [x: string]: any } = {};

    if (ty === "parent") {
      result.items = (
        await Prisma.parentcategories.findMany({
          where: catetype
            ? {
                type: catetype,
              }
            : {},
          select: {
            id: true,
            name: true,
          },
          take,
        })
      ).map((item) => ({ label: item.name, value: item.id }));

      if (take) {
        const parentcount = await Prisma.parentcategories.count();
        result.hasMore = parentcount > take;
      }

      return Response.json({ data: result }, { status: 200 });
    } else if (ty === "child" && pid) {
      result.items = (
        await Prisma.childcategories.findMany({
          where: {
            parentcategoriesId: parseInt(pid),
          },
          take,
        })
      ).map((item) => ({ label: item.name, value: item.id }));
      if (take) {
        const childcount = await Prisma.parentcategories.count();
        result.hasMore = childcount > take;
      }

      return Response.json({ data: result }, { status: 200 });
    } else if (ty === "promocate" && promoid) {
      const categories = await Prisma.products.findMany({
        where: { promotion_id: parseInt(promoid) },
        select: {
          parentcateogries: true,
          childcategories: true,
        },
      });
      return Response.json(
        {
          data: {
            parent: categories.map((i) => ({
              label: i.parentcateogries?.name,
              value: i.parentcateogries?.id,
            })),
            child: categories.map((i) => ({
              label: i.childcategories?.name,
              value: i.childcategories?.id,
            })),
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.log("Fetch Select Categories", error);
    return Response.json({ message: "Error occured" }, { status: 500 });
  }
}
