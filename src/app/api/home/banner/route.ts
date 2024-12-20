import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import Prisma from "@/src/lib/prisma";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { ContainerType } from "@/src/app/severactions/containeraction";

interface paramsType {
  q?: string;
  ty?: ContainerType;
  take?: string;
}
export async function GET(req: NextRequest) {
  try {
    const url = req.url.toString();
    const param = extractQueryParams(url);
    const { q, ty, take } = param as paramsType;
    const takeInt = parseInt(take ?? "5");
    const banner = await Prisma.banner.findMany({
      where: {
        name: q && {
          contains: removeSpaceAndToLowerCase(q),
          mode: "insensitive",
        },

        size:
          ty && ty === "category"
            ? { not: "normal" }
            : ty === "banner" || ty === "slide"
            ? { equals: "normal" }
            : {},
      },

      take: takeInt,
      select: {
        id: true,
        name: true,
        image: true,
        size: true,
        Containeritems: { orderBy: { id: "asc" }, select: { id: true } },
      },
    });
    const sortedBanners = banner.sort((a, b) => {
      const aHasContainerItem = a.Containeritems?.length > 0 ? 1 : 0;
      const bHasContainerItem = b.Containeritems?.length > 0 ? 1 : 0;
      return bHasContainerItem - aHasContainerItem;
    });

    return Response.json(
      {
        success: true,
        data: sortedBanners
          .map((i) => ({ ...i, type: i.size, size: undefined }))
          .filter((i) => i),
        isLimit: banner.length < takeInt,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { success: false, message: "Error Occured" },
      { status: 500 }
    );
  }
}
