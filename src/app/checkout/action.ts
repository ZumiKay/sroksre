"use server";

import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Ordertype,
  Productordertype,
  ShippingTypeEnum,
  totalpricetype,
} from "@/src/types/order.type";
import { getUser } from "@/src/lib/session";
import {
  Orderproduct,
  Prisma as PrismaType,
} from "@/prisma/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { Shippingservice } from "@/src/context/Checkoutcontext";
import {
  calculateDiscountProductPrice,
  encrypt,
  generateRandomNumber,
} from "@/src/lib/utilities";
import { shippingtype } from "../component/Modals/User";
import { VariantValueObjType } from "@/src/types/product.type";
import {
  buildStockAdjustments,
  isCheckoutSessionExpired,
  isValidOrderId,
  StockableItem,
} from "./stock";
import { syncExpiredPromotions } from "@/src/lib/promotion";
import {
  createPaypalCheckoutOrder,
  type PaypalOrderResponse,
} from "@/src/lib/paypal";
import { buildPaypalPurchaseUnit, settlePaypalPayment } from "./payment";

export type Returntype<T = void, K = string> =
  | ([T] extends [void]
      ? { success: true; data?: undefined; message?: K; status?: number }
      : { success: true; data: T; message?: K; status?: number })
  | {
      success: false;
      data?: undefined;
      message?: K;
      status?: number;
    };

/**
 * Hold stock for the given cart items (called at checkout start).
 * Not exported: every export of a "use server" file is a public endpoint.
 */
async function holdStockForItems(items: StockableItem[]) {
  const ops = buildStockAdjustments(items, "decrement");
  if (ops.length > 0) await Prisma.$transaction(ops);
}

/**
 * Release all stock holds for an order (called on session termination/expiry).
 * Not exported: every export of a "use server" file is a public endpoint.
 */
async function releaseStock(orderId: string) {
  const orderProducts = await Prisma.orderproduct.findMany({
    where: { orderId },
    select: {
      quantity: true,
      product: {
        select: {
          id: true,
          stocktype: true,
          Stock: { select: { Stockvalue: { select: { id: true } } } },
        },
      },
    },
  });

  const ops = buildStockAdjustments(orderProducts, "increment");
  if (ops.length > 0) await Prisma.$transaction(ops);
}

// Session expiration
const expireUnpaidOrderIfNeeded = async (order: {
  id: string;
  status: string;
  createdAt: Date;
  renewedAt?: Date | null;
}) => {
  if (order.status !== Allstatus.unpaid) {
    return false;
  }

  if (!isCheckoutSessionExpired(order.createdAt, order.renewedAt)) {
    return false;
  }

  // Release held stock, then mark the order and all its items as abandoned.
  await releaseStock(order.id);
  await Promise.all([
    Prisma.orders.update({
      where: { id: order.id },
      data: { status: Allstatus.abandoned },
    }),
    Prisma.orderproduct.updateMany({
      where: {
        orderId: order.id,
        status: { in: [Allstatus.incart, Allstatus.unpaid] },
      },
      data: { status: Allstatus.abandoned },
    }),
  ]);
  revalidatePath("/checkout");
  return true;
};

export async function getAddress(orderid?: string) {
  const user = await getUser();

  const address = await Prisma.address.findMany({
    where: { userId: user?.userId },
  });

  let selectedaddress;

  if (orderid) {
    selectedaddress = await Prisma.orders.findUnique({
      where: { id: orderid },
      select: { shipping_id: true, shipping: true },
    });
  }

  return { address, selectedaddress };
}

export async function getOrderAddress(orderId: string) {
  const address = await Prisma.orders.findUnique({
    where: { id: orderId },
    select: { shipping_id: true, shipping: true },
  });

  return address;
}

