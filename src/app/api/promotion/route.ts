import { PromotionState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import { calculatePagination } from "@/src/lib/utilities";

export async function POST(request: NextRequest) {
  try {
    const promodata: PromotionState = await request.json();
    const isExist = await Prisma.promotion.findFirst({
      where: {
        name: promodata.name,
      },
    });
    if (isExist) {
      return Response.json({ message: "Promotion Exist" }, { status: 200 });
    }
    const products = await Prisma.products.findMany({
      where: { id: { in: promodata.products.map((i) => i.id) } },
    });
    if (products.length === 0) {
      return Response.json({ message: "No Product Found" }, { status: 500 });
    }

    const create = await Prisma.promotion.create({
      data: {
        name: promodata.name,
        description: promodata.description,
        banner_id: promodata.banner_id,
        expireAt: promodata.expiredAt as unknown as Date,
      },
    });
    const updateproduct = await Promise.all(
      promodata.products.map((i) =>
        Prisma.products.update({
          where: { id: i.id },
          data: {
            discount: parseInt(i.discount?.percent as string) / 100,
            promotion_id: create.id,
          },
        }),
      ),
    );

    if (!updateproduct && create) {
      return Response.json({ message: "Error Occured" }, { status: 500 });
    }
    return Response.json({ data: { id: create.id } }, { status: 200 });
  } catch (error) {
    console.log("Create Promotion", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  } finally {
    Prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedata: PromotionState = await request.json();

    updatedata.tempproduct &&
      (await Promise.all(
        updatedata.tempproduct.map((i) =>
          Prisma.products.update({
            where: { id: i },
            data: {
              promotion_id: null,
              discount: null,
            },
          }),
        ),
      ));

    await Prisma.promotion.update({
      where: {
        id: updatedata.id,
      },
      data: {
        name: updatedata.name,
        description: updatedata.description,
        banner_id: updatedata.banner_id ?? null,
        expireAt: updatedata.expiredAt as unknown as Date,
      },
    });
    await Promise.all(
      updatedata.products.map((i) =>
        Prisma.products.update({
          where: { id: i.id },
          data: {
            promotion_id: updatedata.id,
            discount: parseInt(i.discount?.percent ?? "") / 100,
          },
        }),
      ),
    );
    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Edit Promotion", error);
    return Response.json({ messsage: "Editing Failed" }, { status: 500 });
  } finally {
    Prisma.$disconnect();
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    //delete product promotion
    await Prisma.products.updateMany({
      where: {
        promotion_id: id,
      },
      data: {
        promotion_id: null,
        discount: null,
      },
    });

    await Prisma.promotion.delete({ where: { id } });

    return Response.json({ message: "Delete Success" }, { status: 200 });
  } catch (error) {
    console.log("Delete Promotion", error);
    return Response.json({ message: "Deletion Failed" }, { status: 500 });
  } finally {
    Prisma.$disconnect();
  }
}

interface customparamPromotion {
  lt?: number;
  sk?: number;
  exp?: string;
  ty?: string;
  p?: number;
  q?: string;
}
export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();
    const param: customparamPromotion = extractQueryParams(URL);
    let modified;
    const total = await Prisma.promotion.count();
    const { startIndex, endIndex } = calculatePagination(
      total,
      param.lt as number,
      param.p as number,
    );

    const promotion = await Prisma.promotion.findMany({
      where:
        param.q || param.exp
          ? {
              name: {
                contains: param.q,
                mode: "insensitive",
              },
              expireAt: new Date(param.exp as string),
            }
          : {},
      take: endIndex - startIndex + 1,
      skip: startIndex,
      include: { Products: { orderBy: { id: "asc" } }, banner: true },
    });
    modified = promotion.map((i) => {
      const modifiedproduct = i.Products.map((j) => {
        const price = parseFloat(j.price.toString());
        const discount = parseFloat(j.discount?.toString() as string) * 100;

        return {
          ...j,
          discount: {
            percent: discount,
            newPrice: (price - (price * discount) / 100).toFixed(2),
            oldPrice: price,
          },
        };
      });
      return { ...i, Products: modifiedproduct };
    });

    return Response.json({ data: modified, total: total }, { status: 200 });
  } catch (error) {
    console.log("Get Promotion", error);
    return Response.json({ message: "Failed To Fetch" }, { status: 500 });
  }
}
