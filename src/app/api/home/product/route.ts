import Prisma from "@/src/lib/prisma";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";

interface paramsType {
  q?: string;
  limit?: string;
  ty?: string;
  pid?: string;
  cid?: string;
}

export async function GET(req: NextRequest) {
  try {
    const {
      q,
      limit = "5",
      pid,
      cid,
    } = extractQueryParams(req.nextUrl.toString()) as paramsType;
    const lt = parseInt(limit, 10);

    const product = await Prisma.products.findMany({
      where: {
        ...(pid && {
          OR: [
            { parentcategory_id: parseInt(pid, 10) },
            { Autocategory: { some: { autocategory_id: parseInt(pid, 10) } } },
          ],
        }),
        ...(q && {
          name: {
            contains: removeSpaceAndToLowerCase(q),
            mode: "insensitive",
          },
        }),
      },
      select: {
        id: true,
        name: true,
        promotion_id: true,
        childcategories: true,
        covers: {
          select: {
            type: true,
            name: true,
            url: true,
          },
        },
      },
      take: lt,
    });

    const filteredProduct = cid
      ? product.filter((i) => {
          if (i.promotion_id) {
            return parseInt(cid, 10) === i.promotion_id;
          } else {
            return i.childcategories?.id === parseInt(cid, 10);
          }
        })
      : product;

    return Response.json(
      {
        data: filteredProduct.map(({ id, name, covers }) => ({
          id,
          name,
          image: covers[0],
        })),
        isLimit: filteredProduct.length < lt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}
