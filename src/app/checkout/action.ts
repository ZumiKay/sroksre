"use server";

import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Ordertype,
  Productorderdetailtype,
  Productordertype,
  ShippingTypeEnum,
  totalpricetype,
} from "@/src/types/order.type";
import { getUser } from "@/src/lib/session";
import { Orderproduct } from "@/prisma/generated/prisma/client";
import { revalidatePath } from "next/cache";
import {
  CountryCode,
  Paypalamounttype,
  Paypalitemtype,
  PaypalshippingType,
  PurcahseUnitType,
  Shippingservice,
} from "@/src/context/Checkoutcontext";
import {
  calculateDiscountProductPrice,
  encrypt,
  generateRandomNumber,
  OrderReciptEmail,
} from "@/src/lib/utilities";
import nodemailer from "nodemailer";
import { shippingtype } from "../component/Modals/User";
import { formatDate } from "../component/EmailTemplate";
import {
  ProductStockType,
  VariantValueObjType,
} from "@/src/types/product.type";
import {
  BatchPayload,
  PrismaPromise,
} from "@/prisma/generated/prisma/internal/prismaNamespace";
import { canPlaceOrder } from "./helper";
import { getCheckoutdata } from "./fetchaction";
import { generateInvoicePdf } from "../api/order/helper";
import { CHECKOUT_SESSION_LIMIT_MS } from "./constants";

interface Returntype<k = string> {
  success: boolean;
  data?: any;
  message?: k;
  status?: number;
}

const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

const isValidOrderId = (id?: string) => !!id && ORDER_ID_PATTERN.test(id);

const isCheckoutSessionExpired = (
  createdAt: Date,
  renewedAt?: Date | null,
  now = Date.now(),
) => {
  const base = renewedAt ?? createdAt;
  return now - base.getTime() >= CHECKOUT_SESSION_LIMIT_MS;
};

// ─── Stock hold / release helpers ────────────────────────────────────────────

type StockableItem = {
  quantity: number;
  product: {
    id: number;
    stocktype: string;
    Stock: Array<{ Stockvalue: Array<{ id: number }> }>;
  };
};

function buildStockAdjustments(
  items: StockableItem[],
  direction: "decrement" | "increment",
): PrismaPromise<BatchPayload>[] {
  const ops: PrismaPromise<BatchPayload>[] = [];

  for (const item of items) {
    const { id, stocktype, Stock } = item.product;
    const qty = item.quantity;

    if (stocktype === ProductStockType.stock) {
      if (direction === "decrement") {
        ops.push(
          Prisma.products.updateMany({
            where: { AND: [{ id }, { stock: { gte: qty } }] },
            data: { stock: { decrement: qty } },
          }),
        );
      } else {
        ops.push(
          Prisma.products.updateMany({
            where: { id },
            data: { stock: { increment: qty } },
          }),
        );
      }
    } else if (Stock && Stock.length > 0) {
      const svIds = Stock.flatMap((sk) => sk.Stockvalue.map((sv) => sv.id));
      if (svIds.length > 0) {
        if (direction === "decrement") {
          ops.push(
            Prisma.stockvalue.updateMany({
              where: { AND: [{ id: { in: svIds } }, { qty: { gte: qty } }] },
              data: { qty: { decrement: qty } },
            }),
          );
        } else {
          ops.push(
            Prisma.stockvalue.updateMany({
              where: { id: { in: svIds } },
              data: { qty: { increment: qty } },
            }),
          );
        }
      }
    }
  }

  return ops;
}

/** Hold stock for the given cart items (called at checkout start). */
async function holdStockForItems(items: StockableItem[]) {
  const ops = buildStockAdjustments(items, "decrement");
  if (ops.length > 0) await Prisma.$transaction(ops);
}

/** Release all stock holds for an order (called on session termination/expiry). */
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

// ─── Session expiry ───────────────────────────────────────────────────────────

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
  // We intentionally do NOT delete so that order history is preserved.
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

