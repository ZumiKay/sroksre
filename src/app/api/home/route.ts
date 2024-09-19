import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import {
  ContainerType,
  Containertype,
  Homeitemtype,
} from "../../severactions/containeraction";
import { Homecontainer } from "@prisma/client";
import {
  caculateArrayPagination,
  calculateDiscountProductPrice,
} from "@/src/lib/utilities";
import { ProductState } from "@/src/context/GlobalContext";
import { calculatePopularityScore } from "../categories/route";

interface Paramtype {
  ty?: "short" | "detail";
  id?: string;
}

export function SortProductByPopularScore(
  product: Array<
    Record<
      keyof Pick<
        ProductState,
        "id" | "amount_incart" | "amount_sold" | "amount_wishlist"
      >,
      number
    >
  >
) {
  return product
    ?.map((prod) => {
      const score = calculatePopularityScore({
        amount_incart: prod.amount_incart ?? 0,
        amount_sold: prod.amount_sold ?? 0,
        amount_wishlist: prod.amount_wishlist ?? 0,
      });
      return { id: prod.id, score };
    })
    .sort((a, b) => b.score - a.score);
}
export function SortProductByLatestAddDate(
  product: Array<Record<keyof Pick<ProductState, "createdAt">, Date>>
) {
  return product.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

async function fetchContainerById(id: string) {
  return Prisma.homecontainer.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      idx: true,
      name: true,
      type: true,
      scrollabletype: true,
      amountofitem: true,
      daterange: true,
      item: {
        select: {
          id: true,
          product_id: true,
          banner_id: true,
          product: {
            select: {
              id: true,
              name: true,
              covers: {
                select: {
                  name: true,
                  url: true,
                  type: true,
                },
              },
            },
          },
          banner: {
            select: {
              id: true,
              name: true,
              type: true,
              image: true,
              size: true,
            },
          },
        },
      },
    },
  });
}

export async function fetchContainers(ty: string) {
  if (ty === "detail") {
    return Prisma.homecontainer.findMany({
      orderBy: { idx: "asc" },
      select: {
        id: true,
        idx: true,
        name: true,
        type: true,
        scrollabletype: true,
        amountofitem: true,
        daterange: true,
        item: {
          select: {
            id: true,
            product_id: true,
            banner_id: true,
            product: {
              select: {
                id: true,
                name: true,
                discount: true,
                price: true,
                covers: {
                  select: {
                    name: true,
                    url: true,
                  },
                },
              },
            },
            banner: {
              select: {
                id: true,
                name: true,
                type: true,
                image: true,
                link: true,
              },
            },
          },
        },
      },
    });
  } else {
    return Prisma.homecontainer.findMany({
      select: {
        id: true,
        idx: true,
        name: true,
        type: true,
      },
      orderBy: {
        idx: "asc",
      },
    });
  }
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
      covers: Array<covertype>;
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
    };
  }[];
}

