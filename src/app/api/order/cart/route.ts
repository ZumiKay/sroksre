import Prisma from "@/src/lib/prisma";
import { Prisma as PrismaType } from "@prisma/client";
import {
  Allstatus,
  Productorderdetailtype,
  Productordertype,
} from "@/src/context/OrderContext";
import {
  calculateCartTotalPrice,
  calculateDiscountPrice,
  getmaxqtybaseStockType,
  hasPassed24Hours,
} from "@/src/lib/utilities";
import { NextRequest } from "next/server";
import {
  get24Hr,
  ProductState,
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { getUser } from "@/src/app/action";
import { formatDate } from "@/src/app/component/EmailTemplate";

export async function PUT(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { id, qty } = await req.json();
    if (!id || typeof qty !== "number" || qty < 1) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    // Perform update and fetch updated item in a single transaction
    await Prisma.$transaction([
      Prisma.orderproduct.update({
        where: { id },
        data: { quantity: qty },
        select: {
          orderId: true,
          quantity: true,
          details: true,
          product: {
            select: {
              id: true,
              price: true,
              discount: true,
            },
          },
        },
      }),
    ]);

    // If no item found, the update would have thrown an error

    return Response.json({ message: "Update Successfully" }, { status: 200 });
  } catch (error) {
    console.error("Edit Cart Error:", error);
    return Response.json({ message: "Error Occurred" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return Response.json({ message: "No user found" }, { status: 200 });
    }

    // Common where clause to avoid repetition
    const whereClause: PrismaType.OrdersWhereInput = {
      AND: [
        { buyer_id: user.id },
        { status: Allstatus.incart },
        {
          OR: [
            { createdAt: { lte: get24Hr } },
            { createdAt: { gte: get24Hr } },
          ],
        },
      ],
    };

    // Get full cart data with optimized query
    const order = await Prisma.orders.findFirst({
      where: whereClause,
      orderBy: { id: "asc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        Orderproduct: {
          select: {
            id: true,
            quantity: true,
            details: true,
            product: {
              select: {
                name: true,
                covers: {
                  take: 1,
                  select: {
                    url: true,
                    name: true,
                  },
                },
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
        },
      },
    });

    if (order && order?.createdAt && hasPassed24Hours(order.createdAt)) {
      await Prisma.orders.delete({ where: { id: order?.id } });

      return Response.json({ message: "No Content" }, { status: 204 });
    } else {
      const orderItems = order?.Orderproduct
        ? processCartItems(order.Orderproduct as unknown as Productordertype[])
        : [];
      const totalPrice = calculateCartTotalPrice(orderItems as never);
      return Response.json(
        { data: orderItems, total: totalPrice },
        { status: 200 }
      );
    }
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
      calculateDiscountPrice(
        item?.product?.price,
        item.product.discount as unknown as number
      );

    const detail = item.details as Productorderdetailtype[];
    const selectedvariant =
      item.product?.Variant &&
      processSelectedVariants(item.product.Variant, detail);

    const maxqty = getmaxqtybaseStockType(
      item.product as ProductState,
      detail.map((i) => i.value)
    );

    const prod = item.product;

    return {
      id: item.id,
      quantity: item.quantity,
      maxqty,
      product: {
        id: prod?.id,
        name: prod?.name,
        covers: prod?.covers,
        price: prod?.price,
        discount,
      },
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
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    await Prisma.$transaction(
      async (tx) => {
        // Get essential order item data in one query
        const orderItem = await tx.orderproduct.findFirst({
          where: {
            AND: [
              { id },
              { user_id: user.id }, // Security: ensure the item belongs to the user
            ],
          },
          select: {
            orderId: true, // Only select what we need
          },
        });

        // If order item not found or doesn't belong to user, exit early
        if (!orderItem) {
          return;
        }

        // Count remaining items in the order
        const remainingItems = await tx.orderproduct.count({
          where: {
            AND: [
              { orderId: orderItem.orderId },
              { id: { not: id } }, // Exclude the item being deleted
            ],
          },
        });

        // Delete the entire order if this is the last item
        if (remainingItems === 0 && orderItem.orderId) {
          await tx.orders.delete({
            where: {
              id: orderItem.orderId,
            },
          });
        } else {
          // Otherwise just delete the order item
          await tx.orderproduct.delete({
            where: { id },
          });
        }
      },
      {
        isolationLevel: PrismaType.TransactionIsolationLevel.ReadCommitted, // Less restrictive for better performance
        maxWait: 2000,
        timeout: 5000,
      }
    );

    return Response.json(
      {
        success: true,
        message: "Item deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Delete Cart Error:",
      error instanceof Error ? error.message : String(error)
    );
    return Response.json(
      {
        success: false,
        message: "Failed to delete item",
      },
      { status: 500 }
    );
  }
}
