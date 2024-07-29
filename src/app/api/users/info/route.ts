import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { getUser } from "@/src/context/OrderContext";
import { getDiscountedPrice } from "@/src/lib/utilities";

export async function GET(request: NextRequest) {
  try {
    const URL = request.nextUrl.toString();

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
          getDiscountedPrice(wish.product.discount, wish.product.price);

        return {
          ...wish.product,
          discount: discount && {
            ...discount,
            newprice: discount.newprice.toFixed(2),
          },
        };
      });
    }
    return Response.json({ data: result }, { status: 200 });
  } catch (error) {
    console.log("Fetch User", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
