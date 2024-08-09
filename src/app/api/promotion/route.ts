import { PromotionState } from "@/src/context/GlobalContext";

import { NextRequest } from "next/server";
import { extractQueryParams, generateLink } from "../banner/route";
import {
  caculateArrayPagination,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import { revalidateTag } from "next/cache";
import dayjs from "dayjs";
import Prisma from "@/src/lib/prisma";

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
    const create = await Prisma.promotion.create({
      data: {
        name: promodata.name,
        description: promodata.description,
        banner_id: promodata.banner_id,
        expireAt: promodata.expireAt
          ? new Date(promodata.expireAt.toString())
          : new Date(),
      },
    });

    if (!create) {
      return Response.json({ message: "Error Occured" }, { status: 500 });
    }

    //update product
    await Promise.all(
      promodata.Products.filter((i) => i.id !== 0).map((i) =>
        Prisma.products.update({
          where: { id: i.id },
          data: {
            promotion_id: create.id,
          },
        })
      )
    );

    if (promodata.banner_id) {
      const link = generateLink(
        "promotion",
        undefined,
        undefined,
        undefined,
        promodata.banner_id,
        create.id
      );
      await Prisma.banner.update({
        where: { id: promodata.banner_id },
        data: { link },
      });
    }

    revalidateTag("promotion");
    return Response.json({ data: { id: create.id } }, { status: 200 });
  } catch (error) {
    console.log("Create Promotion", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

interface extendedPromotionState extends PromotionState {
  pid?: number;
}
export async function PUT(request: NextRequest) {
  try {
    const updatedata: extendedPromotionState = await request.json();

    const existingPromotion =
      updatedata.id &&
      (await Prisma.promotion.findUnique({
        where: { id: updatedata.id },
      }));

    const hasChanges = () => {
      return (
        existingPromotion &&
        (existingPromotion.name !== updatedata.name ||
          existingPromotion.description !== updatedata.description ||
          (updatedata.expireAt &&
            existingPromotion.expireAt !==
              new Date(updatedata.expireAt.toString())))
      );
    };

    const updatePromotion = async () => {
      await Prisma.promotion.update({
        where: { id: updatedata.id },
        data: {
          name: updatedata.name,
          description: updatedata.description,
          expireAt: new Date(updatedata.expireAt as any),
        },
      });
    };

    if (updatedata.type === "edit" && hasChanges()) {
      await updatePromotion();
    } else if (updatedata.type === "banner") {
      const existingBanner = await Prisma.promotion.findUnique({
        where: { id: updatedata.id },
      });

      if (existingBanner && existingBanner.banner_id !== updatedata.banner_id) {
        await Prisma.promotion.update({
          where: { id: updatedata.id },
          data: { banner_id: updatedata.banner_id },
        });
        const banner = await Prisma.banner.findUnique({
          where: { id: existingBanner.banner_id as number },
        });
        if (banner) {
          await Prisma.banner.update({
            where: { id: banner.id },
            data: { link: null },
          });
        }
      }
    } else if (updatedata.type === "editproducts") {
      await Promise.all(
        updatedata.Products.map((i) =>
          Prisma.products.updateMany({
            where: { id: i.id },
            data: {
              promotion_id: updatedata.id === -1 ? null : updatedata.id,
              discount: i.discount?.percent,
            },
          })
        )
      );
    } else if (updatedata.type === "cancelproduct") {
      await Prisma.products.updateMany({
        where: {
          promotion_id: null,
        },
        data: {
          discount: null,
        },
      });
    } else if (updatedata.type === "removediscount") {
      await Prisma.products.update({
        where: { id: updatedata.pid },
        data: {
          discount: null,
          promotion_id: null,
        },
      });
    } else if (updatedata.type === "product") {
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
      await Promise.all(
        updatedata.Products.map((i) =>
          Prisma.products.updateMany({
            where: { id: i.id },
            data: {
              promotion_id: updatedata.id === -1 ? null : updatedata.id,
              discount: i.discount?.percent,
            },
          })
        )
      );
    }

    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.error("Edit Promotion", error);
    return Response.json({ message: "Editing Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    const promo = await Prisma.promotion.findUnique({ where: { id } });

    //delete product promotion
    if (!promo) {
      throw new Error("Promotion not found");
    }
    await Prisma.products.updateMany({
      where: {
        promotion_id: promo.id,
      },
      data: {
        promotion_id: null,
        discount: null,
      },
    });

    if (promo.banner_id) {
      await Prisma.banner.update({
        where: {
          id: promo.banner_id as number,
        },
        data: { link: null },
      });
    }

    await Prisma.promotion.delete({ where: { id } });

    revalidateTag("promotion");
    return Response.json({ message: "Delete Success" }, { status: 200 });
  } catch (error) {
    console.log("Delete Promotion", error);
    return Response.json({ message: "Deletion Failed" }, { status: 500 });
  }
}

interface customparamPromotion {
  lt?: number;
  sk?: number;
  exp?: string;
  ty?: string;
  p?: number;
  q?: string;
  expired?: number;
}

export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();
    const param: customparamPromotion = extractQueryParams(URL);
    let modified = {};
    let expirecount = 0;

    const now = dayjs(new Date());

    // Count expired promotions
    const countexpiredPromo = await Prisma.promotion.findMany({
      select: { expireAt: true },
    });

    expirecount = countexpiredPromo.filter(
      (i) => dayjs(i.expireAt).isBefore(now) || dayjs(i.expireAt).isSame(now)
    ).length;

    // Base query condition
    const baseCondition = {
      name: param.q
        ? {
            contains: removeSpaceAndToLowerCase(param.q),
            mode: "insensitive",
          }
        : {},
      expireAt: param.exp
        ? {
            lt: new Date(param.exp as string),
          }
        : param.expired
        ? {
            lte: new Date(),
          }
        : {},
    };

    const total = await Prisma.promotion.count({
      where:
        param.q || param.exp || param.expired ? (baseCondition as any) : {},
    });

    const { startIndex, endIndex } = calculatePagination(
      total,
      param.lt as number,
      param.p as number
    );

    if (param.ty === "all" || param.ty === "filter") {
      const promotions = await Prisma.promotion.findMany({
        where: param.ty === "filter" ? (baseCondition as any) : undefined,
        take: param.ty === "all" ? endIndex - startIndex + 1 : undefined,
        skip: param.ty === "all" ? startIndex : undefined,
        select: {
          id: true,
          name: true,
          banner: true,
          expireAt: true,
        },
      });

      modified = promotions.map((i) => ({
        ...i,
        isExpired:
          dayjs(i.expireAt).isBefore(now) || dayjs(i.expireAt).isSame(now),
      }));

      if (param.ty === "filter") {
        modified = caculateArrayPagination(
          modified as any,
          param.p ?? 1,
          param.lt ?? 1
        );
      }
    } else if (param.ty === "selection") {
      const promotions = await Prisma.promotion.findMany({
        where: baseCondition.name as any,
        select: {
          id: true,
          name: true,
        },
        take: param.lt,
      });

      return Response.json(
        { data: promotions, isLimit: promotions.length <= 5 },
        { status: 200 }
      );
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
          const discount = parseFloat(j.discount?.toString() as string) || 0;

          return {
            ...j,
            discount: {
              percent: discount,
              newPrice: (price - (price * discount) / 100).toFixed(2),
              oldPrice: price,
            },
          };
        });

        modified = { ...promotion, Products: modifiedProducts };
      }
    }

    const totalpromo = param.lt ? Math.ceil(total / param.lt) : undefined;

    return Response.json(
      {
        data: modified,
        expirecount,
        total,
        totalpage: totalpromo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get Promotion", error);
    return Response.json({ message: "Failed To Fetch" }, { status: 500 });
  }
}
