import { PromotionState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import { calculatePagination } from "@/src/lib/utilities";
import { revalidateTag } from "next/cache";
import dayjs from "dayjs";

export async function POST(request: NextRequest) {
  try {
    const promodata: PromotionState = await request.json();
    const isExist = await Prisma.promotion.findFirst({
      where: {
        name: promodata.name,
      },
    });

    if (isExist) {
      return Response.json({ message: "Promotion Exist" }, { status: 500 });
    }
    const products = await Prisma.products.findMany({
      where: { id: { in: promodata.Products.map((i) => i.id) } },
    });
    if (products.length === 0) {
      return Response.json({ message: "No Product Found" }, { status: 500 });
    }

    const create = await Prisma.promotion.create({
      data: {
        name: promodata.name,
        description: promodata.description,
        banner_id: promodata.banner_id,
        expireAt: new Date(promodata.expiredAt.toString()),
      },
    });
    const updateproduct = await Promise.all(
      promodata.Products.map((i) =>
        Prisma.products.update({
          where: { id: i.id },
          data: {
            discount: parseInt(i.discount?.percent as string) / 100,
            promotion_id: create.id,
          },
        })
      )
    );

    if (!updateproduct && create) {
      return Response.json({ message: "Error Occured" }, { status: 500 });
    }
    revalidateTag("promotion");
    return Response.json({ data: { id: create.id } }, { status: 200 });
  } catch (error) {
    console.log("Create Promotion", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  } finally {
    await Prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedata: PromotionState = await request.json();

    if (updatedata.type === "edit") {
      // Get the existing promotion data
      const existingPromotion = await Prisma.promotion.findUnique({
        where: { id: updatedata.id },
      });

      // Check if data has changed before updating
      if (existingPromotion) {
        const hasChanges =
          existingPromotion.name !== updatedata.name ||
          existingPromotion.description !== updatedata.description ||
          existingPromotion.expireAt !==
            new Date(updatedata.expiredAt.toString());

        if (hasChanges) {
          // Perform the update only if there are changes
          await Prisma.promotion.update({
            where: {
              id: updatedata.id,
            },
            data: {
              name: updatedata.name,
              description: updatedata.description,
              expireAt: updatedata.expiredAt as unknown as Date,
            },
          });
        }
      }
    } else if (updatedata.type === "banner") {
      const existingBanner = await Prisma.promotion.findUnique({
        where: { id: updatedata.id },
      });

      if (existingBanner) {
        const haschange = existingBanner.banner_id !== updatedata.banner_id;
        if (haschange) {
          await Prisma.promotion.update({
            where: { id: updatedata.id },
            data: { banner_id: updatedata.banner_id },
          });
        }
      }
    } else {
      // Delete discount of products
      updatedata.tempproduct &&
        (await Promise.all(
          updatedata.tempproduct.map((i) =>
            Prisma.products.update({
              where: { id: i },
              data: {
                promotion_id: null,
                discount: null,
              },
            })
          )
        ));

      // Update product discount only if there are changes
      await Promise.all(
        updatedata.Products.map((i) =>
          Prisma.products.update({
            where: { id: i.id },
            data: {
              promotion_id: updatedata.id,
              discount: parseInt(i.discount?.percent ?? "") / 100,
            },
          })
        )
      );
    }

    revalidateTag("promotion");
    revalidateTag("product");
    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Edit Promotion", error);
    return Response.json({ message: "Editing Failed" }, { status: 500 });
  } finally {
    await Prisma.$disconnect();
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

    revalidateTag("promotion");
    return Response.json({ message: "Delete Success" }, { status: 200 });
  } catch (error) {
    console.log("Delete Promotion", error);
    return Response.json({ message: "Deletion Failed" }, { status: 500 });
  } finally {
    await Prisma.$disconnect();
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

    const total = await Prisma.promotion.count({
      where:
        param.q || param.exp
          ? {
              name: param.q
                ? {
                    contains: decodeURIComponent(param.q)
                      .toString()
                      .toLowerCase(),
                  }
                : {},
              expireAt: param.exp
                ? {
                    lt: new Date(param.exp as string),
                  }
                : {},
            }
          : {},
    });
    const { startIndex, endIndex } = calculatePagination(
      total,
      param.lt as number,
      param.p as number
    );

    if (param.ty === "all") {
      modified = await Prisma.promotion.findMany({
        where:
          param.q || param.exp
            ? {
                name: param.q
                  ? {
                      contains: decodeURIComponent(param.q)
                        .toString()
                        .toLowerCase(),
                      mode: "insensitive",
                    }
                  : undefined,
                expireAt: param.exp
                  ? {
                      lt: new Date(param.exp as string),
                    }
                  : undefined,
              }
            : {},
        take: endIndex - startIndex + 1,
        skip: startIndex,
        select: {
          id: true,
          name: true,
          banner: true,
        },
      });
    } else {
      const promotion = await Prisma.promotion.findUnique({
        where: {
          id: param.p,
        },
        include: { banner: true, Products: true },
      });
      if (promotion) {
        const modifiedProducts = promotion.Products.map((j) => {
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

        modified = {
          ...promotion,
          expiredAt: promotion.expireAt,

          Products: modifiedProducts,
        };
      }
    }

    const totalpromo = param.lt && Math.ceil(total / param.lt);

    return Response.json(
      { data: modified, total: total, totalpage: totalpromo },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get Promotion", error);
    return Response.json({ message: "Failed To Fetch" }, { status: 500 });
  } finally {
    await Prisma.$disconnect();
  }
}
