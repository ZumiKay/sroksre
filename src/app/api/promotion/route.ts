import { NextRequest } from "next/server";
import { extractQueryParams } from "../banner/route";
import {
  caculateArrayPagination,
  calculatePagination,
  removeSpaceAndToLowerCase,
} from "@/src/lib/utilities";
import Prisma from "@/src/lib/prisma";
import { Prisma as prisma, Promotion } from "@prisma/client";
import { categorytype, PromotionState } from "@/src/context/GlobalType.type";
import { Allstatus } from "@/src/context/OrderContext";

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

    await Prisma.$transaction(async (tx) => {
      let existingPromotion = null;

      // Only fetch existing promotion when needed
      if (updatedata.id && updatedata.type !== "product") {
        existingPromotion = await tx.promotion.findUnique({
          where: { id: updatedata.id },
          include: {
            banner: { select: { id: true } }, // Only select what we need
          },
        });

        if (!existingPromotion) {
          throw new Error("Promotion not found");
        }
      }

      // Handle promotion editing with optimized change detection
      if (updatedata.type === "edit" && existingPromotion) {
        const updateFields: Partial<Promotion> = {};

        if (existingPromotion.name !== updatedata.name) {
          updateFields.name = updatedata.name;
        }
        if (existingPromotion.description !== updatedata.description) {
          updateFields.description = updatedata.description;
        }
        if (updatedata.expireAt) {
          const newExpireDate = new Date(updatedata.expireAt.toString());
          if (
            existingPromotion.expireAt.getTime() !== newExpireDate.getTime()
          ) {
            updateFields.expireAt = newExpireDate;
          }
        }

        // Only update if there are actual changes
        if (Object.keys(updateFields).length > 0) {
          await tx.promotion.update({
            where: { id: updatedata.id },
            data: updateFields,
          });
        }
      }

      // Handle banner update
      if (
        updatedata.type === "banner" &&
        existingPromotion &&
        updatedata.banner_id
      ) {
        const currentBannerId = existingPromotion.banner?.id;

        if (currentBannerId !== updatedata.banner_id) {
          const bannerUpdates = [];

          // Add new banner
          bannerUpdates.push(
            tx.banner.update({
              where: { id: updatedata.banner_id },
              data: { promotionId: existingPromotion.id },
            })
          );

          // Remove old banner if exists
          if (currentBannerId) {
            bannerUpdates.push(
              tx.banner.update({
                where: { id: currentBannerId },
                data: { promotionId: null },
              })
            );
          }

          await Promise.all(bannerUpdates);
        }
      }

      // Handle product updates with batch operations
      if (updatedata.type === "editproduct" && updatedata.Products?.length) {
        const productIds = updatedata.Products.map((p) => p.id);
        const productsWithDiscount = updatedata.Products.filter(
          (p) => p.discount
        );
        const productsWithoutDiscount = updatedata.Products.filter(
          (p) => !p.discount
        );

        // Batch operations for better performance
        const operations = [
          // Remove promotion from products not in the list
          tx.products.updateMany({
            where: {
              promotion_id: updatedata.id,
              id: { notIn: productIds },
            },
            data: { discount: null, promotion_id: null },
          }),
        ];

        // Add products with discount
        if (productsWithDiscount.length > 0) {
          operations.push(
            tx.products.updateMany({
              where: { id: { in: productsWithDiscount.map((p) => p.id) } },
              data: {
                promotion_id: updatedata.id,
                discount: null, // Will be updated individually below
              },
            })
          );
        }

        // Remove promotion from products without discount
        if (productsWithoutDiscount.length > 0) {
          operations.push(
            tx.products.updateMany({
              where: { id: { in: productsWithoutDiscount.map((p) => p.id) } },
              data: { promotion_id: null, discount: null },
            })
          );
        }

        await Promise.all(operations);

        // Update individual discounts for products that have them
        if (productsWithDiscount.length > 0) {
          const discountUpdates = productsWithDiscount.map((product) =>
            tx.products.update({
              where: { id: product.id },
              data: { discount: product.discount!.percent },
            })
          );

          const orderUpdates = productsWithDiscount.map((product) =>
            tx.orderproduct.updateMany({
              where: {
                productId: product.id,
                order: {
                  status: { in: [Allstatus.unpaid, Allstatus.incart] },
                },
              },
              data: { discount: product.discount!.percent },
            })
          );

          await Promise.all([...discountUpdates, ...orderUpdates]);
        }

        // Clear discounts for orders of products without discount
        if (productsWithoutDiscount.length > 0) {
          await tx.orderproduct.updateMany({
            where: {
              productId: { in: productsWithoutDiscount.map((p) => p.id) },
              order: {
                status: { in: [Allstatus.unpaid, Allstatus.incart] },
              },
            },
            data: { discount: null },
          });
        }
      }

      // Handle automatic category with single query check
      if (updatedata.autocate && existingPromotion) {
        const [existingCategory, saleCategory] = await Promise.all([
          tx.childcategories.findFirst({
            where: { name: existingPromotion.name },
            select: { id: true },
          }),
          tx.parentcategories.findFirst({
            where: { type: categorytype.sale },
            select: { id: true },
          }),
        ]);

        if (!existingCategory && saleCategory) {
          await tx.childcategories.create({
            data: {
              parentcategoriesId: saleCategory.id,
              pid: existingPromotion.id,
              name: existingPromotion.name,
              type: categorytype.sale,
            },
          });
        } else if (!saleCategory) {
          throw new Error("No Sale Category Found");
        }
      }
    });

    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.error("Edit Promotion", error);

    const errorMessage =
      error instanceof Error ? error.message : "Editing Failed";
    const statusCode = errorMessage === "Promotion not found" ? 404 : 500;

    return Response.json({ message: errorMessage }, { status: statusCode });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    // Handle both single id and array of ids
    const ids = Array.isArray(id) ? id : [id];

    await Prisma.$transaction(async (tx) => {
      // Fetch the promotions
      const promos = await tx.promotion.findMany({
        where: { id: { in: ids } },
        include: { banner: true },
      });

      if (promos.length === 0) {
        throw new Error("No promotions found");
      }

      // Remove promotion references in products for all promotions
      await tx.products.updateMany({
        where: {
          promotion_id: { in: ids },
        },
        data: {
          promotion_id: null,
          discount: null,
        },
      });

      // Remove associated banner links if they exist
      const bannerIds = promos
        .filter((promo) => promo.banner)
        .map((promo) => promo.banner!.id);

      if (bannerIds.length > 0) {
        await tx.banner.updateMany({
          where: {
            id: { in: bannerIds },
          },
          data: { link: null, promotionId: null },
        });
      }

      // Delete associated categories
      await tx.childcategories.deleteMany({
        where: { pid: { in: ids } },
      });

      // Delete the promotions
      await tx.promotion.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return Response.json({ message: "Delete Success" }, { status: 200 });
  } catch (error) {
    console.error("Delete Promotion Error:", error);
    return Response.json({ message: "Deletion Failed" }, { status: 500 });
  }
}

