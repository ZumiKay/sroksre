import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { ContainerType } from "@/src/context/GlobalType.type";
import { BannerType } from "@/src/app/severactions/actions";

interface paramsType {
  q?: string;
  ty?: ContainerType;
  take?: string;
  bty?: BannerType;
}
export async function GET(req: NextRequest) {
  try {
    const url = req.url.toString();
    const param = extractQueryParams(url);
    const { q, ty, take, bty } = param as paramsType;
    const takeInt = parseInt(take ?? "5");
    const banner = await Prisma.banner.findMany({
      where: {
        AND: [
          {
            name: q && {
              contains: removeSpaceAndToLowerCase(q),
              mode: "insensitive",
            },
          },
          {
            size:
              ty && ty === "category"
                ? { not: "normal" }
                : ty === "banner" || ty === "slide"
                ? { equals: "normal" }
                : {},
          },
          {
            type: (ty || bty) && {
              equals: ty === "category" ? ty : bty,
            },
          },
        ],
      },

      take: takeInt,
      select: {
        id: true,
        name: true,
        Image: true,
        size: true,
        Containeritems: { orderBy: { id: "asc" }, select: { id: true } },
      },
    });
    const sortedBanners = banner.sort((a, b) => {
      const aHasContainerItem = a.Containeritems?.length > 0 ? 1 : 0;
      const bHasContainerItem = b.Containeritems?.length > 0 ? 1 : 0;
      return bHasContainerItem - aHasContainerItem;
    });

    const responseData = sortedBanners
      .filter((i) => i.id)
      .map((sort) => {
        return {
          id: sort.id,
          name: sort.name,
          size: sort.size,
          image: sort.Image?.url,
          type: sort.size,
        };
      });

    return Response.json(
      {
        success: true,
        data: responseData,
        isLimit: banner.length > takeInt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get Banner", error);
    return Response.json(
      { success: false, message: "Error Occured" },
      { status: 500 }
    );
  }
}
