import {
  Allstatus,
  getUser,
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import { NextRequest } from "next/server";

interface Checkcarttype {
  selecteddetail?: Productorderdetailtype[];
  pid?: number;
}
export async function POST(req: NextRequest) {
  const { pid, selecteddetail }: Checkcarttype = await req.json();

  if (!pid || !selecteddetail) {
    return Response.json({}, { status: 400 });
  }
  try {
    let isInCart = false;
    const user = await getUser();

    if (!user) {
      return Response.json({}, { status: 200 });
    }

    const orderProducts = await Prisma.orderproduct.findMany({
      where: {
        AND: [
          {
            user_id: user.id,
          },
          {
            status: Allstatus.incart || Allstatus.unpaid,
          },
        ],
      },
      select: {
        details: true,
        productId: true,
        product: {
          select: {
            stocktype: true,
          },
        },
      },
    });

    if (orderProducts.length === 0) {
      return Response.json({}, { status: 200 });
    }

    if (selecteddetail && selecteddetail.length > 0) {
      const cartItems = orderProducts as unknown as Productordertype[];
      if (cartItems.some((i) => i.details)) {
        isInCart = cartItems.some((cart) => {
          const detail = cart.details?.filter((i) => i);
          const areArraysEqual =
            detail?.length === selecteddetail.length &&
            detail?.every((obj, index) =>
              Object.entries(obj).every(
                ([key, value]) => value === selecteddetail[index][key]
              )
            );
          return areArraysEqual;
        });
      }
    } else {
      isInCart = orderProducts.some((cart) => cart.productId === pid);
    }

    return Response.json({ data: { incart: isInCart } }, { status: 200 });
  } catch (error) {
    console.error("Check cart", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