export async function createOrder(data: {
  price: totalpricetype;
  incartProduct: number[];
}): Promise<Returntype<{ orderId: string; encrypt: string }>> {
  await syncExpiredPromotions();
  const user = await getUser({
    user: {
      select: {
        buyer_id: true,
      },
    },
  });

  if (!user || !user?.user?.buyer_id)
    return { success: false, message: "No Access" };

  const uniqueCartIds = Array.from(new Set(data.incartProduct)).filter(
    (id) => Number.isInteger(id) && id > 0,
  );

  if (uniqueCartIds.length === 0) {
    return { success: false, message: "No valid cart items" };
  }

  // We'll check for existing order first so we can also accept items
  // already linked to it (handles the case where user navigates back
  // without terminating the session and clicks checkout again).
  let preCheckOrder = await Prisma.orders.findFirst({
    where: {
      AND: [{ buyer_id: user.user.buyer_id }, { status: Allstatus.unpaid }],
    },
  });

  if (preCheckOrder) {
    const expired = await expireUnpaidOrderIfNeeded(preCheckOrder);
    if (expired) preCheckOrder = null;
  }

  const cartItems = await Prisma.orderproduct.findMany({
    where: {
      id: { in: uniqueCartIds },
      user_id: user.userId,
      status: Allstatus.incart,
      // Accept items that are unlinked OR already linked to the existing
      ...(preCheckOrder
        ? { OR: [{ orderId: null }, { orderId: preCheckOrder.id }] }
        : { orderId: null }),
    },
    select: {
      id: true,
      orderId: true,
      quantity: true,
      details: true,
      product: {
        select: {
          id: true,
          price: true,
          discount: true,
          stocktype: true,
          Stock: { select: { Stockvalue: { select: { id: true } } } },
          Variant: {
            select: {
              id: true,
              price: true,
              option_title: true,
              option_value: true,
            },
          },
        },
      },
    },
  });

  if (cartItems.length !== uniqueCartIds.length) {
    return { success: false, message: "Invalid cart selection" };
  }

  let totalVariantExtra = 0;

  const subtotal = cartItems.reduce((sum, item) => {
    const basePrice = item.product.discount
      ? (calculateDiscountProductPrice({
          price: item.product.price,
          discount: item.product.discount,
        }).discount?.newprice ?? 0)
      : item.product.price;

    // Compute per-unit variant option extra
    let variantExtra = 0;
    const detail = (item.details ?? []) as Array<{
      variant_id: number;
      value: string;
    }>;
    for (const d of detail) {
      const variant = item.product.Variant?.find((v) => v.id === d.variant_id);
      if (!variant) continue;
      const variantPrice = variant.price
        ? parseFloat(variant.price.toString())
        : 0;
      if (variantPrice > 0) {
        variantExtra += variantPrice;
        continue;
      }
      const opts = (variant.option_value ?? []) as Array<
        string | VariantValueObjType
      >;
      const opt = opts.find((o) =>
        typeof o === "string" ? o === d.value : o.val === d.value,
      );
      if (opt && typeof opt !== "string" && opt.price) {
        variantExtra += parseFloat(opt.price.toString());
      }
    }

    totalVariantExtra += variantExtra * item.quantity;
    return sum + basePrice * item.quantity;
  }, 0);

  const pickupService = Shippingservice.find((s) => s.value === "Pickup");
  const defaultShipping = pickupService?.price ?? 0;
  const extra =
    totalVariantExtra > 0 ? parseFloat(totalVariantExtra.toFixed(2)) : 0;
  const serverPrice: totalpricetype = {
    subtotal,
    shipping: defaultShipping,
    total: subtotal + extra + defaultShipping,
    ...(extra > 0 ? { extra } : {}),
  };

  let orderId = "";
  try {
    const checkOrder = preCheckOrder;

    if (!checkOrder) {
      let generateID = "SSC" + generateRandomNumber();
      let isExist = true;
      while (isExist) {
        const isId = await Prisma.orders.findUnique({
          where: { id: generateID },
        });
        if (isId) {
          isExist = true;
          generateID = "SSC" + generateRandomNumber();
        } else {
          isExist = false;
        }
      }

      const create = await Prisma.orders.create({
        data: {
          id: generateID,
          buyer_id: user.user.buyer_id as string,
          status: Allstatus.unpaid,
          price: serverPrice as unknown as PrismaType.InputJsonValue,
          shippingtype: ShippingTypeEnum.pickup,
        },
      });
      orderId = create.id;
    } else {
      await Prisma.orders.update({
        where: { id: checkOrder.id },
        data: { price: serverPrice as unknown as PrismaType.InputJsonValue },
      });
      orderId = checkOrder?.id as string;
    }

    //Update incart product

    await Promise.all(
      uniqueCartIds.map((i) =>
        Prisma.orderproduct.updateMany({
          where: {
            id: i,
            user_id: user.userId,
            status: Allstatus.incart,
          },
          data: {
            orderId,
          },
        }),
      ),
    );

    // Only hold stock for items newly entering this checkout session.
    const newlyLinkedItems = cartItems.filter(
      (i) => i.orderId !== checkOrder?.id,
    );
    if (newlyLinkedItems.length > 0) {
      await holdStockForItems(newlyLinkedItems as StockableItem[]);
    }

    const encryptId = encrypt(orderId, process.env.KEY as string);
    return {
      success: true,
      data: { orderId, encrypt: encryptId },
    };
  } catch (error) {
    console.log("Create Order", error);
    return { success: false, message: "Error Occured" };
  }
}

