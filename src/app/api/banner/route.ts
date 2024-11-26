import { BannerState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import {
  DeleteImageFromStorage,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { NextRequest } from "next/server";

export const generateLink = (
  linktype: string,
  parent_id?: number,
  child_id?: number,
  product?: number[],
  banner_id?: number,
  promotionid?: number
) => {
  const baseUrl = process.env.BASE_URL;
  switch (linktype) {
    case "parent":
      return `${baseUrl}/product?pid=${parent_id}&bid=${banner_id}`;
    case "sub":
      return `${baseUrl}/product?pid=${parent_id}&&cid=${child_id}&bid=${banner_id}`;
    case "product":
      return `${baseUrl}/product?pids=${product?.join(",")}&bid=${banner_id}`;
    case "promotion":
      return `${baseUrl}/product?promoid=${promotionid}`;
    default:
      return "";
  }
};

export async function POST(request: NextRequest) {
  try {
    const data: BannerState = await request.json();

    const create = await Prisma.banner.create({
      data: {
        name: data.name,
        image: data.image,
        type: data.type,
        size: data.size,
        selectedproduct_id: data.selectedproduct?.map((i) => i.value),
        parentcate_id: data.parentcate?.value as number,
        childcate_id: data.childcate?.value as number,
        linktype: data.linktype,
        link: "",
      },
    });

    if (data.linktype) {
      await Prisma.banner.update({
        where: { id: create.id },
        data: {
          link: generateLink(
            data.linktype,
            data.parentcate?.value as number,
            data.childcate?.value as number,
            data.selectedproduct?.map((i) => i.value) as number[],
            create.id
          ),
        },
      });
    }
    //remove temp image
    await Prisma.tempimage.deleteMany({ where: { name: data.image.name } });

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
  edittype?: string;
}

export async function PUT(request: NextRequest) {
  try {
    const updatedata: Updatebannerprops = await request.json();

    if (updatedata.id) {
      if (updatedata.edittype) {
        if (updatedata.edittype === "cover") {
          await Prisma.banner.update({
            where: { id: updatedata.id },
            data: {
              image: updatedata.image,
            },
          });
        }
      } else {
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
            size: updatedata.size,
            linktype: updatedata.linktype,
            link: updatedata.link,
            parentcate_id: updatedata.parentcate?.value as number,
            childcate_id: updatedata.childcate?.value as number,
            selectedproduct_id: updatedata.selectedproduct?.map((i) => i.value),
          },
        });
      }
    }

    await Prisma.tempimage.deleteMany({
      where: { name: updatedata.image.name },
    });
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

const getBannerData = async (id: Array<number>, model: any) => {
  const data = await model.findMany({
    where: {
      id: {
        in: id,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
  return data ? data.map((i: any) => ({ value: i.id, label: i.name })) : null;
};
export async function GET(request: NextRequest) {
  const params = request.url.toString();
  const param: {
    limit?: number;
    ty?: string;
    p?: number;
    q?: string;
    bty?: string;
    bs?: string;
    promoselect?: number;
  } = extractQueryParams(params);

  try {
    const total = await Prisma.banner.count({
      where: {
        type: param.bty,
        size: param.bs,
        name: param.q && {
          contains: removeSpaceAndToLowerCase(param.q),
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

    let result;
    if (param.ty === "edit") {
      result = await Prisma.banner.findUnique({
        where: { id: param.p },
      });

      if (
        result?.childcate_id ||
        result?.parentcate_id ||
        result?.selectedproduct_id
      ) {
        result = {
          ...result,
          name: result.name,
          type: result.type as any,
          image: result.image as any,
          parentcate: result.parentcate_id
            ? (
                await getBannerData(
                  [result.parentcate_id],
                  Prisma.parentcategories
                )
              )[0]
            : undefined,
          childcate: result.childcate_id
            ? (
                await getBannerData(
                  [result.childcate_id],
                  Prisma.childcategories
                )
              )[0]
            : undefined,
          selectedproduct: result.selectedproduct_id
            ? await getBannerData(
                result.selectedproduct_id as Array<number>,
                Prisma.products
              )
            : undefined,
        };
      }
    } else {
      result = await Prisma.banner.findMany({
        where: {
          type: param.bty,
          size: param.bs,
          name: param.q && {
            contains: removeSpaceAndToLowerCase(param.q),
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          image: true,
          size: true,
        },
        take: endIndex - startIndex + 1,
        skip: startIndex,
      });
    }

    return Response.json(
      {
        data: result,
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
