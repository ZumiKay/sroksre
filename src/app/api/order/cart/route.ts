import {
  Allstatus,
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
import { JsonObject } from "@prisma/client/runtime/library";
import {
  ProductState,
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { getUser } from "@/src/app/action";

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
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
  try {
    const url = req.nextUrl.toString();
    const { count } = extractQueryParams(url);
    const user = await getUser();

    if (!user) {
      return Response.json({}, { status: 200 });
    }

    // Common where clause to avoid repetition
    const whereClause = {
      AND: [{ user_id: user.id }, { status: Allstatus.incart }],
    };

    // Just return count if that's all that's needed
    if (count === 1) {
      const countCartItems = await Prisma.orderproduct.count({
        where: whereClause,
      });
      return Response.json({ data: countCartItems }, { status: 200 });
    } else if (count) {
      return Response.json({}, { status: 200 });
    }

    // Get full cart data with optimized query
    const orderproduct = await Prisma.orderproduct.findMany({
      where: whereClause,
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
              orderBy: { id: "asc" },
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
              orderBy: { id: "asc" },
            },
          },
        },
      },
    });

    const cartItems = processCartItems(
      orderproduct.map((i) => ({
        ...i,
        product: {
          ...i.product,
          price: calculateDiscountProductPrice({
            price: i.product.price,
            discount: i.product.discount ?? undefined,
          }),
          variants: i.product.Variant,
          varaintstock: i.product.Stock,
          Variant: undefined,
          Stock: undefined,
        },
      })) as unknown as Productordertype[]
    );
    const totalPrice = calculateCartTotalPrice(cartItems as never);

    return Response.json(
      { data: cartItems, total: totalPrice },
      { status: 200 }
    );
  } catch (error) {
    console.log("Get Cart", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}

// Separate function to process cart items for better readability

function processCartItems(orderproduct: Productordertype[]) {
  return orderproduct.map((item) => {
    const discount =
      item.product?.price &&
      item.product.discount &&
      calculateDiscountProductPrice({
        price: item?.product?.price,
        discount: item.product.discount as unknown as number,
      });

    const detail = item.details as Productorderdetailtype[];
    const selectedvariant =
      item.product?.variants &&
      processSelectedVariants(item.product?.variants, detail);

    const maxqty = getmaxqtybaseStockType(
      item.product as ProductState,
      detail.map((i) => i.value)
    );

    return {
      id: item.id,
      price: discount,
      quantity: item.quantity,
      maxqty,
      product: item.product,
      selectedvariant: selectedvariant && selectedvariant.flat(),
    };
  });
}

// Further breakdown complex operations
function processSelectedVariants(
  variants: Varianttype[],
  details: Productorderdetailtype[]
) {
  if (!variants) return [];

  return variants
    .filter((variant, idx) => variant.id === details[idx]?.variant_id)
    .map((selected, idx) => {
      const val = selected.option_value as (string | VariantColorValueType)[];
      return val.filter((j) =>
        typeof j === "string"
          ? details[idx].value === j
          : details[idx].value === j.val
      );
    });
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
