import { BannerState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import {
  DeleteImageFromStorage,
  calculatePagination,
} from "@/src/lib/utilities";
import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data: BannerState = await request.json();

    const create = await Prisma.banner.create({
      data: {
        name: data.name,
        image: data.image,
        type: data.type,
        show: data.show ?? false,
      },
    });
    //remove temp image
    await Prisma.tempimage.deleteMany({ where: { name: data.image.name } });
    revalidateTag("banner");
    return Response.json({ data: { id: create.id } }, { status: 200 });
  } catch (error) {
    console.log("Create Banner", error);
    return Response.json(
      { message: "Failed To Create Banner" },
      { status: 500 }
    );
  }
}

interface Updatebannerprops extends BannerState {
  Ids?: { id: number; show: boolean }[];
}

export async function PUT(request: NextRequest) {
  try {
    const updatedata: Updatebannerprops = await request.json();
    console.log(updatedata);
    if (updatedata.id) {
      const isBanner = await Prisma.banner.findUnique({
        where: {
          id: updatedata.id,
        },
      });
      if (!isBanner) {
        return new Response(null, { status: 404 });
      }
      await Prisma.banner.update({
        where: {
          id: isBanner.id,
        },
        data: {
          name: updatedata.name,
          type: updatedata.type,
          image: updatedata.image,
        },
      });
    } else if (updatedata.Ids) {
      await Promise.all(
        updatedata.Ids.map((i) =>
          Prisma.banner.update({
            where: { id: i.id },
            data: {
              show: i.show,
            },
          })
        )
      );
    }
    revalidateTag("banner");
    return Response.json({ message: "Banner Updated" }, { status: 200 });
  } catch (error) {
    console.log("Update Banner", error);
    return Response.json({ message: "Failed To Update" }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    //delete relation
    const isPromotion = await Prisma.promotion.count({
      where: { banner_id: id },
    });
    isPromotion !== 0 &&
      (await Prisma.promotion.updateMany({
        where: {
          banner_id: id,
        },
        data: {
          banner_id: null,
        },
      }));

    const isBanner = await Prisma.banner.findUnique({
      where: { id },
    });
    if (!isBanner) {
      return Response.json({ messasge: "Banner Not Found" }, { status: 500 });
    }

    const name =
      typeof isBanner.image === "object" &&
      isBanner.image &&
      "name" in isBanner.image &&
      isBanner.image.name;

    await DeleteImageFromStorage(name as string);
    await Prisma.banner.delete({ where: { id } });
    revalidateTag("banner");
    return Response.json({ message: "Banner Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Banner", error);
    return Response.json({ message: "Failed to Delete" }, { status: 500 });
  }
}

//GET BANNER

export function extractQueryParams(url: string) {
  const queryString = url.split("?")[1];

  if (!queryString) {
    return {};
  }

  const paramsArray = queryString.split("&");
  const queryParams: Record<string, string | number> = {};

  paramsArray.forEach((param) => {
    const [key, value] = param.split("=");
    queryParams[key] = isNaN(Number(value)) ? value : parseInt(value, 10);
  });

  return queryParams;
}
export async function GET(request: NextRequest) {
  const params = request.nextUrl.toString();
  const param: { limit?: number; ty?: string; p?: number; q?: string } =
    extractQueryParams(params);
  try {
    const total = await Prisma.banner.count({
      where:
        param.ty === "all"
          ? {}
          : {
              name: {
                contains: decodeURIComponent(param.q as string)
                  .toString()
                  .toLowerCase(),
                mode: "insensitive",
              },
            },
    });
    const itemperpage = param.limit ?? 0;
    const { startIndex, endIndex } = calculatePagination(
      total,
      param.limit as number,
      param.p as number
    );
    const banner =
      param.ty !== "edit"
        ? await Prisma.banner.findMany({
            where:
              param.ty === "all"
                ? {}
                : {
                    name: {
                      contains: decodeURIComponent(param.q as string)
                        .toString()
                        .toLowerCase(),
                      mode: "insensitive",
                    },
                  },
            select: {
              id: true,
              name: true,
              image: true,
              show: true,
            },
            take: endIndex - startIndex + 1,
            skip: startIndex,
          })
        : await Prisma.banner.findUnique({
            where: { id: param.p },
          });

    return Response.json(
      {
        data: banner,
        total: total,
        totalpage: Math.ceil(total / itemperpage),
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Fetch Banner", error);
    return Response.json(
      { message: "Failed To Fetch Banner" },
      { status: 500 }
    );
  }
}