type tyType = "selection" | "edit" | "all" | "filter" | "byid" | "check";
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

    const now = new Date();

    if (param.ty === "check") {
      const expiredPromotions = await Prisma.promotion.findMany({
        where: {
          expireAt: {
            lte: new Date(),
          },
        },
        select: { id: true },
      });

      return Response.json(
        { expiredCount: expiredPromotions.map((i) => i.id) },
        { status: 200 }
      );
    }

    // Build base condition once
    const baseCondition: prisma.PromotionWhereInput = {};

    if (param.q) {
      baseCondition.name = {
        contains: removeSpaceAndToLowerCase(param.q),
        mode: "insensitive",
      };
    }

    if (param.exp) {
      baseCondition.expireAt = { lt: new Date(param.exp) };
    } else if (param.expired) {
      baseCondition.expireAt = { lte: now };
    }

    // Handle specific types first to avoid unnecessary queries
    if (param.ty === "byid") {
      if (!param.ids) {
        return Response.json({}, { status: 400 });
      }

      const promotion = await Prisma.promotion.findMany({
        where: {
          id: param.ids.includes(",")
            ? { in: param.ids.split(",").map(Number) }
            : { equals: parseInt(param.ids) },
        },
        select: { id: true, name: true },
      });

      return Response.json(
        {
          data: promotion.map((i) => ({
            label: i.name,
            value: i.id,
          })),
        },
        { status: 200 }
      );
    }

    if (param.ty === "edit") {
      const promotion = await Prisma.promotion.findUnique({
        where: { id: param.p },
        select: {
          id: true,
          name: true,
          description: true,
          expireAt: true,
          banner: { select: { id: true, Image: true } },
          Products: { select: { id: true } },
        },
      });

      return Response.json({ data: promotion }, { status: 200 });
    }

    // For selection type with limit
    if (param.ty === "selection" && param.limit) {
      const promotions = await Prisma.promotion.findMany({
        where: {
          ...baseCondition,
          expireAt: { gt: now }, // Only get non-expired
        },
        select: { id: true, name: true },
        take: param.limit,
      });

      return Response.json(
        {
          data: promotions.map((item) => ({
            label: item.name,
            value: item.id.toString(),
          })),
          hasMore: promotions.length === param.limit,
        },
        { status: 200 }
      );
    }

    // Parallel queries for count and expired count
    const [total, expiredCount] = await Promise.all([
      Prisma.promotion.count({
        where:
          param.ty === "selection"
            ? {}
            : param.q || param.exp || param.expired
            ? baseCondition
            : {},
      }),
      Prisma.promotion.count({
        where: { expireAt: { lte: now } },
      }),
    ]);

    const { startIndex, endIndex } = calculatePagination(
      total,
      param.lt as number,
      param.p as number
    );

    let modified = {};

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
        isExpired: i.expireAt <= now,
      }));

      if (param.ty === "filter") {
        modified = caculateArrayPagination(
          modified as Array<PromotionState>,
          param.p ?? 1,
          param.lt ?? 1
        );
      }
    }

    const totalPages = param.lt ? Math.ceil(total / param.lt) : undefined;

    return Response.json(
      {
        data: modified,
        expirecount: expiredCount,
        total,
        totalpage: totalPages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get Promotion", error);
    return Response.json({ message: "Failed To Fetch" }, { status: 500 });
  }
}