export async function Createorder(data: {
  price: totalpricetype;
  incartProduct: number[];
}): Promise<Returntype<any>> {
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

  if (
    preCheckOrder &&
    isCheckoutSessionExpired(preCheckOrder.createdAt, preCheckOrder.renewedAt)
  ) {
    await releaseStock(preCheckOrder.id);
    await Promise.all([
      Prisma.orders.update({
        where: { id: preCheckOrder.id },
        data: { status: Allstatus.abandoned },
      }),
      Prisma.orderproduct.updateMany({
        where: {
          orderId: preCheckOrder.id,
          status: { in: [Allstatus.incart, Allstatus.unpaid] },
        },
        data: { status: Allstatus.abandoned },
      }),
    ]);
    preCheckOrder = null;
  }

  const cartItems = await Prisma.orderproduct.findMany({
    where: {
      id: { in: uniqueCartIds },
      user_id: user.userId,
      status: Allstatus.incart,
      // Accept items that are unlinked OR already linked to the existing
      // checkout session (so re-clicking checkout doesn't fail).
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
            select: { id: true, price: true, option_title: true, option_value: true },
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
    const detail = (item.details ?? []) as Array<{ variant_id: number; value: string }>;
    for (const d of detail) {
      const variant = item.product.Variant?.find((v) => v.id === d.variant_id);
      if (!variant) continue;
      const variantPrice = variant.price ? parseFloat(variant.price.toString()) : 0;
      if (variantPrice > 0) {
        variantExtra += variantPrice;
        continue;
      }
      const opts = (variant.option_value ?? []) as Array<string | VariantValueObjType>;
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
  const extra = totalVariantExtra > 0 ? parseFloat(totalVariantExtra.toFixed(2)) : 0;
  const serverPrice: totalpricetype = {
    subtotal,
    shipping: defaultShipping,
    total: subtotal + extra + defaultShipping,
    ...(extra > 0 ? { extra } : {}),
  };

  let orderId = "";
  try {
    let checkOrder = preCheckOrder;

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
          price: serverPrice as any,
          shippingtype: ShippingTypeEnum.pickup,
        },
      });
      orderId = create.id;
    } else {
      await Prisma.orders.update({
        where: { id: checkOrder.id },
        data: { price: serverPrice as any },
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
    // Items already linked to the existing order (re-checkout scenario)
    // already have their stock held — don't double-decrement.
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
): Promise<Returntype<string> & { renewedAt?: string }> {
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
 * Releases stock holds, unlinks orderproducts back to the cart (orderId → null,
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
  // shipping already defined in Ordertype
}

export async function updateStatus(
  orderid: string,
  html: string,
  adminhtml: string,
): Promise<Returntype> {
  try {
    const order = await getCheckoutdata(orderid);

    if (!order || !canPlaceOrder(order) || !order.user || !order.user.email) {
      return { success: false, status: 400 };
    }

    // Stock was already decremented when the checkout session started (holdStockForItems).
    // Here we only update order/product status and amount_sold.
    await Promise.all([
      Prisma.products.updateMany({
        where: {
          id: {
            in: order.Orderproduct.filter((i) => i.productId).map(
              (i) => i.productId,
            ) as number[],
          },
        },
        data: { amount_sold: { increment: 1 } },
      }),
      Prisma.orders.update({
        where: { id: orderid },
        data: { status: Allstatus.paid },
      }),
      Prisma.orderproduct.updateMany({
        where: { orderId: orderid },
        data: { status: Allstatus.paid },
      }),
    ]);

    // Prepare email sending concurrently
    const emailSubject = `Order #${order.id} receipt and processing for shipping`;
    const htmltemplate = OrderReciptEmail(html);

    const createInvoice = await generateInvoicePdf({
      id: order.id as string,
      product: order.Orderproduct.filter((i) => i.product).map((prob) => ({
        id: prob.product?.id as number,
        name: prob.product?.name as string,
        price: prob.price,
        selectedVariant: prob.selectedvariant as any,
        quantity: prob.quantity,
        totalprice:
          prob.quantity *
          (prob.price.discount?.newprice ??
            prob.price.price + (prob.price.extra ?? 0)),
      })),
      price: order.price as unknown as totalpricetype,
      shipping: order.shipping as any,
      createdAt: formatDate(order.createdAt as Date),
    });

    await Promise.all([
      SendOrderEmail(
        htmltemplate,
        order.user.email as string,
        emailSubject,
        createInvoice,
      ),
      SendOrderEmail(
        adminhtml,
        process.env.EMAIL as string,
        `Order #${order.id} request`,
        createInvoice,
      ),
    ]);

    return { success: true, message: "Payment completed" };
  } catch (error) {
    console.log("Update status error:", error);
    return { success: false, message: "Error occurred", status: 500 };
  }
}

export async function handleShippingAdddress(
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
      //create shipping addresss
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
    let updatePrice: totalpricetype = {
      subtotal: 0,
      total: 0,
      shipping: 0,
    };

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

    updatePrice = {
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
        price: updatePrice as any,
      },
    });

    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    console.log("Shipping Service", error);
    return { success: false, message: "Error occured" };
  }
}

//Paypal Handler

const generateAccessToken = async () => {
  const paypal_id = process.env.NEXT_PUBLIC_PAYPAL_ID as string;
  const paypal_secret = process.env.PAYPAL_KEY as string;

  try {
    const auth = Buffer.from(paypal_id + ":" + paypal_secret).toString(
      "base64",
    );
    const response = await fetch(`${process.env.PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.log("Failed to generate Access Token:", error);
    return null;
  }
};

export async function Createpaypalorder(orderId: string): Promise<Returntype> {
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

    const accessToken = await generateAccessToken();

    const order = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyer_id: true,
        status: true,
        estimate: true,
        price: true,
        shippingtype: true,
        shipping: true,
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
          },
        },
        Orderproduct: {
          select: {
            id: true,
            details: true,
            quantity: true,
            product: {
              select: {
                id: true,
                covers: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
                name: true,
                price: true,
                discount: true,
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
        },
      },
    });

    if (!order) {
      return { success: false, message: "Invalid Order", status: 404 };
    }

    if (!accessToken) {
      return { success: false, message: "Invalid Token" };
    }
    const currency_code = "USD";
    const orderPrice = order.price as unknown as totalpricetype;
    const shippingtype = Shippingservice.find(
      (i) => i.value === order.shippingtype,
    );
    const url = `${process.env.PAYPAL_BASE}/v2/checkout/orders`;
    const header = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    let orderItems: Paypalitemtype[] = order.Orderproduct.map((i) => {
      const baseDiscountedPrice = i.product.discount
        ? (calculateDiscountProductPrice({
            price: i.product.price,
            discount: i.product.discount,
          }).discount?.newprice ?? i.product.price)
        : i.product.price;

      // Add variant option extra price
      const details = (i.details as Productorderdetailtype[]) ?? [];
      const variantExtra = details.reduce((sum, detail) => {
        if (!detail.value) return sum;
        const variant = (i.product.Variant ?? []).find(
          (v) => v.id === detail.variant_id,
        );
        if (!variant) return sum;
        const variantLevelPrice = (variant as any).price;
        if (variantLevelPrice) {
          return sum + parseFloat(variantLevelPrice.toString());
        }
        const option = (
          variant.option_value as (string | VariantValueObjType)[]
        ).find((opt) =>
          typeof opt === "string"
            ? opt === detail.value
            : opt.val === detail.value,
        );
        if (option && typeof option !== "string" && option.price) {
          return sum + parseFloat(option.price.toString());
        }
        return sum;
      }, 0);

      const unitPrice = parseFloat(
        (baseDiscountedPrice + variantExtra).toFixed(2),
      );

      // Build variant description: "Title: value, Title: value"
      const variantDescription = details
        .map((detail) => {
          if (!detail.value) return null;
          const variant = (i.product.Variant ?? []).find(
            (v) => v.id === detail.variant_id,
          );
          if (!variant) return null;
          const option = (
            variant.option_value as (string | VariantValueObjType)[]
          ).find((opt) =>
            typeof opt === "string"
              ? opt === detail.value
              : opt.val === detail.value,
          );
          const displayValue =
            typeof option === "string"
              ? option
              : (option?.name ?? option?.val ?? detail.value);
          const title = (variant as any).option_title;
          return title ? `${title}: ${displayValue}` : displayValue;
        })
        .filter(Boolean)
        .join(", ");

      return {
        name: i.product.name.slice(0, 127), // PayPal max 127 chars
        quantity: i.quantity.toString(),
        ...(variantDescription && {
          description: variantDescription.slice(0, 127),
        }),
        unit_amount: {
          currency_code,
          value: unitPrice.toFixed(2),
        },
      };
    });

    // Derive item_total from rounded unit prices so PayPal's validation passes:
    // PayPal checks sum(unit_amount * quantity) == item_total exactly.
    const computedItemTotal = orderItems
      .reduce(
        (sum, item) =>
          sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
        0,
      )
      .toFixed(2);
    const shippingValue = orderPrice.shipping?.toFixed(2) ?? "0.00";
    const computedTotal = (
      parseFloat(computedItemTotal) + parseFloat(shippingValue)
    ).toFixed(2);

    let orderAmount: Paypalamounttype = {
      currency_code,
      value: computedTotal,
      breakdown: {
        shipping: {
          currency_code,
          value: shippingValue,
        },
        item_total: { currency_code, value: computedItemTotal },
      },
    };

    const isPickup = shippingtype?.value === "Pickup";
    const shipping = order.shipping;
    // address_line_2: house ID and commune (songkhat) — secondary details
    const address_line_2 = [shipping?.houseId, shipping?.songkhat]
      .filter(Boolean)
      .join(", ");

    let orderShipping: PaypalshippingType = {
      type: isPickup ? undefined : "SHIPPING",
      ...(!isPickup &&
        shipping?.street && {
          address: {
            address_line_1: shipping.street,
            ...(address_line_2 && { address_line_2 }),
            // admin_area_2 = city (required by PayPal) → district
            ...(shipping.district && { admin_area_2: shipping.district }),
            // admin_area_1 = state/province
            ...(shipping.province && { admin_area_1: shipping.province }),
            ...(shipping.postalcode && { postal_code: shipping.postalcode }),
            country_code: CountryCode.cambodia,
          },
        }),
    };

    const purchase_units: PurcahseUnitType = {
      amount: orderAmount,
      items: orderItems,
      shipping: orderShipping,
    };
    const payload = {
      intent: "CAPTURE",
      purchase_units: [purchase_units],
    };

    console.log("[PayPal] payload:", JSON.stringify(payload, null, 2));

    const request = await fetch(url, {
      headers: header,
      method: "POST",
      body: JSON.stringify(payload),
    });

    const jsonResponse = await request.json();

    if (!request.ok) {
      console.error(
        "[PayPal] error response:",
        JSON.stringify(jsonResponse, null, 2),
      );
    }

    return { success: true, data: jsonResponse, status: request.status };
  } catch (error) {
    console.log("Paypal Error", error);
    return { success: false, status: 500 };
  }
}

export async function CaptureOrder(orderId: string): Promise<Returntype> {
  try {
    const accessToken = await generateAccessToken();
    const url = `${process.env.PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;
    const header = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const request = await fetch(url, {
      method: "POST",
      headers: header,
    });
    const jsonResponse = await request.json();
    return { success: true, data: jsonResponse };
  } catch (error) {
    console.log("Capture Order", error);
    return { success: false, status: 500 };
  }
}

//helper function

export const SendOrderEmail = async (
  html: string,
  to: string,
  subject: string,
  attachment?: Uint8Array,
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APPKEY,
      },
    });
    const mailoptions = {
      from: `SrokSre <${process.env.EMAIL}>`,
      to: `<${to}>`,
      subject: subject,
      html: html,
    };

    await transporter.sendMail({
      ...mailoptions,
      attachments: attachment
        ? [
            {
              filename: `Invoice.pdf`,
              content: Buffer.from(attachment),
              contentType: "apllication/pdf",
            },
          ]
        : [],
    });
  } catch (error) {
    console.log("Send email", error);
    throw new Error("Email can't sent");
  }
};

interface Emaildata {
  to: string;
  subject: string;
  from?: string;
  html?: string;
  message?: string;
  warn?: string;
  title?: string;
}
export const handleEmail = async (data: Emaildata) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_APPKEY,
    },
  });

  const mailoptions = {
    from: data.from ? data.from : `SrokSre <${process.env.EMAIL}>`,
    to: `<${data.to}>`,
    subject: data.subject,
    html: OrderReciptEmail(data.html ?? ""),
  };
  try {
    await transporter.sendMail(mailoptions);
    return { success: true };
  } catch (error) {
    console.log("Send Email", error);
    return { success: false };
  }
};
