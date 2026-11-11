// Server-only payment settlement, shared by the confirmPayment server action
// and the PayPal webhook. Deliberately NOT "use server": nothing here does an
// auth check, so none of it may be callable from the browser.

import Prisma from "@/src/lib/prisma";
import {
  Allstatus,
  Ordertype,
  Productorderdetailtype,
  totalpricetype,
} from "@/src/types/order.type";
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
  OrderReciptEmail,
} from "@/src/lib/utilities";
import { shippingtype } from "../component/Modals/User";
import { formatDate } from "../component/EmailTemplate";
import {
  ProductStockType,
  VariantValueObjType,
} from "@/src/types/product.type";
import { getCheckoutdata } from "./fetchaction";
import {
  SaveNotification,
  SaveUserNotification,
} from "@/src/app/severactions/notification_action";
import { generateInvoicePdf } from "../api/order/helper";
import {
  capturePaypalOrder,
  getPaypalOrder,
  paypalAmountMatches,
} from "@/src/lib/paypal";
import { SendOrderEmail } from "@/src/lib/email";
import { renderOrderReceiptHtml } from "./orderReceipt";

export interface SettleResult {
  success: boolean;
  message?: string;
  status?: number;
}

/**
 * Build the PayPal purchase unit for a local order from server-side data.
 * Used both when creating the PayPal order and when verifying it before
 * capture, so the amount PayPal charges is always checked against the same
 * numbers.
 */
