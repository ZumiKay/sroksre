import { Homeitemtype, ProductState } from "@/src/context/GlobalType.type";
import Prisma from "@/src/lib/prisma";
import { calculatePopularityScore } from "../categories/route";

export const HomeDetailUpdate = async (
  editItems: Homeitemtype,
  Item: Homeitemtype
) => {
  try {
    // Early return if no items to process
    if (!editItems || !Item) {
      return true;
    }

    const updateData: Record<string, unknown> = { id: editItems.id };
    let hasChanges = false;

    const propertyUpdates = Object.entries(editItems).reduce<
      Record<string, unknown>
    >((acc, [key, value]) => {
      if (key === "items" || key === "id") return acc;

      const current = Item[key as keyof Homeitemtype];

      const changed =
        typeof value !== "object" || value === null
          ? current !== value
          : JSON.stringify(current) !== JSON.stringify(value);

      if (changed) {
        acc[key] = value;
        hasChanges = true;
      }
      return acc;
    }, {});

    Object.assign(updateData, propertyUpdates);

    const itemsToUpdate = [];

    if (editItems.items && Item.items) {
      const existingItemsMap = new Map(
        Item.items.map((item) => [item.id, item])
      );

      for (const editItem of editItems.items) {
        const existingItem = existingItemsMap.get(editItem.id);
        if (!existingItem) continue;

        const hasItemChanges = Object.entries(editItem).some(
          ([key, value]) =>
            existingItem[key as keyof typeof existingItem] !== value
        );

        if (hasItemChanges) {
          itemsToUpdate.push(editItem);
          hasChanges = true;
        }
      }
    }

    if (itemsToUpdate.length > 0) {
      updateData.items = itemsToUpdate;
    }

    // Update database if there are any changes
    if (hasChanges) {
      return await updateDatabase([updateData]);
    }

    return true;
  } catch (error) {
    console.log("Update Homedetail", error);
    return null;
  }
};

async function updateDatabase(toUpdateItems: Array<Partial<Homeitemtype>>) {
  const transactions = toUpdateItems.map((item) => {
    const updateData: Record<string, unknown> = { ...item };

    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
      delete updateData.items;

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

export async function fetchContainerById(id: string, ty?: "item" | "normal") {
  return Prisma.homecontainer.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      idx: true,
      name: true,
      type: true,
      ...(ty &&
        ty === "normal" && {
          scrollabletype: true,
          amountofitem: true,
          daterange: true,
        }),
      ...(ty &&
        ty === "item" && {
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
        }),
    },
  });
}
