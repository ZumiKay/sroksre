"use server";
import Prisma from "@/src/lib/prisma";
import { caculateArrayPagination } from "@/src/lib/utilities";
import {
  SortProductByLatestAddDate,
  SortProductByPopularScore,
} from "../api/home/route";
import { Containertype } from "@/src/context/GlobalType.type";

export async function CreateContainer(data: Containertype) {
  try {
    const create = await Prisma.homecontainer.findFirst({
      where: {
        name: data.name,
      },
      select: { name: true },
    });

    const containercount = await Prisma.homecontainer.count();
    const itemsIds: Array<number> = [];

    if (create) {
      return { success: false, message: "Container Name Exist" };
    }

    if (
      data.type === "scrollable" &&
      data.scrollabletype !== "custom" &&
      data.amountofitem
    ) {
      let product = await Prisma.products.findMany({
        where: data.daterange && {
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
      if (data.scrollabletype === "popular") {
        const productsWithScores = SortProductByPopularScore(product as never);

        productsWithScores.forEach((prod) => {
          itemsIds.push(prod.id);
        });
        product = caculateArrayPagination(product, 1, data.amountofitem);
      } else if (data.scrollabletype === "new") {
        const latestProducts = SortProductByLatestAddDate(product);
        product = caculateArrayPagination(latestProducts, 1, data.amountofitem);
        product.forEach((prod) => itemsIds.push(prod.id));
      }
    }

    await Prisma.homecontainer.create({
      data: {
        name: data.name,
        idx: containercount > 0 ? containercount : 0,
        scrollabletype: data.scrollabletype,
        amountofitem:
          data.amountofitem && parseInt(data.amountofitem.toString()),
        type: data.type,
        daterange: { ...data.daterange },
        item: data.item && {
          createMany: {
            data:
              data.type === "scrollable" && data.scrollabletype !== "custom"
                ? itemsIds.map((id) => ({
                    product_id: id,
                  }))
                : data.item.map((item) => ({
                    product_id: data.type === "scrollable" ? item : undefined,
                    banner_id: data.type !== "scrollable" ? item : undefined,
                  })),
          },
        },
      },
    });

    return { success: true, message: "Container Created" };
  } catch (error) {
    console.log(`Create container error:`, error);
    return { success: false, message: "Error Occured" };
  }
}