export async function buildPaypalPurchaseUnit(
  orderId: string,
): Promise<PurcahseUnitType | null> {
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

  if (!order) return null;

  const currency_code = "USD";
  const orderPrice = order.price as unknown as totalpricetype;
  const shippingtype = Shippingservice.find(
    (i) => i.value === order.shippingtype,
  );

  const orderItems: Paypalitemtype[] = order.Orderproduct.map((i) => {
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
      const variantLevelPrice = variant.price;
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
        const title = variant.option_title;
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

  const orderAmount: Paypalamounttype = {
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

  const orderShipping: PaypalshippingType = {
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
    custom_id: orderId,
    amount: orderAmount,
    items: orderItems,
    shipping: orderShipping,
  };

  return purchase_units;
}

/**
 * Verify a PayPal order against the local order, capture it if needed, and
 * mark the local order paid exactly once. Callers must have already decided
 * the caller is allowed to settle this order (owner session or verified
 * PayPal webhook).
 */
export async function settlePaypalPayment(
  orderId: string,
  paypalOrderId: string,
): Promise<SettleResult> {
  const expected = await buildPaypalPurchaseUnit(orderId);
  if (!expected) {
    return { success: false, message: "Invalid Order", status: 404 };
  }

  // Verify the PayPal order before charging anything.
  const lookup = await getPaypalOrder(paypalOrderId);
  if (!lookup.ok) {
    console.error(
      "[PayPal] order lookup failed:",
      lookup.status,
      lookup.data.debug_id,
    );
    return {
      success: false,
      message: "Unable to verify payment",
      status: 502,
    };
  }

  const lookupUnit = lookup.data.purchase_units?.[0];
  if (
    lookupUnit?.custom_id !== orderId ||
    !paypalAmountMatches(lookupUnit?.amount, expected.amount)
  ) {
    console.error("[PayPal] order does not match local order", {
      orderId,
      paypalOrderId,
      custom_id: lookupUnit?.custom_id,
      amount: lookupUnit?.amount,
      expected: expected.amount,
    });
    return {
      success: false,
      message: "Order total has changed, please try again",
      status: 409,
    };
  }

  let paid = lookup.data;
  if (lookup.data.status === "APPROVED") {
    const capture = await capturePaypalOrder(paypalOrderId, orderId);
    if (capture.data.details?.[0]?.issue === "INSTRUMENT_DECLINED") {
      return { success: false, message: "INSTRUMENT_DECLINED", status: 402 };
    }
    if (!capture.ok) {
      console.error(
        "[PayPal] capture failed:",
        capture.status,
        capture.data.debug_id,
        JSON.stringify(capture.data.details ?? []),
      );
      return { success: false, message: "Payment failed", status: 402 };
    }
    paid = capture.data;
  } else if (lookup.data.status !== "COMPLETED") {
    // Not approved yet (or voided): never mark paid.
    return {
      success: false,
      message: "Payment has not been approved",
      status: 402,
    };
  }

  const captured = paid.purchase_units?.[0]?.payments?.captures?.[0];
  if (
    paid.status !== "COMPLETED" ||
    captured?.status !== "COMPLETED" ||
    !captured.id ||
    !paypalAmountMatches(captured.amount, expected.amount)
  ) {
    console.error("[PayPal] capture not completed or amount mismatch", {
      orderId,
      paypalOrderId,
      status: paid.status,
      capture: captured,
      expected: expected.amount,
    });
    return {
      success: false,
      message: "Payment was not completed",
      status: 402,
    };
  }

  // Atomic unpaid -> paid. A replayed or concurrent call matches 0 rows.
  const updated = await Prisma.orders.updateMany({
    where: { id: orderId, status: Allstatus.unpaid, paypalOrderId },
    data: { status: Allstatus.paid, paypalCaptureId: captured.id },
  });

  if (updated.count === 0) {
    const current = await Prisma.orders.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (current?.status === Allstatus.paid) {
      return { success: true, message: "Payment already confirmed" };
    }
    // Money was captured but the order left "unpaid" (e.g. it expired in
    // between). Needs a manual refund until refunds are automated.
    console.error("[PayPal] captured payment for non-payable order", {
      orderId,
      paypalOrderId,
      captureId: captured.id,
      status: current?.status,
    });
    return {
      success: false,
      message:
        "Payment received but the order could not be confirmed. Please contact support.",
      status: 409,
    };
  }

  const order = await getCheckoutdata(orderId);
  if (order) {
    await finalizePaidOrder(order);
  }

  return { success: true, message: "Payment completed" };
}

/**
 * Side effects after an order has been marked paid. Runs once per order
 * (guarded by the conditional update in settlePaypalPayment). Failures here are
 * logged, not returned: the payment itself already succeeded.
 */
async function finalizePaidOrder(order: Ordertype): Promise<void> {
  const orderId = order.id as string;
  const paidOrder: Ordertype = { ...order, status: Allstatus.paid };

  try {
    await Prisma.$transaction([
      Prisma.orderproduct.updateMany({
        where: { orderId },
        data: { status: Allstatus.paid },
      }),
      // Count every unit sold, not one per product line.
      ...order.Orderproduct.filter((i) => i.productId).map((i) =>
        Prisma.products.updateMany({
          where: { id: i.productId as number },
          data: { amount_sold: { increment: i.quantity } },
        }),
      ),
    ]);
  } catch (error) {
    console.error("[Order] failed to update paid order items", orderId, error);
  }

  if (order.user?.email) {
    try {
      const { html, adminhtml } = await renderOrderReceiptHtml(paidOrder);

      const createInvoice = await generateInvoicePdf({
        id: orderId,
        product: order.Orderproduct.filter((i) => i.product).map((prob) => ({
          id: prob.product?.id as number,
          name: prob.product?.name as string,
          price: prob.price,
          selectedVariant: prob.selectedvariant ?? [],
          quantity: prob.quantity,
          totalprice:
            prob.quantity *
            (prob.price.discount?.newprice ??
              prob.price.price + (prob.price.extra ?? 0)),
        })),
        price: order.price as unknown as totalpricetype,
        shipping: (order.shipping as unknown as shippingtype) ?? undefined,
        createdAt: formatDate(order.createdAt as Date),
      });

      await Promise.all([
        SendOrderEmail(
          OrderReciptEmail(html),
          order.user.email,
          `Order #${orderId} receipt and processing for shipping`,
          createInvoice,
        ),
        SendOrderEmail(
          adminhtml,
          process.env.EMAIL as string,
          `Order #${orderId} request`,
          createInvoice,
        ),
      ]);
    } catch (error) {
      console.error("[Order] failed to send receipt emails", orderId, error);
    }
  }

  try {
    //Send notification
    const notifPromises: Promise<unknown>[] = [
      SaveNotification({
        type: "order",
        content: `New order #${orderId} has been placed`,
        link: `/dashboard/order/${orderId}`,
        checked: false,
      }),
    ];
    if (order.user?.id) {
      notifPromises.push(
        SaveUserNotification(order.user.id, {
          type: "order",
          content: `Your order #${orderId} has been confirmed and is being processed`,
          link: `/account/orders`,
          checked: false,
        }),
      );
    }
    await Promise.all(notifPromises);

    //OutOfStock notification for admin
    const productIds = order.Orderproduct.filter((i) => i.productId).map(
      (i) => i.productId as number,
    );
    const oosProducts = await getOutOfStockProducts(productIds);
    if (oosProducts.length > 0) {
      await Promise.all(
        oosProducts.map((p) =>
          SaveNotification({
            type: "stock",
            content: `"${p.name}" is out of stock`,
            link: `/dashboard/products/${p.id}`,
            checked: false,
          }),
        ),
      );
    }
  } catch (error) {
    console.error("[Order] failed to send notifications", orderId, error);
  }
}

//Out of stock

async function getOutOfStockProducts(productIds: number[]) {
  if (productIds.length === 0) return [];

  const products = await Prisma.products.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      stocktype: true,
      stock: true,
      Stock: {
        select: {
          Stockvalue: { select: { id: true, qty: true } },
        },
      },
      Variant: {
        select: { id: true, qty: true, option_value: true },
      },
    },
  });

  const outOfStock: Array<{ id: number; name: string }> = [];

  for (const product of products) {
    let isOutStock = false;

    //normal stock
    if (product.stocktype === ProductStockType.stock) {
      if ((product.stock ?? 0) <= 0) isOutStock = true;
    }
    //Variant stock type
    else {
      const hasOOSStockvalue = product.Stock.some((s) =>
        s.Stockvalue.some((sv) => sv.qty <= 0),
      );
      if (hasOOSStockvalue) isOutStock = true;
    }

    // Variant with qty field, and option_value items with qty
    if (!isOutStock) {
      for (const variant of product.Variant) {
        if (
          variant.qty !== null &&
          variant.qty !== undefined &&
          variant.qty <= 0
        ) {
          isOutStock = true;
          break;
        }
        const opts = (variant.option_value ?? []) as (
          string | VariantValueObjType
        )[];
        const hasOOSOption = opts.some(
          (opt) =>
            typeof opt !== "string" && opt.qty !== undefined && opt.qty <= 0,
        );
        if (hasOOSOption) {
          isOutStock = true;
          break;
        }
      }
    }

    if (isOutStock) outOfStock.push({ id: product.id, name: product.name });
  }

  return outOfStock;
}