/**
 * Renew the checkout session timer for an active unpaid order.
 * Returns the new timer base so the client can update its countdown locally.
 */
export async function renewCheckoutSession(
  orderId: string,
): Promise<Returntype & { renewedAt?: string }> {
  if (!isValidOrderId(orderId)) {
    return { success: false, message: "Invalid order" };
  }

  const order = await checkOrder(orderId);
  if (!order || order.status !== Allstatus.unpaid) {
    return { success: false, message: "Checkout session expired" };
  }

  const renewedAt = new Date();
  await Prisma.orders.update({
    where: { id: orderId },
    data: { renewedAt },
  });

  return { success: true, renewedAt: renewedAt.toISOString() };
}

/**
 * Explicitly terminate a checkout session (user navigates away).
 * Releases stock holds, unlinks orderproducts back to the cart (orderId = null,
 * status kept as incart so the user can resume shopping), and marks the order
 * as abandoned for history — without deleting any records.
 */
export async function terminateCheckoutSession(
  orderId: string,
): Promise<Returntype> {
  if (!isValidOrderId(orderId)) {
    return { success: false };
  }

  try {
    const order = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order || order.status !== Allstatus.unpaid) {
      return { success: false, message: "Order not found or already paid" };
    }

    await releaseStock(orderId);
    // Unlink orderproducts so they return to the user's cart (orderId = null),
    // then mark the order itself as abandoned for history.
    await Promise.all([
      Prisma.orderproduct.updateMany({
        where: { orderId },
        data: { orderId: null },
      }),
      Prisma.orders.update({
        where: { id: orderId },
        data: { status: Allstatus.abandoned },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.log("Terminate checkout session", error);
    return { success: false };
  }
}

export async function checkOrder(id: string) {
  if (!isValidOrderId(id)) {
    return null;
  }

  const user = await getUser({
    user: {
      select: {
        buyer_id: true,
      },
    },
  });

  if (!user?.user?.buyer_id) {
    return null;
  }

  const isOrder = await Prisma.orders.findUnique({
    where: {
      id,
      buyer_id: user.user.buyer_id,
    },
    select: { id: true, status: true, createdAt: true, renewedAt: true },
  });

  if (!isOrder) {
    return null;
  }

  //Check if the unpaid order is valid
  const isExpired = await expireUnpaidOrderIfNeeded(isOrder);

  if (isExpired) {
    return null;
  }

  return isOrder;
}

export async function getOrderProduct(
  orderId: string,
): Promise<Returntype<Array<Orderproduct>>> {
  const getProduct = await Prisma.orderproduct.findMany({
    where: { orderId },
    include: {
      product: {
        select: {
          id: true,
          covers: true,
          price: true,
          discount: true,
        },
      },
    },
  });
  return { success: true, data: getProduct };
}

export interface OrderUserType extends Ordertype {
  Orderproduct: Productordertype[];
  createdAt: Date;
}

//Confirm payment

/**
 * Confirm a PayPal payment for a local order, entirely on the server.
 *
 * The browser only says "the buyer approved in PayPal". This checks who owns
 * the order; settlePaypalPayment (shared with the PayPal webhook) checks the
 * amount, captures, and marks the order paid.
 */
export async function confirmPayment(orderId: string): Promise<Returntype> {
  try {
    // Login + ownership + checkout-session expiry.
    const orderState = await checkOrder(orderId);
    if (!orderState) {
      return {
        success: false,
        message: "Checkout session expired",
        status: 410,
      };
    }

    if (orderState.status === Allstatus.paid) {
      return { success: true, message: "Payment already confirmed" };
    }
    if (orderState.status !== Allstatus.unpaid) {
      return {
        success: false,
        message: "Order is no longer unpaid",
        status: 409,
      };
    }

    const record = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: { paypalOrderId: true },
    });
    const paypalOrderId = record?.paypalOrderId;
    if (!paypalOrderId) {
      return {
        success: false,
        message: "No PayPal payment found for this order",
        status: 400,
      };
    }

    return await settlePaypalPayment(orderId, paypalOrderId);
  } catch (error) {
    console.log("Confirm payment error:", error);
    return { success: false, message: "Error occurred", status: 500 };
  }
}

export async function handleShippingAddress(
  orderId: string,
  selected?: number,
  shippingdata?: shippingtype,
  isSave?: string,
): Promise<Returntype> {
  try {
    let shipId = selected;
    const user = await getUser();

    if (!user) {
      return { success: false, message: "No access" };
    }

    const order = await checkOrder(orderId);

    if (!order) {
      return { success: false, message: "Checkout session expired" };
    }

    if (order.status !== Allstatus.unpaid) {
      return { success: false, message: "Order is no longer unpaid" };
    }

    if (shipId && shipId > 0 && !shippingdata) {
      const selectedAddress = await Prisma.address.findUnique({
        where: { id: shipId },
        select: { id: true, userId: true },
      });

      if (!selectedAddress || selectedAddress.userId !== user.userId) {
        return { success: false, message: "Invalid shipping address" };
      }
    }

    if (!shipId && shippingdata && user) {
      //Create shipping addresss
      const create = await Prisma.address.create({
        data: {
          userId: isSave === "1" ? user.userId : undefined,
          firstname: shippingdata.firstname,
          lastname: shippingdata.lastname,
          houseId: shippingdata.houseId.toString(),
          district: shippingdata.district,
          songkhat: shippingdata.songkhat,
          province: shippingdata.province,
          postalcode: shippingdata.postalcode,
          street: shippingdata.street,
        },
      });
      shipId = create.id;
    }

    if (isSave) {
      const address = await Prisma.address.findUnique({
        where: { id: shipId },
      });

      if (address && !address.userId && isSave === "1") {
        await Prisma.address.update({
          where: { id: shipId },
          data: { userId: user.userId },
        });
      }
    }

    //Update order
    await Prisma.orders.update({
      where: { id: orderId },
      data: {
        shipping_id: shipId === 0 ? null : shipId,
        status: Allstatus.unpaid,
      },
    });
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.log("Shipping Address", error);
    return { success: false, message: "Error Occured" };
  }
}

export async function updateShippingService(
  orderId: string,
  shippingtype: string,
): Promise<Returntype> {
  try {
    const orderState = await checkOrder(orderId);

    if (!orderState) {
      return { success: false, message: "Checkout session expired" };
    }

    if (orderState.status !== Allstatus.unpaid) {
      return { success: false, message: "Order is no longer unpaid" };
    }

    const selectedShipping = Shippingservice.find(
      (i) => i.value === shippingtype,
    );

    if (!selectedShipping) {
      return { success: false, message: "Invalid shipping service" };
    }

    const order = await Prisma.orders.findFirst({ where: { id: orderId } });

    if (!order) {
      return { success: false, message: "Order not found" };
    }

    const subprice = order.price as unknown as totalpricetype;
    const shippingPrice = selectedShipping.price ?? 0;
    const storedExtra = subprice.extra ?? 0;

    const updatePrice: totalpricetype = {
      subtotal: subprice.subtotal,
      shipping: shippingPrice,
      total: subprice.subtotal + storedExtra + shippingPrice,
      ...(storedExtra > 0 ? { extra: storedExtra } : {}),
    };

    await Prisma.orders.update({
      where: {
        id: orderId,
      },
      data: {
        shippingtype,
        price: updatePrice as unknown as PrismaType.InputJsonValue,
      },
    });

    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.log("Shipping Service", error);
    return { success: false, message: "Error occured" };
  }
}

//Create paypal order
export async function createPaypalOrder(
  orderId: string,
): Promise<Returntype<PaypalOrderResponse>> {
  await syncExpiredPromotions();
  try {
    const orderState = await checkOrder(orderId);

    if (!orderState) {
      return {
        success: false,
        message: "Checkout session expired",
        status: 410,
      };
    }

    if (orderState.status !== Allstatus.unpaid) {
      return {
        success: false,
        message: "Order is no longer unpaid",
        status: 400,
      };
    }

    const purchase_units = await buildPaypalPurchaseUnit(orderId);
    if (!purchase_units) {
      return { success: false, message: "Invalid Order", status: 404 };
    }

    const request = await createPaypalCheckoutOrder({
      intent: "CAPTURE",
      purchase_units: [purchase_units],
    });

    if (request.tokenError) {
      return { success: false, message: "Invalid Token" };
    }

    if (!request.ok || !request.data.id) {
      console.error(
        "[PayPal] create order failed:",
        request.status,
        request.data.debug_id,
        JSON.stringify(request.data.details ?? []),
      );
      return { success: true, data: request.data, status: request.status };
    }

    // Bind the PayPal order to this checkout. Only this ID can be captured
    // for the order later; the browser never chooses which PayPal order to pay.
    await Prisma.orders.updateMany({
      where: { id: orderId, status: Allstatus.unpaid },
      data: { paypalOrderId: request.data.id },
    });

    return { success: true, data: request.data, status: request.status };
  } catch (error) {
    console.log("Paypal Error", error);
    return { success: false, status: 500 };
  }
}
