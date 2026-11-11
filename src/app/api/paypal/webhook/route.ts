// PayPal webhook: settles payments the browser never confirmed (tab closed,
// network dropped, server action interrupted).
//
// Subscribe the webhook in the PayPal dashboard to:
//   - CHECKOUT.ORDER.APPROVED   (buyer approved; capture server-side)
//   - PAYMENT.CAPTURE.COMPLETED (money captured; make sure the order is paid)
// and set PAYPAL_WEBHOOK_ID to that webhook's ID.

import {
  verifyWebhookSignature,
  type PaypalWebhookEvent,
} from "@/src/lib/paypal";
import Prisma from "@/src/lib/prisma";
import { Allstatus } from "@/src/types/order.type";
import { settlePaypalPayment } from "@/src/app/checkout/payment";

const HANDLED_EVENTS = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "PAYMENT.CAPTURE.COMPLETED",
]);

/** The PayPal order ID an event refers to. */
const paypalOrderIdFromEvent = (event: PaypalWebhookEvent) =>
  event.event_type === "CHECKOUT.ORDER.APPROVED"
    ? event.resource?.id
    : event.resource?.supplementary_data?.related_ids?.order_id;

// 2xx tells PayPal to stop; anything else makes it retry for up to 3 days.
const ack = (body: Record<string, unknown> = { received: true }) =>
  Response.json(body, { status: 200 });

export async function POST(req: Request) {
  let event: PaypalWebhookEvent;
  try {
    event = (await req.json()) as PaypalWebhookEvent;
  } catch {
    return Response.json({ message: "Invalid body" }, { status: 400 });
  }

  if (!(await verifyWebhookSignature(req.headers, event))) {
    return Response.json({ message: "Invalid signature" }, { status: 401 });
  }

  if (!event.event_type || !HANDLED_EVENTS.has(event.event_type)) {
    return ack({ ignored: true });
  }

  const paypalOrderId = paypalOrderIdFromEvent(event);
  if (!paypalOrderId) {
    console.error("[PayPal webhook] event without order id", event.id);
    return ack({ ignored: true });
  }

  try {
    const order = await Prisma.orders.findUnique({
      where: { paypalOrderId },
      select: { id: true, status: true },
    });

    if (!order) {
      // A PayPal order this shop never bound to a checkout (or one replaced by
      // a newer attempt). Nothing to settle.
      console.warn("[PayPal webhook] unknown PayPal order", paypalOrderId);
      return ack({ ignored: true });
    }

    if (order.status === Allstatus.paid) return ack();

    if (order.status !== Allstatus.unpaid) {
      // e.g. abandoned: stock was released, so don't capture. If the money was
      // already captured, this needs a manual refund.
      console.error("[PayPal webhook] order not payable", {
        orderId: order.id,
        status: order.status,
        paypalOrderId,
        event: event.event_type,
      });
      return ack({ ignored: true });
    }

    const result = await settlePaypalPayment(order.id, paypalOrderId);

    // Transient failures (PayPal/DB unavailable): let PayPal retry.
    if (!result.success && (result.status ?? 500) >= 500) {
      return Response.json({ message: result.message }, { status: 500 });
    }
    if (!result.success) {
      console.error("[PayPal webhook] could not settle", {
        orderId: order.id,
        paypalOrderId,
        result,
      });
    }
    return ack();
  } catch (error) {
    console.error("[PayPal webhook] error", error);
    return Response.json({ message: "Webhook failed" }, { status: 500 });
  }
}
