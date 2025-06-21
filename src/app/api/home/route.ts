import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import { Prisma as PrismaType } from "@prisma/client";
import {
  ContainerType,
  Homeitemtype,
  ImageDatatype,
} from "@/src/context/GlobalType.type";
import { Homecontainer } from "@prisma/client";
import { fetchContainerById, HomeDetailUpdate } from "./extendRoute";
import { calculateDiscountPrice } from "@/src/lib/utilities";

interface Paramtype {
  ty?: string;
  id?: string;
}

interface covertype {
  name: string;
  url: string;
}
interface formatContainerType extends Homecontainer {
  item: {
    id: number;
    product_id?: number;
    banner_id?: number;
    product?: {
      id: number;
      name: string;
      covers: Array<ImageDatatype>;
      price: number;
      discount: number;
    };
    banner?: {
      id: number;
      name: string;
      type: string;
      image: covertype;
      link?: string;
      size: string;
      parentcate_id: number;
      childcate_id: number;
      selectedproduct_id: number[];
      promotionId?: number;
    };
  }[];
}

export function formatContainer(result: formatContainerType) {
  return {
    id: result.id,
    idx: result.idx,
    amountofitem: result.amountofitem || undefined,
    scrollabletype: result.scrollabletype as never,
    name: result.name ?? "",
    daterange: result.daterange,
    type: result.type as ContainerType,
    items: result?.item?.map((i) =>
      i.banner
        ? {
            id: i.id,
            item: {
              id: i.banner.id,
              name: i.banner.name,
              image: i.banner.image,
              link: i.banner.link,
              type: i.banner.size,
              parent_id: i.banner.parentcate_id,
              child_id: i.banner.childcate_id,
              product_id: i.banner.selectedproduct_id,
              promotionId: i.banner.promotionId,
            },
          }
        : {
            id: i.id,
            item: {
              id: i.product?.id,
              name: i.product?.name,
              image: i.product?.covers[0],
              price:
                i.product?.price &&
                calculateDiscountPrice(i.product?.price, i.product?.discount),
            },
          }
    ),
  };
}

const CheckCreateReq = (data: Homeitemtype) =>
  !data.name || !data.type || !data.items || data.items.length === 0;

export async function POST(req: NextRequest) {
  try {
    const createData = (await req.json()) as Homeitemtype;

    if (CheckCreateReq(createData)) {
      return Response.json({ error: "Invalid Param" }, { status: 400 });
    }

    await Prisma.homecontainer.create({
      data: {
        ...createData,
        items: {
          createMany: {
            data: createData.items as never,
          },
        },
      },
    });

    return Response.json({ message: "Item Created" }, { status: 200 });
  } catch (error) {
    console.log("Create HomeContainer", error);
    return Response.json({ error: "Error Occured" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = request.url.toString();
  const { ty, id } = extractQueryParams(url) as Paramtype;

  if (ty && ty !== "normal" && ty !== "item" && ty !== "short") {
    return Response.json({ message: "Invalid Request" }, { status: 400 });
  }

  try {
    if (id) {
      const result = await fetchContainerById(id, ty as never);

      if (!result) {
        return Response.json(
          { message: "Container Not Found" },
          { status: 500 }
        );
      }

      return Response.json({ data: result }, { status: 200 });
    } else {
      const results = await Prisma.homecontainer.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          idx: true,
        },
        orderBy: {
          idx: "asc",
        },
      });

      return Response.json({ data: results }, { status: 200 });
    }
  } catch (error) {
    console.error("Get container error", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}

interface editrequest {
  ty?: "order" | "info" | "containeritems";
  editItem?: Homeitemtype;
  orderItems?: Array<Pick<Homeitemtype, "id" | "idx">>;
}

export async function PUT(req: Request) {
  try {
    const updateData: editrequest = await req.json();
    if (updateData.ty !== "order" && !updateData.editItem?.id) {
      return Response.json({ error: "Invalid Request" }, { status: 400 });
    }

    const defaultSelectParam: PrismaType.HomecontainerSelect = {
      id: true,
      idx: true,
      ...(updateData.ty === "info" && {
        name: true,
        scrollabletype: true,
        amountofitem: true,
        daterange: true,
        items: true,
      }),
    };

    const Items =
      updateData.ty === "order"
        ? await Prisma.homecontainer.findMany({
            select: { id: true, idx: true },
          })
        : await Prisma.homecontainer.findUnique({
            where: {
              id: updateData.editItem?.id,
            },
            select: defaultSelectParam,
          });

    if (!Items) {
      return Response.json({ data: "No Item" }, { status: 404 });
    }

    switch (updateData.ty) {
      case "order":
        if (updateData.orderItems)
          await Promise.all(
            updateData.orderItems.map((item) =>
              Prisma.homecontainer.update({
                where: { id: item.id },
                data: { idx: item.idx },
              })
            )
          );

        break;
      case "info":
        if (updateData.editItem) {
          const updateProcess = await HomeDetailUpdate(
            updateData.editItem,
            Items as unknown as Homeitemtype
          );
          if (!updateProcess) {
            return Response.json(
              { error: "Can't Update Items" },
              { status: 500 }
            );
          }
        }

        break;

      default:
        return Response.json({ error: "Invalid Param" }, { status: 400 });
    }

    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.error("Edit container error:", error);
    return Response.json(
      { success: false, message: "Error Occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const data: { id?: string[] } = await req.json();

    if (!data.id) {
      return Response.json({ message: "Invalid Request" }, { status: 403 });
    }

    await Prisma.containeritems.deleteMany({
      where: {
        homecontainerId: { in: data.id.map((i) => parseInt(i.toString())) },
      },
    });

    await Prisma.homecontainer.deleteMany({
      where: { id: { in: data.id.map((i) => parseInt(i)) } },
    });

    return Response.json({ message: "Container Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete container error", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
