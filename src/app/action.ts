"use server";

import { getServerSession } from "next-auth";
import Prisma from "../lib/prisma";
import {
  calculateDiscountPrice,
  hasPassed24Hours,
  removeSpaceAndToLowerCase,
} from "../lib/utilities";
import { Usersessiontype } from "../context/GlobalType.type";
import { authConfig } from "./api/auth/[...nextauth]/route";
import { Allstatus } from "../context/OrderContext";

export type Homepagecontype = "banner" | "category" | "scrollcontainer";
export type Scrollcontainertype = "popular" | "latest" | "custom";

export const getSelectCategory = async (value: string) => {
  try {
    const category = await Prisma.parentcategories.findMany({
      where: {
        name: {
          contains: removeSpaceAndToLowerCase(value),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      success: true,
      data: category.map((i) => ({ label: i.name, value: i.id })),
    };
  } catch (error) {
    console.log("Get category for banner", error);
    return { success: false };
  }
};

export const getProductByCategory = async (
  value: string,
  parent_id: number,
  limit: number,
  child_id?: number
) => {
  try {
    const product = await Prisma.products.findMany({
      where: {
        parentcategory_id: parent_id,
        childcategory_id: child_id || undefined,
        name: {
          contains: removeSpaceAndToLowerCase(value),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
    });

    const data = product.map((i) => ({ label: i.name, value: i.id }));

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.log("Get product for banner", error);
    return { success: false };
  }
};

export const getUser = async (): Promise<Usersessiontype | null> => {
  const user = await getServerSession(authConfig);
  const result = user?.user as Usersessiontype | null;

  return result;
};

export const GetContainers = async () => {
  const result = await Prisma.homecontainer.findMany({
    select: {
      id: true,
      idx: true,
      name: true,
      type: true,
      items: {
        select: {
          product: {
            select: {
              id: true,
              parentcategory_id: true,
              childcategory_id: true,
              name: true,
              price: true,
              discount: true,
              covers: {
                take: 1,
                select: {
                  url: true,
                  name: true,
                },
              },
            },
          },
          banner: {
            select: {
              id: true,
              promotionId: true,
              type: true,
              linktype: true,
              selectedproduct_id: true,
              parentcate_id: true,
              childcate_id: true,
              Image: {
                select: {
                  id: true,
                  url: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      idx: "asc",
    },
  });

  if (!result || result.length === 0) {
    return result;
  }

  const formatContainerData = result.map((i) => ({
    ...i,
    items: i.items.map((item) => ({
      ...item,
      ...(item.product && {
        product: {
          ...item.product,
          ...(item.product.discount && {
            discount: calculateDiscountPrice(
              item.product.price,
              item.product.discount
            ),
          }),
        },
      }),
    })),
  }));

  return formatContainerData;
};

export const GetCartCount = async (): Promise<number> => {
  const user = await getUser();
  if (!user) return 0;

  const cartcount = await Prisma.orders.findFirst({
    where: {
      AND: [
        { buyer_id: user.id },
        {
          status: {
            in: [Allstatus.incart, Allstatus.unpaid],
          },
        },
      ],
    },
    select: {
      id: true,
      Orderproduct: {
        select: {
          id: true,
        },
      },
      createdAt: true,
    },
  });

  if (cartcount?.createdAt && hasPassed24Hours(cartcount.createdAt)) {
    await Prisma.orders.delete({ where: { id: cartcount.id } });
  }

  return cartcount?.Orderproduct.length ?? 0;
};
