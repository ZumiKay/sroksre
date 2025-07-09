import { NextRequest } from "next/server";
import {
  Categorydata,
  Deletecategorydata,
  createCategory,
  deleteCategory,
  updateCategory,
  updateCategoryData,
} from "@/src/lib/adminlib";
import Prisma from "@/src/lib/prisma";
import { Prisma as Prismatype } from "@prisma/client";
import { extractQueryParams } from "../banner/route";
import dayjs from "dayjs";
import { categorytype } from "@/src/context/GlobalType.type";

export const calculatePopularityScore = (data: {
  amount_incart: number;
  amount_wishlist: number;
  amount_sold: number;
}): number => {
  const soldWeight = 0.5;
  const wishlistWeight = 0.3;
  const inCartWeight = 0.2;

  return (
    data.amount_sold * soldWeight +
    data.amount_wishlist * wishlistWeight +
    data.amount_incart * inCartWeight
  );
};

const CreateAutoCategory = async (data: Categorydata) => {
  if (!data.type) {
    return { success: false };
  }

  try {
    // Convert subcategory pid values from string to integer
    const subcategoriesData =
      data.subcategories &&
      data.subcategories.length > 0 &&
      data.subcategories.every((i) => i.type === "promo")
        ? {
            sub: {
              createMany: {
                data: data.subcategories.map((i) => ({
                  name: i.name,
                  type: i.type,
                  // Convert string pid to integer or null
                  pid: i.pid ? parseInt(i.pid.toString(), 10) : null,
                })),
              },
            },
          }
        : {};

    // Create parent category
    const created = await Prisma.parentcategories.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        pid: null,
        ...subcategoriesData,
      },
    });

    // Rest of the optimized function remains the same...
    const productQueryOptions: Prismatype.ProductsFindManyArgs = {
      where: {},
      select: {
        id: true,
        ...(data.type === "popular"
          ? {
              amount_incart: true,
              amount_sold: true,
              amount_wishlist: true,
            }
          : {}),
        ...(data.type === "latest"
          ? {
              createdAt: true,
            }
          : {}),
      },
    };

    if (data.type === "sale") {
      productQueryOptions.where = { promotion_id: { not: null } };
    } else if (data.type === "popular") {
      productQueryOptions.where = {
        OR: [
          { amount_incart: { not: null, gt: 0 } },
          { amount_sold: { not: null, gt: 0 } },
          { amount_wishlist: { not: null, gt: 0 } },
        ],
      };
    }

    if (data.type === "latest") {
      productQueryOptions.orderBy = { createdAt: "desc" };
      productQueryOptions.take = 100;
    }

    const products = await Prisma.products.findMany(productQueryOptions);

    if (data.type === "sale") {
      await Prisma.productcategory.createMany({
        data: products.map((prod) => ({
          product_id: prod.id,
          autocategory_id: created.id,
        })),
      });
    } else if (data.type === "popular") {
      const popularProducts = products.filter((prod) => {
        const popularityScore = calculatePopularityScore({
          amount_incart: prod.amount_incart ?? 0,
          amount_sold: prod.amount_sold ?? 0,
          amount_wishlist: prod.amount_wishlist ?? 0,
        });
        return popularityScore > 0;
      });

      if (popularProducts.length > 0) {
        await Prisma.productcategory.createMany({
          data: popularProducts.map((prod) => ({
            product_id: prod.id,
            autocategory_id: created.id,
          })),
        });
      }
    } else if (data.type === "latest") {
      await Prisma.productcategory.createMany({
        data: products.map((product) => ({
          autocategory_id: created.id,
          product_id: product.id,
        })),
      });
    }

    return { success: true, id: created.id };
  } catch (error) {
    console.log("Create Auto Category", error);
    return { success: false };
  }
};

export async function POST(req: NextRequest) {
  const data: Categorydata = await req.json();
  try {
    let isCreate;
    if (data.type !== "normal") {
      isCreate = await CreateAutoCategory(data);
    } else {
      isCreate = await createCategory(data);
    }
    if (isCreate.success) {
      return Response.json({ data: { id: isCreate.id } }, { status: 200 });
    } else {
      return Response.json({}, { status: 500 });
    }
  } catch (error) {
    console.error("createCategory", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  const data: updateCategoryData = await req.json();
  try {
    const update = await updateCategory(data);
    if (update.success) {
      return Response.json({ message: "Category Updated" }, { status: 200 });
    } else {
      return Response.json({ message: update.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Category Error", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = req.url.toString();
    const { ty } = extractQueryParams(url);

    const allcat = await Prisma.parentcategories.findMany({
      where: ty === "create" ? { type: categorytype.normal } : {},
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        sub: {
          select: {
            id: true,
            name: true,
            pid: true,
            type: true,
          },
        },
      },
    });

    const now = dayjs(new Date());

    const checkpromotion = async (pid: number) => {
      const promotion = await Prisma.promotion.findUnique({
        where: { id: pid },
        select: {
          expireAt: true,
        },
      });

      return (
        dayjs(promotion?.expireAt).isBefore(now) ||
        dayjs(promotion?.expireAt).isSame(now)
      );
    };

    const categories = await Promise.all(
      allcat.map(async (obj) => {
        const subcategories =
          obj.type !== "sale"
            ? obj.sub
            : await Promise.all(
                obj.sub.map((i) => ({
                  ...i,
                  isExpired: i.pid ? checkpromotion(i.pid) : undefined,
                }))
              );

        return {
          id: obj.id,
          name: obj.name,
          description: obj.description,
          type: obj.type,
          subcategories,
        };
      })
    );

    return Response.json({ data: categories }, { status: 200 });
  } catch (error) {
    console.log("Fetch Categories", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const data: Deletecategorydata = await req.json();

  try {
    await deleteCategory(data);
    return Response.json({ message: "Category Deleted" }, { status: 200 });
  } catch (error) {
    console.log("Delete Category", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
