import {
  Allstatus,
  getUser,
  Productorderdetailtype,
  Productordertype,
  totalpricetype,
} from "@/src/context/OrderContext";
import Prisma from "@/src/lib/prisma";
import {
  calculateCartTotalPrice,
  calculateDiscountProductPrice,
  getmaxqtybaseStockType,
} from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import { extractQueryParams } from "../../banner/route";
import {
  ProductState,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import { JsonObject } from "@prisma/client/runtime/library";

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
          ? productPrice.discount?.newprice ?? 0
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
  const url = req.url.toString();
  const { count } = extractQueryParams(url);

  try {
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
              user_id: user.id,
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
            user_id: user.id,
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

    const cartItems: Productordertype[] = orderproduct.map((item) => {
      const discount = calculateDiscountProductPrice({
        price: item.product.price,
        discount: item.product.discount ? item.product.discount : undefined,
      });
      const detail = item.details as Productorderdetailtype[];
      const selectedvariant = item.product.Variant?.filter(
        (variant, idx) => variant.id === detail[idx].variant_id
      ).map((selected, idx) => {
        const val = selected.option_value as (string | VariantColorValueType)[];
        return val.filter((j) =>
          typeof j === "string"
            ? detail[idx].value === j
            : detail[idx].value === j.val
        );
      });

      const product = {
        ...item.product,
        variants: item.product.Variant as any,
        varaintstock: item.product.Stock as any,
        Variant: undefined,
        Stock: undefined,
      } as unknown as ProductState;

      const maxqty = getmaxqtybaseStockType(
        product,
        detail.map((i) => i.value)
      );
      return {
        id: item.id,
        price: discount,
        quantity: item.quantity,
        maxqty,
        product,
        selectedvariant: selectedvariant.flat(),
      };
    });

    const totalPrice = calculateCartTotalPrice(cartItems);

    return Response.json(
      { data: cartItems, total: totalPrice },
      { status: 200 }
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
          AND: [{ orderId: order.order.id }, { user_id: user.id }],
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
