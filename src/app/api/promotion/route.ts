import { PromotionState } from "@/src/context/GlobalContext";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import {
  caculateArrayPagination,
  calculatePagination,
} from "@/src/lib/utilities";
import { revalidateTag } from "next/cache";
import dayjs, { Dayjs } from "dayjs";

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
        expireAt: new Date(promodata.expireAt.toString()),
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
          existingPromotion.expireAt !==
            new Date(updatedata.expireAt.toString()))
      );
    };

    const updatePromotion = async () => {
      await Prisma.promotion.update({
        where: { id: updatedata.id },
        data: {
          name: updatedata.name,
          description: updatedata.description,
          expireAt: updatedata.expireAt as unknown as Date,
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

    revalidateTag("promotion");
    revalidateTag("product");
    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.error("Edit Promotion", error);
    return Response.json({ message: "Editing Failed" }, { status: 500 });
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
    } else if (param.ty === "filter") {
      let allpromo = await Prisma.promotion.findMany({
        select: {
          id: true,
          name: true,
          banner: true,
          expireAt: true,
        },
      });
      const compareDatesIgnoringSeconds = (date1: Dayjs, date2: Dayjs) => {
        const formattedDate1 = date1.format("YYYY-MM-DD HH:mm");
        const formattedDate2 = date2.format("YYYY-MM-DD HH:mm");

        const isSameDateTime = formattedDate1 === formattedDate2;

        return isSameDateTime;
      };
      allpromo = allpromo.filter((promo) => {
        const matchName =
          param.q &&
          promo.name
            .toLowerCase()
            .includes(decodeURIComponent(param.q).toLowerCase());

        const matchExpiredDate = compareDatesIgnoringSeconds(
          dayjs(param.exp),
          dayjs(promo.expireAt)
        );

        return param.exp && param.q
          ? matchName && matchExpiredDate
          : matchName || matchExpiredDate;
      });

      modified = caculateArrayPagination(allpromo, param.p ?? 1, param.lt ?? 1);
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
          const discount = parseFloat(j.discount?.toString() as string);

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
  }
}
