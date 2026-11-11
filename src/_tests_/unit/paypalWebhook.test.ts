/** PayPal webhook: signature-gated, settles via the shared settlement path */

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: { orders: { findUnique: jest.fn() } },
}));
jest.mock("@/src/lib/paypal", () => ({
  verifyWebhookSignature: jest.fn(),
}));
jest.mock("@/src/app/checkout/payment", () => ({
  settlePaypalPayment: jest.fn(),
}));

import { POST } from "@/src/app/api/paypal/webhook/route";
import Prisma from "@/src/lib/prisma";
import { verifyWebhookSignature } from "@/src/lib/paypal";
import { settlePaypalPayment } from "@/src/app/checkout/payment";
import { Allstatus } from "@/src/types/order.type";

const mockVerify = verifyWebhookSignature as jest.Mock;
const mockSettle = settlePaypalPayment as jest.Mock;
const mockFindUnique = Prisma.orders.findUnique as unknown as jest.Mock;

const ORDER_ID = "SSC123456";
const PAYPAL_ID = "PAYPAL-ORDER-123";

const approved = {
  id: "WH-1",
  event_type: "CHECKOUT.ORDER.APPROVED",
  resource: { id: PAYPAL_ID, status: "APPROVED" },
};
const captured = {
  id: "WH-2",
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: "CAPTURE-1",
    status: "COMPLETED",
    supplementary_data: { related_ids: { order_id: PAYPAL_ID } },
  },
};

const request = (body: unknown) =>
  ({
    headers: new Headers(),
    json: async () => {
      if (typeof body === "string") throw new SyntaxError("bad json");
      return body;
    },
  }) as unknown as Request;

beforeEach(() => {
  jest.clearAllMocks();
  mockVerify.mockResolvedValue(true);
  mockFindUnique.mockResolvedValue({ id: ORDER_ID, status: Allstatus.unpaid });
  mockSettle.mockResolvedValue({ success: true, message: "Payment completed" });
});

describe("POST /api/paypal/webhook", () => {
  it("rejects a malformed body", async () => {
    const res = await POST(request("not json"));
    expect(res.status).toBe(400);
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("rejects an unverified signature without touching orders", async () => {
    mockVerify.mockResolvedValue(false);

    const res = await POST(request(approved));

    expect(res.status).toBe(401);
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("acknowledges and ignores unrelated events", async () => {
    const res = await POST(
      request({ event_type: "PAYMENT.CAPTURE.REFUNDED", resource: {} }),
    );

    expect(res.status).toBe(200);
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("settles an approved order using the PayPal order ID", async () => {
    const res = await POST(request(approved));

    expect(res.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { paypalOrderId: PAYPAL_ID },
      select: { id: true, status: true },
    });
    expect(mockSettle).toHaveBeenCalledWith(ORDER_ID, PAYPAL_ID);
  });

  it("maps a completed capture back to its PayPal order", async () => {
    await POST(request(captured));

    expect(mockSettle).toHaveBeenCalledWith(ORDER_ID, PAYPAL_ID);
  });

  it("ignores PayPal orders this shop never bound", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await POST(request(approved));

    expect(res.status).toBe(200);
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("does nothing for an order that is already paid", async () => {
    mockFindUnique.mockResolvedValue({ id: ORDER_ID, status: Allstatus.paid });

    const res = await POST(request(captured));

    expect(res.status).toBe(200);
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("does not capture an abandoned order", async () => {
    mockFindUnique.mockResolvedValue({
      id: ORDER_ID,
      status: Allstatus.abandoned,
    });

    const res = await POST(request(approved));

    expect(res.status).toBe(200);
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("asks PayPal to retry on a transient failure", async () => {
    mockSettle.mockResolvedValue({ success: false, status: 502 });

    const res = await POST(request(approved));

    expect(res.status).toBe(500);
  });

  it("acknowledges a permanent failure so PayPal stops retrying", async () => {
    mockSettle.mockResolvedValue({ success: false, status: 409 });

    const res = await POST(request(approved));

    expect(res.status).toBe(200);
  });

  it("asks PayPal to retry when the database throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("db down"));

    const res = await POST(request(approved));

    expect(res.status).toBe(500);
  });
});
