import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { getUser } from "@/src/context/OrderContext";
import { calculateDiscountProductPrice } from "@/src/lib/utilities";

export async function GET(request: NextRequest) {
  try {
    const URL = request.url.toString();

    const { ty }: { ty?: string } = extractQueryParams(URL);
    const user = await getUser();

    if (!user) {
      return Response.json({}, { status: 404 });
    }

    let result: any = null;

    if (ty === "shipping") {
      result = await Prisma.address.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          houseId: true,
          firstname: true,
          lastname: true,
          street: true,
          district: true,
          songkhat: true,
          province: true,
          postalcode: true,
        },
      });
    } else if (ty === "userinfo") {
      const info = await Prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      if (!info) {
        return Response.json({ message: "No user" }, { status: 404 });
      }
      result = info;
    } else if (ty === "wishlist") {
      const productwishlist = await Prisma.wishlist.findMany({
        where: { uid: user.id },
        select: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discount: true,
              parentcategory_id: true,
              childcategory_id: true,
              covers: {
                select: {
                  url: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      result = productwishlist.map((wish) => {
        const discount =
          wish.product.discount &&
          calculateDiscountProductPrice({
            price: wish.product.price,
            discount: wish.product.discount,
          });

        return {
          ...wish.product,
          discount: discount && discount.discount,
        };
      });
    }
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    console.log("Fetch User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getUser();

  if (!user) {
    return Response.json({}, { status: 401 });
  }
  try {
    await Prisma.wishlist.deleteMany({ where: { uid: user.id } });
    await Prisma.orderproduct.deleteMany({ where: { user_id: user.id } });
    await Prisma.orders.deleteMany({ where: { buyer_id: user.id } });
    await Prisma.usersession.deleteMany({ where: { user_id: user.id } });
    await Prisma.user.delete({ where: { id: user.id } });

    return Response.json({}, { status: 200 });
  } catch (error) {
    console.log("Delete User", error);
    return Response.json({}, { status: 500 });
  }
}
