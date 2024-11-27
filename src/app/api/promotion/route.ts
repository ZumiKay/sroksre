import { PromotionState, SelectType } from "@/src/context/GlobalContext";

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
import { categorytype } from "../categories/route";

export async function POST(request: NextRequest) {
  try {
    const promodata: PromotionState = await request.json();

    const result = await Prisma.$transaction(async (tx) => {
      // Check if the promotion already exists
      const isExist = await tx.promotion.findFirst({
        where: {
          name: promodata.name,
        },
      });

      if (isExist) {
        throw new Error("Promotion Exist");
      }

      // Create the promotion
      const create = await tx.promotion.create({
        data: {
          name: promodata.name,
          description: promodata.description,
          expireAt: promodata.expireAt
            ? new Date(promodata.expireAt.toString())
            : new Date(),
        },
      });

      //update banner
      promodata.banner_id &&
        (await Prisma.banner.update({
          where: { id: promodata.banner_id },
          data: { promotionId: create.id },
        }));

      // Update related products
      await Promise.all(
        promodata.Products.filter((i) => i.id !== 0).map((i) =>
          tx.products.update({
            where: { id: i.id },
            data: {
              promotion_id: create.id,
            },
          })
        )
      );

      // Check for Sale Category
      const salecategory = await tx.parentcategories.findFirst({
        where: {
          type: categorytype.sale,
        },
      });

      if (!salecategory?.id) {
        throw new Error("Sale Category not found");
      }

      // Add promotion to the sale category
      await tx.childcategories.create({
        data: {
          parentcategoriesId: salecategory.id,
          pid: create.id,
          name: promodata.name,
          type: categorytype.sale,
        },
      });
      return create.id;
    });

    return Response.json({ data: { id: result } }, { status: 200 });
  } catch (error) {
    console.error("Create Promotion Error:", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
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
        updatedata.type !== "cancelproduct"
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
            expireAt: new Date(updatedata.expireAt as any),
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
          existingPromotion.banner &&
            (await tx.banner.update({
              where: { id: existingPromotion.banner.id },
              data: { promotionId: null },
            }));
        }
      }

      // Handle product updates
      if (updatedata.type === "editproducts") {
        await Promise.all(
          updatedata.Products.map((product) =>
            tx.products.updateMany({
              where: { id: product.id },
              data: {
                promotion_id: updatedata.id === -1 ? null : updatedata.id,
                discount: product.discount?.percent,
              },
            })
          )
        );
      }

      // Handle canceling all product promotions
      if (updatedata.type === "cancelproduct") {
        await tx.products.updateMany({
          where: { promotion_id: null },
          data: { discount: null },
        });
      }

      // Handle removing discounts from a single product
      if (updatedata.type === "removediscount") {
        await tx.products.update({
          where: { id: updatedata.pid },
          data: {
            discount: null,
            promotion_id: null,
          },
        });
      }

      // Handle product-specific updates
      if (updatedata.type === "product") {
        if (updatedata.tempproduct) {
          await Promise.all(
            updatedata.tempproduct.map((id) =>
              tx.products.update({
                where: { id },
                data: { promotion_id: null, discount: null },
              })
            )
          );
        }

        await Promise.all(
          updatedata.Products.map((product) =>
            tx.products.updateMany({
              where: { id: product.id },
              data: {
                promotion_id: updatedata.id === -1 ? null : updatedata.id,
                discount: product.discount?.percent,
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

interface customparamPromotion {
  lt?: number;
  sk?: number;
  exp?: string;
  ty?: string;
  p?: number;
  q?: string;
  expired?: number;
  ids?: string;
}

export async function GET(request: NextRequest) {
  try {
    const URL = request.url.toString();
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
        param.q || param.exp || param.expired ? (baseCondition as any) : {},
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
        where: baseCondition as any,
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

        const isAutoCate = await Prisma.childcategories.findFirst({
          where: { name: promotion.name },
        });

        modified = {
          ...promotion,
          autocate: !!isAutoCate,
          Products: modifiedProducts,
        };
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
