import Prisma from "@/src/lib/prisma";

export async function PUT() {
  try {
    const expiredPromotions = await Prisma.promotion.findMany({
      where: {
        expireAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        Products: {
          select: { id: true },
        },
        banner: { select: { id: true } },
      },
    });

    if (expiredPromotions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No Expired Promotions Found" }),
        {
          status: 200,
        }
      );
    }

    const productIds = expiredPromotions.flatMap((promo) =>
      promo.Products.map((product) => product.id)
    );

    const promotionIds = expiredPromotions.map((promo) => promo.id);

    const bannerIds = expiredPromotions
      .map((promo) => promo.banner?.id)
      .filter((id): id is number => id !== undefined);

    const tasks = [];

    if (bannerIds.length > 0) {
      tasks.push(
        Prisma.banner.updateMany({
          where: { id: { in: bannerIds } },
          data: { promotionId: null },
        })
      );
    }

    if (productIds.length > 0) {
      tasks.push(
        Prisma.products.updateMany({
          where: { id: { in: productIds } },
          data: { discount: null },
        })
      );
    }

    if (promotionIds.length > 0) {
      tasks.push(
        Prisma.childcategories.deleteMany({
          where: { pid: { in: promotionIds } },
        })
      );
    }

    await Promise.all(tasks);

    return Response.json(
      { message: "Updated Expired Promotions" },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking expired promotions:", error);
    return Response.json(
      {
        message: "An error occurred while updating promotions",
      },
      { status: 500 }
    );
  }
}
