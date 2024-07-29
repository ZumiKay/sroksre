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

const categorytype = {
  normal: "Normal",
  sale: "Sale",
  popular: "popular",
  latest: "latest",
};

export type Categorytype = keyof typeof categorytype;

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
    const created = await Prisma.parentcategories.create({
      data: {
        name: data.name,
        type: data.type,
        sub:
          data.subcategories &&
          data.subcategories.every((i) => i.type === "promo")
            ? {
                createMany: {
                  data: data.subcategories.map((i) => ({
                    name: i.name,
                    type: i.type,
                    pid: i.pid,
                  })),
                },
              }
            : {},
      },
    });

    //update product categories
    const product = await Prisma.products.findMany({
      where:
        data.type === "sale"
          ? {
              promotion_id: { not: null },
            }
          : data.type === "popular"
          ? {
              amount_incart: { not: null },
              amount_sold: { not: null },
              amount_wishlist: { not: null },
            }
          : {},
      select: {
        id: true,
        amount_incart: true,
        amount_sold: true,
        amount_wishlist: true,
        createdAt: true,
        Autocategory: true,
      },
    });

    if (data.type === "sale") {
      await Promise.all(
        product.map((prod) =>
          Prisma.productcategory.create({
            data: {
              product_id: prod.id,
              autocategory_id: created.id,
            },
          })
        )
      );
    } else if (data.type === "popular") {
      await Promise.all(
        product.map((prod) => {
          const popularscore = calculatePopularityScore({
            amount_incart: prod.amount_incart ?? 0,
            amount_sold: prod.amount_sold ?? 0,
            amount_wishlist: prod.amount_sold ?? 0,
          });

          if (popularscore > 0) {
            return Prisma.productcategory.create({
              data: {
                product_id: prod.id,
                autocategory_id: created.id,
              },
            });
          }
        })
      );
    } else if (data.type === "latest") {
      const latestProducts = product.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      await Promise.all(
        latestProducts.map((product) => {
          return Prisma.productcategory.create({
            data: {
              autocategory_id: created.id,
              product_id: product.id,
            },
          });
        })
      );
    }

    return { success: true, id: created.id };
  } catch (error) {
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

export async function GET() {
  try {
    const allcat = await Prisma.parentcategories.findMany({
      where: {},
      select: {
        id: true,
        name: true,
        type: true,
        sub: { select: { id: true, name: true, pid: true, type: true } },
      },
    });

    const categories: any = [];
    allcat.forEach((obj) => {
      categories.push({
        id: obj.id,
        name: obj.name,
        type: obj.type,
        subcategories: obj.sub,
      });
    });
    return Response.json({ data: categories }, { status: 200 });
  } catch (error) {
    console.log("Fetch Categories");
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
