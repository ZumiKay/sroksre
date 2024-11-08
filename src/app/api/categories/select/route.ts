import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";

interface Paramtype {
  ty?: string;
  pid?: string;
  promoid?: string;
}
export async function GET(request: NextRequest) {
  const url = request.url.toString();
  const { ty, pid, promoid } = extractQueryParams(url) as Paramtype;

  if (!ty)
    return Response.json({ message: "Type is required" }, { status: 400 });

  try {
    if (ty === "parent") {
      const parentcategories = await Prisma.parentcategories.findMany({
        select: {
          id: true,
          name: true,
        },
      });
      return Response.json(
        { data: parentcategories.map((i) => ({ label: i.name, value: i.id })) },
        { status: 200 }
      );
    } else if (ty === "child" && pid) {
      const childcategories = await Prisma.childcategories.findMany({
        where: {
          parentcategoriesId: parseInt(pid),
        },
      });

      return Response.json(
        {
          data: childcategories.map((i) => ({
            label: i.name,
            value: i.pid ?? i.id,
          })),
        },
        { status: 200 }
      );
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
