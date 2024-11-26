import Prisma from "@/src/lib/prisma";

export async function PUT() {
  try {
    const expiredpromotions = await Prisma.promotion.findMany({
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
      },
    });

    if (expiredpromotions.length === 0) {
      return Response.json({ message: "No Expired Found" }, { status: 200 });
    }

    const productIds = expiredpromotions.flatMap((promo) =>
      promo.Products.map((product) => product.id)
    );

    const promotionIds = expiredpromotions.map((promo) => promo.id);

    await Promise.all([
      Prisma.products.updateMany({
        where: { id: { in: productIds } },
        data: { discount: null },
      }),
      Prisma.childcategories.deleteMany({
        where: { pid: { in: promotionIds } },
      }),
    ]);

    return Response.json({ message: "Updated Products" }, { status: 200 });
  } catch (error) {
    console.error("Schedule Check For Expired Promotion", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}
