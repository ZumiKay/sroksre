import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import {
  caculateArrayPagination,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import dayjs from "dayjs";
import Prisma from "@/src/lib/prisma";
import { Prisma as prisma } from "@prisma/client";
import {
  categorytype,
  PromotionState,
  SelectType,
} from "@/src/context/GlobalType.type";

export async function POST(request: NextRequest) {
  try {
    const promodata: PromotionState = await request.json();

    const promotionId = await Prisma.$transaction(async (tx) => {
      const existingPromotion = await tx.promotion.findFirst({
        where: { name: promodata.name },
      });

      if (existingPromotion) {
        throw new Error("Promotion already exists");
      }

      // Create the promotion
      const newPromotion = await tx.promotion.create({
        data: {
          name: promodata.name,
          description: promodata.description,
          expireAt: promodata.expireAt
            ? new Date(promodata.expireAt)
            : new Date(),
        },
      });

      // Process product updates concurrently if products exist
      if (promodata.Products?.length) {
        await Promise.all(
          promodata.Products.map((prod) =>
            tx.products.update({
              where: { id: prod?.id },
              data: {
                promotion_id: newPromotion.id,
                discount: prod?.discount?.percent,
              },
            })
          )
        );
      }

      // Handle sale category if autocate is enabled
      if (promodata.autocate) {
        const saleCategory = await tx.parentcategories.findFirst({
          where: { type: categorytype.sale },
        });

        if (!saleCategory) {
          throw new Error("Sale category not found");
        }

        await tx.childcategories.create({
          data: {
            parentcategoriesId: saleCategory.id,
            pid: newPromotion.id,
            name: promodata.name,
            type: categorytype.sale,
          },
        });
      }

      // Update banner if banner_id exists (moved inside transaction)
      if (promodata.banner_id) {
        await tx.banner.update({
          where: { id: promodata.banner_id },
          data: { promotionId: newPromotion.id },
        });
      }

      return newPromotion.id;
    });

    return Response.json({ data: { id: promotionId } }, { status: 200 });
  } catch (error) {
    console.error("Create Promotion Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    const statusCode = errorMessage === "Promotion already exists" ? 409 : 500;

    return Response.json(
      {
        message: errorMessage,
        success: false,
      },
      { status: statusCode }
    );
  }
}

interface extendedPromotionState extends PromotionState {
  pid?: number;
}
export async function PUT(request: NextRequest) {
  try {
    const updatedata: extendedPromotionState = await request.json();

    // Start a transaction
    await Prisma.$transaction(async (tx) => {
      // Fetch existing promotion if an ID is provided
      const existingPromotion =
        updatedata.id &&
        (await tx.promotion.findUnique({
          where: { id: updatedata.id },
          include: { banner: true },
        }));

      if (
        !existingPromotion &&
        updatedata.type !== "product" &&
        updatedata.type !== "banner"
      ) {
        throw new Error("Promotion not found");
      }

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

      // Handle promotion editing
      if (updatedata.type === "edit" && hasChanges()) {
        await tx.promotion.update({
          where: { id: updatedata.id },
          data: {
            name: updatedata.name,
            description: updatedata.description,
            expireAt: updatedata.expireAt as unknown as Date,
          },
        });
      }

      // Handle banner update
      if (updatedata.type === "banner" && existingPromotion) {
        if (existingPromotion.banner?.id !== updatedata.banner_id) {
          await tx.banner.update({
            where: { id: updatedata.banner_id },
            data: { promotionId: existingPromotion.id },
          });

          //update remove banner
          if (existingPromotion.banner)
            await tx.banner.update({
              where: { id: existingPromotion.banner.id },
              data: { promotionId: null },
            });
        }
      }

      // Handle product updates
      if (updatedata.type === "editproduct" && updatedata.Products) {
        //remove discount from products not in updatedata.Products

        await tx.products.updateMany({
          where: {
            AND: [
              { promotion_id: updatedata.id },
              {
                id: {
                  notIn: updatedata.Products.map((product) => product.id),
                },
              },
            ],
          },
          data: { discount: null, promotion_id: null },
        });

        await Promise.all(
          updatedata.Products.map((product) =>
            tx.products.updateMany({
              where: { id: product?.id },
              data: {
                promotion_id: product?.discount ? updatedata.id : null,
                discount: product?.discount?.percent ?? null,
              },
            })
          )
        );
      }

      // Handle automatic category updates
      if (updatedata.autocate && existingPromotion) {
        const isAdded = await tx.childcategories.findFirst({
          where: { name: existingPromotion.name },
        });

        if (!isAdded) {
          const salecategory = await tx.parentcategories.findFirst({
            where: {
              type: categorytype.sale,
            },
          });

          if (!salecategory) {
            throw new Error("No Sale Category Found");
          }

          await tx.childcategories.create({
            data: {
              parentcategoriesId: salecategory.id,
              pid: existingPromotion.id,
              name: existingPromotion.name,
            },
          });
        }
      }
    });

    // Return success response
    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.error("Edit Promotion", error);
    return Response.json({ message: "Editing Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    await Prisma.$transaction(async (tx) => {
      // Fetch the promotion
      const promo = await tx.promotion.findUnique({
        where: { id },
        include: { banner: true },
      });

      if (!promo) {
        throw new Error("Promotion not found");
      }

      // Remove promotion references in products
      await tx.products.updateMany({
        where: {
          promotion_id: promo.id,
        },
        data: {
          promotion_id: null,
          discount: null,
        },
      });

      // Remove associated banner link if exists
      if (promo.banner) {
        await tx.banner.update({
          where: {
            id: promo.banner.id as number,
          },
          data: { link: null, promotionId: null },
        });
      }

      // Delete associated categories
      await tx.childcategories.deleteMany({
        where: { pid: promo.id },
      });

      // Delete the promotion
      await tx.promotion.delete({ where: { id } });
    });

    return Response.json({ message: "Delete Success" }, { status: 200 });
  } catch (error) {
    console.error("Delete Promotion Error:", error);
    return Response.json({ message: "Deletion Failed" }, { status: 500 });
  }
}

type tyType = "selection" | "edit" | "all" | "filter" | "byid";
interface customparamPromotion {
  lt?: number;
  sk?: number;
  exp?: string;
  ty?: tyType;
  p?: number;
  q?: string;
  limit?: number;
  expired?: number;
  ids?: string;
}

export async function GET(request: NextRequest) {
  try {
    const URL = request.url.toString();
    const param: customparamPromotion = extractQueryParams(URL);

    if (!param.ty) {
      return Response.json({}, { status: 400 });
    }

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
    const baseCondition: prisma.PromotionWhereInput = {
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
        param.ty === "selection"
          ? {}
          : param.q || param.exp || param.expired
          ? baseCondition
          : {},
    });

    const { startIndex, endIndex } = calculatePagination(
      total,
      param.lt as number,
      param.p as number
    );

    if (param.ty === "all" || param.ty === "filter") {
      const promotions = await Prisma.promotion.findMany({
        where: param.ty === "filter" ? baseCondition : undefined,
        take: param.ty === "all" ? endIndex - startIndex + 1 : undefined,
        skip: param.ty === "all" ? startIndex : undefined,
        select: {
          id: true,
          name: true,
          banner: {
            select: {
              id: true,
              Image: {
                select: {
                  url: true,
                  name: true,
                },
              },
            },
          },
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
          modified as Array<PromotionState>,
          param.p ?? 1,
          param.lt ?? 1
        );
      }
    } else if (param.ty === "selection" && param.limit) {
      const promotions = await Prisma.promotion.findMany({
        where: baseCondition,
        select: {
          id: true,
          name: true,
        },
        take: param.limit,
      });

      const selectionresult = {
        data: promotions.map((item) => ({
          label: item.name,
          value: item.id.toString(),
        })),
        hasMore: total <= param.limit,
      };

      return Response.json({ ...selectionresult }, { status: 200 });
    } else if (param.ty === "byid") {
      //For Multiselect and Search Value
      if (!param.ids) {
        return Response.json({}, { status: 400 });
      }
      const promotion = await Prisma.promotion.findMany({
        where: {
          id:
            param.ids.length > 1
              ? {
                  in: param.ids.split(",").map((i) => parseInt(i, 10)),
                }
              : { equals: parseInt(param.ids) },
        },
        select: { id: true, name: true },
      });

      const value: Array<SelectType> = promotion.map((i) => ({
        label: i.name,
        value: i.id,
      }));

      return Response.json({ data: value }, { status: 200 });
    } else if (param.ty === "edit") {
      const promotion = await Prisma.promotion.findUnique({
        where: {
          id: param.p,
        },

        select: {
          id: true,
          name: true,
          description: true,
          expireAt: true,
          banner: { select: { id: true, Image: true } },
          Products: {
            select: {
              id: true,
            },
          },
        },
      });

      return Response.json({ data: promotion }, { status: 200 });
    } else return Response.json({}, { status: 400 });

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
