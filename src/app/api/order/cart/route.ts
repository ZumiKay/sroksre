import {
  Allstatus,
  Productorderdetailtype,
  Productordertype,
  totalpricetype,
} from "@/src/types/order.type";
import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import {
  calculateCartTotalPrice,
  calculateDiscountProductPrice,
  getmaxqtybaseStockType,
} from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import { JsonObject } from "@/prisma/generated/prisma/internal/prismaNamespace";
import { ProductState, VariantValueObjType } from "@/src/types/product.type";

const getVariantExtraPrice = (
  selectedVariant: Array<string | VariantValueObjType>,
): number => {
  return selectedVariant.reduce((total, variant) => {
    if (typeof variant === "string") {
      return total;
    }

    const variantPrice = variant.price
      ? parseFloat(variant.price.toString())
      : 0;
    return !isNaN(variantPrice) && variantPrice > 0
      ? total + variantPrice
      : total;
  }, 0);
};

const buildFinalCartPrice = (
  basePrice: Productordertype["price"],
  variantExtra: number,
): Productordertype["price"] => {
  if (variantExtra <= 0) {
    return basePrice;
  }

  const originalPrice = parseFloat((basePrice.price + variantExtra).toFixed(2));
  if (basePrice.discount) {
    const discountedBase = basePrice.discount.newprice ?? basePrice.price;
    const finalDiscounted = parseFloat(
      (discountedBase + variantExtra).toFixed(2),
    );

    return {
      price: originalPrice,
      discount: {
        ...basePrice.discount,
        newprice: finalDiscounted,
      },
    };
  }

  return {
    price: originalPrice,
  };
};

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({}, { status: 401 });
    }

    const { id, qty } = await req.json();

    const cartItem = await Prisma.orderproduct.findUnique({
      where: { id },
      select: { orderId: true },
    });

    if (!cartItem) {
      return Response.json({}, { status: 404 });
    }

    await Prisma.orderproduct.update({
      where: { id },
      data: { quantity: qty },
    });

    //update Order Price

    if (cartItem.orderId) {
      const orderItems = await Prisma.orders.findUnique({
        where: { id: cartItem.orderId },
        select: {
          Orderproduct: {
            select: {
              quantity: true,
              product: {
                select: {
                  price: true,
                  discount: true,
                },
              },
            },
          },
        },
      });

      if (!orderItems) {
        return Response.json({}, { status: 404 });
      }

      //Caculate Total Price
      const totalprice = orderItems.Orderproduct.reduce((total, item) => {
        const { quantity, product } = item;
        const { price, discount } = product;

        const productPrice = calculateDiscountProductPrice({
          price,
          discount: discount ? discount : undefined,
        });

        const caculatedPrice = discount
          ? (productPrice.discount?.newprice ?? 0)
          : price;
        return total + caculatedPrice * quantity;
      }, 0);

      const orderPrice: totalpricetype = {
        subtotal: totalprice,
        total: totalprice,
      };

      await Prisma.orders.update({
        where: { id: cartItem.orderId },
        data: { price: orderPrice as unknown as JsonObject },
      });
    }

    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Edit Cart", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.toString();
    const { count } = extractQueryParams(url);
    const user = await getUser();
    if (!user) {
      return Response.json({}, { status: 200 });
    }

    if (count) {
      if (count !== 1) {
        return Response.json({}, { status: 404 });
      }
      const countCartIems = await Prisma.orderproduct.count({
        where: {
          AND: [
            {
              user_id: user.userId,
            },
            {
              status: Allstatus.incart,
            },
          ],
        },
      });

      return Response.json({ data: countCartIems }, { status: 200 });
    }

    const orderproduct = await Prisma.orderproduct.findMany({
      where: {
        AND: [
          {
            user_id: user.userId,
          },
          {
            status: Allstatus.incart,
          },
        ],
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        quantity: true,
        details: true,
        product: {
          select: {
            name: true,
            covers: true,
            price: true,
            discount: true,
            stocktype: true,
            stock: true,
            Stock: {
              orderBy: {
                id: "asc",
              },
              select: {
                id: true,
                Stockvalue: {
                  select: {
                    variant_val: true,
                    qty: true,
                  },
                },
              },
            },
            Variant: {
              orderBy: {
                id: "asc",
              },
            },
          },
        },
      },
    });

    const cartItems = orderproduct.map((item) => {
      const discount = calculateDiscountProductPrice({
        price: item.product.price,
        discount: item.product.discount ? item.product.discount : undefined,
      });
      const detail = item.details as Productorderdetailtype[];
      const selectedvariant = item.product.Variant?.filter(
        (variant, idx) => variant.id === detail[idx].variant_id,
      );
      const selectedvariantForDisplay = selectedvariant
        .map((selected, idx) => {
          const val = selected.option_value as (string | VariantValueObjType)[];
          return val.filter((j) =>
            typeof j === "string"
              ? detail[idx].value === j
              : detail[idx].value === j.val,
          );
        })
        .flat();

      const flatSelectedVariant = selectedvariant.flat();
      const variantExtraPrice = getVariantExtraPrice(
        flatSelectedVariant as never,
      );
      const finalCartPrice = buildFinalCartPrice(discount, variantExtraPrice);

      const maxqty = getmaxqtybaseStockType(
        item.product as unknown as ProductState,
        detail.map((i) => i.value),
      );
      return {
        id: item.id,
        price: finalCartPrice,
        quantity: item.quantity,
        maxqty,
        product: item.product,
        selectedvariant: selectedvariantForDisplay,
      };
    });

    const totalPrice = calculateCartTotalPrice(
      cartItems as unknown as Productordertype[],
    );

    return Response.json(
      { data: cartItems, total: totalPrice },
      { status: 200 },
    );
  } catch (error) {
    console.log("Get Cart", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const user = await getUser();

    if (!user) {
      return Response.json({}, { status: 401 });
    }

    const order = await Prisma.orderproduct.findUnique({
      where: {
        id,
      },
      select: {
        order: { select: { id: true } },
        details: true,
        quantity: true,
        product: {
          select: {
            stocktype: true,
            stock: true,
          },
        },
      },
    });

    if (order && order.order) {
      const orderItem = await Prisma.orderproduct.findMany({
        where: {
          AND: [{ orderId: order.order.id }, { user_id: user.userId }],
        },
      });
      if (orderItem.length === 1) {
        await Prisma.orders.delete({ where: { id: order.order.id } });
      }
    }

    await Prisma.orderproduct.delete({ where: { id } });

    return Response.json({ message: "Delete Successfully" }, { status: 200 });
  } catch (error) {
    console.log("Delete Cart", error);
    return Response.json({ message: "Error Occured" }, { status: 500 });
  }
}
