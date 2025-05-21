import {
  ContainerItemType,
  Homeitemtype,
  ProductState,
} from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { calculatePopularityScore } from "../categories/route";

export const HomeDetailUpdate = async (
  editItems: Array<Homeitemtype>,
  Items: Array<Homeitemtype>,
  ty: "info" | "containeritems"
) => {
  try {
    // Early return if no items to process
    if (!editItems || !Items || !editItems.length || !Items.length) {
      return true;
    }

    const toUpdateItem: Array<Partial<Homeitemtype>> = [];

    if (ty === "info") {
      // Process all items in a single loop
      for (let idx = 0; idx < editItems.length; idx++) {
        const edit = editItems[idx];
        const item = Items[idx];
        const toBeUpdate: Partial<Homeitemtype> = { id: edit.id };
        let hasChanges = false;

        // Use for-in loop for better performance
        for (const key in edit) {
          if (
            Object.prototype.hasOwnProperty.call(edit, key) &&
            item[key as never] !== edit[key as never]
          ) {
            toBeUpdate[key as never] = edit[key as never];
            hasChanges = true;
          }
        }

        // Only add to update array if there are actual changes
        if (hasChanges) {
          toUpdateItem.push(toBeUpdate);
        }
      }
    } else if (ty === "containeritems") {
      for (let idx = 0; idx < editItems.length; idx++) {
        const edit = editItems[idx];
        const containerItem = Items[idx].items;

        if (!containerItem?.length) continue;

        const toBeUpdate: Array<ContainerItemType> = [];

        for (const con of containerItem) {
          let itemChanged = false;

          for (const key in con) {
            if (
              Object.prototype.hasOwnProperty.call(con, key) &&
              con[key as never] !== con[key as never]
            ) {
              itemChanged = true;
              break;
            }
          }

          if (itemChanged) {
            toBeUpdate.push(con);
          }
        }

        if (toBeUpdate.length > 0) {
          toUpdateItem.push({ id: edit.id, items: toBeUpdate as never });
        }
      }
    }

    // Skip database transaction if nothing to update
    if (toUpdateItem.length === 0) {
      return true;
    }

    // Create proper Prisma transactions
    const transactions = toUpdateItem.map((item) => {
      // Base update for the parent container
      const updateData: Record<string, unknown> = { ...item };

      // Handle nested items update correctly for Prisma
      if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        // Remove items from the base data
        delete updateData.items;

        // Add proper nested update structure for Prisma
        updateData.items = {
          updateMany: item.items.map((nestedItem) => ({
            where: { id: nestedItem.id },
            data: nestedItem,
          })),
        };
      }

      return Prisma.homecontainer.update({
        where: { id: item.id },
        data: updateData,
      });
    });

    await Prisma.$transaction(transactions);
    return true;
  } catch (error) {
    console.log("Update Homedetail", error);
    return null;
  }
};

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

export async function fetchContainerById(id: string) {
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
      items: {
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
        items: {
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
                link: true,
                parentcate_id: true,
                childcate_id: true,
                selectedproduct_id: true,
                promotionId: true,
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