export function formatContainer(result: formatContainerType) {
  return {
    id: result.id,
    idx: result.idx,
    amountofitem: result.amountofitem || undefined,
    scrollabletype: result.scrollabletype as any,
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
            },
          }
        : {
            id: i.id,
            item: {
              id: i.product?.id,
              name: i.product?.name,
              image: i.product?.covers[0],
              price: calculateDiscountProductPrice({
                price: i.product?.price ?? 0,
                discount: i.product?.discount ?? 0,
              }),
            },
          }
    ),
  };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.toString();
  const { ty, id } = extractQueryParams(url) as Paramtype;

  if (ty && ty !== "detail" && ty !== "short") {
    return Response.json({ message: "Invalid Request" }, { status: 400 });
  }

  try {
    if (id) {
      const result = await fetchContainerById(id);

      if (!result) {
        return Response.json(
          { message: "Container Not Found" },
          { status: 500 }
        );
      }
      const res = formatContainer(result as any);
      return Response.json({ data: res }, { status: 200 });
    } else {
      const results = await fetchContainers(ty as string);
      const res =
        ty === "detail" ? results.map(formatContainer as any) : results;
      return Response.json({ data: res }, { status: 200 });
    }
  } catch (error) {
    console.error("Get container error", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}

interface editrequest extends Containertype {
  ty?: string;
  edititems?: Pick<Homeitemtype, "id" | "idx">[];
}

export async function PUT(req: Request) {
  const data = (await req.json()) as editrequest;
  const id = data.id;

  try {
    if (!data.ty && !id) {
      return Response.json(
        { success: false, message: "Invalid Request" },
        { status: 400 }
      );
    }

    if (data.ty === "idx" && data.edititems && data.edititems.length > 0) {
      await Promise.all(
        data.edititems.map((item) =>
          Prisma.homecontainer.update({
            where: { id: parseInt(item.id) },
            data: { idx: item.idx },
          })
        )
      );

      return Response.json(
        { success: true, message: "HomeItems Updated" },
        { status: 200 }
      );
    }

    const container = await Prisma.homecontainer.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!container) {
      return Response.json(
        { success: false, message: "Container Not Found" },
        { status: 404 }
      );
    }

    const updates: any = {};

    // Check and update the name if it has changed
    if (container.name !== data.name) {
      const existingContainer = await Prisma.homecontainer.findFirst({
        where: { name: data.name },
        select: { name: true },
      });

      if (existingContainer) {
        return Response.json(
          { success: false, message: "Container Name Exists" },
          { status: 400 }
        );
      }

      updates.name = data.name;
    }

    const existdaterange = container.daterange as any;

    // Update the items when the amount of items or date range changes
    if (
      container.amountofitem &&
      container.daterange &&
      data.amountofitem &&
      data.daterange &&
      (data.amountofitem !== container.amountofitem ||
        data.daterange.start !== existdaterange.start ||
        data.daterange.end !== existdaterange.end)
    ) {
      updates.amountofitem = parseInt(data.amountofitem.toString());
      updates.daterange = {
        start: data.daterange.start,
        end: data.daterange.end,
      };

      const product = await Prisma.products.findMany({
        where: {
          createdAt: {
            gte: new Date(data.daterange.start),
            lte: new Date(data.daterange.end),
          },
        },
        select: {
          id: true,
          amount_incart: true,
          amount_sold: true,
          amount_wishlist: true,
          createdAt: true,
        },
      });

      const sortedProduct =
        data.scrollabletype === "popular"
          ? SortProductByPopularScore(product as any)
          : SortProductByLatestAddDate(product);

      const cutProduct = caculateArrayPagination(
        sortedProduct,
        1,
        data.amountofitem
      );
      data.items = cutProduct.map((i) => {
        const existingItem = data.items.find((item) => item.item_id === i.id);
        return existingItem ? existingItem : { id: 0, item_id: i.id };
      });
    }

    // Update the scrollable type if it has changed
    if (container.scrollabletype !== data.scrollabletype) {
      updates.scrollabletype = data.scrollabletype;

      if (
        data.amountofitem &&
        (data.scrollabletype === "new" || data.scrollabletype === "popular")
      ) {
        const product = await Prisma.products.findMany({
          where: data.daterange
            ? {
                createdAt: {
                  gte: new Date(data.daterange.start),
                  lte: new Date(data.daterange.end),
                },
              }
            : {},
          select: {
            id: true,
            amount_incart: true,
            amount_sold: true,
            amount_wishlist: true,
            createdAt: true,
          },
        });

        const sortedProduct =
          data.scrollabletype === "popular"
            ? SortProductByPopularScore(product as any)
            : SortProductByLatestAddDate(product);

        const cutProduct = caculateArrayPagination(
          sortedProduct,
          1,
          data.amountofitem
        );

        data.items = data.items.filter((i) =>
          cutProduct.some((item) => item.id === i.item_id)
        );
      }
    }

    // Check and update the idx if it has changed
    if (container.idx !== data.idx) {
      updates.idx = data.idx;
    }

    // Check and update the type if it has changed
    if (container.type !== data.type) {
      if (container.type === "scrollable" && container.daterange) {
        updates.daterange = null;
      }
      updates.type = data.type;
    }

    // Update items if they have changed
    const newItems = data.items;
    const existingItems = container.item;

    const itemsToCreate = newItems.filter(
      (newItem) =>
        !existingItems.some((existingItem) => existingItem.id === newItem.id)
    );

    const itemsToDelete = existingItems.filter(
      (existingItem) =>
        !newItems?.some((newItem) => newItem.id === existingItem.id)
    );

    const itemsToUpdate = newItems.filter((newItem) =>
      existingItems.some(
        (existingItem) =>
          existingItem.id === newItem.id &&
          ((existingItem.banner_id &&
            existingItem.banner_id !== newItem.item_id) ||
            (existingItem.product_id &&
              existingItem.product_id !== newItem.item_id))
      )
    );

    if (
      itemsToCreate.length > 0 ||
      itemsToDelete.length > 0 ||
      itemsToUpdate.length > 0
    ) {
      updates.item = {
        deleteMany: {
          id: { in: itemsToDelete.map((item) => item.id) },
        },
        createMany: {
          data:
            container.type === "scrollable"
              ? itemsToCreate.map((i) => ({ product_id: i.item_id }))
              : itemsToCreate.map((i) => ({ banner_id: i.item_id })),
        },
        update: itemsToUpdate?.map((item) => ({
          where: { id: item.id },
          data:
            container.type === "scrollable"
              ? { product_id: item.item_id }
              : { banner_id: item.item_id },
        })),
      };
    }

    if (Object.keys(updates).length > 0) {
      await Prisma.homecontainer.update({
        where: { id },
        data: updates,
      });

      return Response.json(
        { success: true, message: "Container Updated" },
        { status: 200 }
      );
    } else {
      return Response.json({ success: true }, { status: 200 });
    }
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
