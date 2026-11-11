/** confirmPayment: server-side PayPal verification + atomic paid transition */

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/src/lib/session", () => ({ getUser: jest.fn() }));
jest.mock("@/src/lib/promotion", () => ({
  syncExpiredPromotions: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    orders: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    orderproduct: { updateMany: jest.fn(), findMany: jest.fn() },
    products: { updateMany: jest.fn(), findMany: jest.fn() },
    stockvalue: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("@/src/lib/paypal", () => ({
  ...jest.requireActual("@/src/lib/paypal"),
  getPaypalOrder: jest.fn(),
  capturePaypalOrder: jest.fn(),
  createPaypalCheckoutOrder: jest.fn(),
}));
jest.mock("@/src/lib/email", () => ({ SendOrderEmail: jest.fn() }));
jest.mock("@/src/app/checkout/orderReceipt", () => ({
  renderOrderReceiptHtml: jest.fn(),
}));
jest.mock("@/src/lib/utilities", () => ({
  calculateDiscountProductPrice: jest.fn(),
  encrypt: jest.fn(),
  generateRandomNumber: jest.fn(),
  OrderReciptEmail: jest.fn((html: string) => `<wrapped>${html}</wrapped>`),
}));
jest.mock("@/src/context/Checkoutcontext", () => ({
  Shippingservice: [
    { value: "Pickup", price: 0 },
    { value: "Economy", price: 5 },
  ],
  CountryCode: { cambodia: "KH" },
}));
jest.mock("@/src/app/component/EmailTemplate", () => ({
  formatDate: jest.fn(() => "2024-01-01"),
}));
jest.mock("@/src/app/component/Modals/User", () => ({}));
jest.mock("@/src/app/checkout/fetchaction", () => ({
  getCheckoutdata: jest.fn(),
}));
jest.mock("@/src/app/severactions/notification_action", () => ({
  SaveNotification: jest.fn().mockResolvedValue(undefined),
  SaveUserNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/src/app/api/order/helper", () => ({
  generateInvoicePdf: jest.fn(),
}));

import { confirmPayment } from "@/src/app/checkout/action";
import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { capturePaypalOrder, getPaypalOrder } from "@/src/lib/paypal";
import { SendOrderEmail } from "@/src/lib/email";
import { renderOrderReceiptHtml } from "@/src/app/checkout/orderReceipt";
import { getCheckoutdata } from "@/src/app/checkout/fetchaction";
import { generateInvoicePdf } from "@/src/app/api/order/helper";
import { Allstatus } from "@/src/types/order.type";

const ORDER_ID = "SSC123456";
const PAYPAL_ID = "PAYPAL-ORDER-123";
const CAPTURE_ID = "CAPTURE-1";
const BUYER = "buyer-001";

const mockOrders = Prisma.orders as unknown as {
  findUnique: jest.Mock;
  updateMany: jest.Mock;
};
const mockProducts = Prisma.products as unknown as { updateMany: jest.Mock };
const mockOrderproduct = Prisma.orderproduct as unknown as {
  updateMany: jest.Mock;
};
const mockGetPaypalOrder = getPaypalOrder as jest.Mock;
const mockCapture = capturePaypalOrder as jest.Mock;
const mockSendOrderEmail = SendOrderEmail as jest.Mock;

// Expected PayPal total for the order below: 2 x 10.00 + 5.00 shipping
const AMOUNT = { currency_code: "USD", value: "25.00" };

/** DB state the mocked Prisma serves. */
let db: {
  status: string;
  paypalOrderId: string | null;
  statusAfterConflict: string;
};

const paypalOrderRow = () => ({
  id: ORDER_ID,
  buyer_id: BUYER,
  status: db.status,
  estimate: null,
  price: { subtotal: 20, shipping: 5, total: 25 },
  shippingtype: "Economy",
  shipping: null,
  user: { id: 1, firstname: "A", lastname: "B", email: "buyer@example.com" },
  Orderproduct: [
    {
      id: 1,
      quantity: 2,
      details: [],
      product: {
        id: 101,
        name: "Test Product",
        price: 10,
        discount: null,
        covers: [],
        Variant: [],
      },
    },
  ],
});

const checkoutData = () => ({
  id: ORDER_ID,
  buyer_id: BUYER,
  status: Allstatus.paid,
  price: { subtotal: 20, shipping: 5, total: 25 },
  createdAt: new Date("2024-01-01"),
  user: { id: 1, email: "buyer@example.com" },
  shipping: null,
  Orderproduct: [
    {
      id: 1,
      productId: 101,
      quantity: 2,
      price: { price: 12, discount: { newprice: 10 } },
      selectedvariant: null,
      product: { id: 101, name: "Test Product" },
    },
  ],
});

const paypalOrder = (overrides: Record<string, unknown> = {}) => ({
  ok: true,
  status: 200,
  data: {
    id: PAYPAL_ID,
    status: "APPROVED",
    purchase_units: [{ custom_id: ORDER_ID, amount: AMOUNT }],
    ...overrides,
  },
});

const completedCapture = (amount = AMOUNT, status = "COMPLETED") => ({
  ok: true,
  status: 201,
  data: {
    id: PAYPAL_ID,
    status,
    purchase_units: [
      {
        custom_id: ORDER_ID,
        amount,
        payments: { captures: [{ id: CAPTURE_ID, status, amount }] },
      },
    ],
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  db = {
    status: Allstatus.unpaid,
    paypalOrderId: PAYPAL_ID,
    statusAfterConflict: Allstatus.paid,
  };

  (getUser as jest.Mock).mockResolvedValue({
    userId: 1,
    user: { buyer_id: BUYER },
  });

  mockOrders.findUnique.mockImplementation(
    async ({
      where,
      select,
    }: {
      where: { id: string; buyer_id?: string };
      select: Record<string, unknown>;
    }) => {
      if (where.id !== ORDER_ID) return null;
      // checkOrder: scoped to the logged-in buyer
      if (select.createdAt) {
        if (where.buyer_id !== BUYER) return null;
        return {
          id: ORDER_ID,
          status: db.status,
          createdAt: new Date(),
          renewedAt: null,
        };
      }
      if (select.paypalOrderId) return { paypalOrderId: db.paypalOrderId };
      if (select.Orderproduct) return paypalOrderRow();
      return { status: db.statusAfterConflict };
    },
  );
  mockOrders.updateMany.mockResolvedValue({ count: 1 });
  mockProducts.updateMany.mockResolvedValue({ count: 1 });
  mockOrderproduct.updateMany.mockResolvedValue({ count: 1 });
  (Prisma.$transaction as jest.Mock).mockImplementation((ops: unknown[]) =>
    Promise.all(ops),
  );

  mockGetPaypalOrder.mockResolvedValue(paypalOrder());
  mockCapture.mockResolvedValue(completedCapture());

  (getCheckoutdata as jest.Mock).mockResolvedValue(checkoutData());
  (renderOrderReceiptHtml as jest.Mock).mockResolvedValue({
    html: "<p>receipt</p>",
    adminhtml: "<p>admin</p>",
  });
  (generateInvoicePdf as jest.Mock).mockResolvedValue(new Uint8Array([1]));
  mockSendOrderEmail.mockResolvedValue(undefined);
});

const expectNotPaid = () => {
  expect(mockOrders.updateMany).not.toHaveBeenCalled();
  expect(mockSendOrderEmail).not.toHaveBeenCalled();
};

describe("confirmPayment", () => {
  describe("access control", () => {
    it("rejects when not logged in, without contacting PayPal", async () => {
      (getUser as jest.Mock).mockResolvedValue(null);

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 410 });
      expect(mockGetPaypalOrder).not.toHaveBeenCalled();
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("rejects another buyer's order", async () => {
      (getUser as jest.Mock).mockResolvedValue({
        userId: 2,
        user: { buyer_id: "someone-else" },
      });

      const result = await confirmPayment(ORDER_ID);

      expect(result.success).toBe(false);
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("rejects a malformed order ID", async () => {
      const result = await confirmPayment("../../etc");

      expect(result.success).toBe(false);
      expect(mockOrders.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("order state", () => {
    it("is a no-op success when the order is already paid", async () => {
      db.status = Allstatus.paid;

      const result = await confirmPayment(ORDER_ID);

      expect(result).toEqual({
        success: true,
        message: "Payment already confirmed",
      });
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("rejects an order that is no longer unpaid", async () => {
      db.status = Allstatus.abandoned;

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 409 });
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("rejects when no PayPal order was created for this checkout", async () => {
      db.paypalOrderId = null;

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 400 });
      expect(mockGetPaypalOrder).not.toHaveBeenCalled();
      expectNotPaid();
    });
  });

  describe("PayPal verification before capture", () => {
    it("refuses a PayPal order that belongs to a different local order", async () => {
      mockGetPaypalOrder.mockResolvedValue(
        paypalOrder({
          purchase_units: [{ custom_id: "SSC999999", amount: AMOUNT }],
        }),
      );

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 409 });
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("refuses when the PayPal amount differs from the server total", async () => {
      mockGetPaypalOrder.mockResolvedValue(
        paypalOrder({
          purchase_units: [
            {
              custom_id: ORDER_ID,
              amount: { currency_code: "USD", value: "0.01" },
            },
          ],
        }),
      );

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 409 });
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("refuses when the currency differs", async () => {
      mockGetPaypalOrder.mockResolvedValue(
        paypalOrder({
          purchase_units: [
            {
              custom_id: ORDER_ID,
              amount: { currency_code: "EUR", value: "25.00" },
            },
          ],
        }),
      );

      const result = await confirmPayment(ORDER_ID);

      expect(result.success).toBe(false);
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("refuses a PayPal order the buyer has not approved", async () => {
      mockGetPaypalOrder.mockResolvedValue(paypalOrder({ status: "CREATED" }));

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 402 });
      expect(mockCapture).not.toHaveBeenCalled();
      expectNotPaid();
    });

    it("fails closed when PayPal lookup fails", async () => {
      mockGetPaypalOrder.mockResolvedValue({
        ok: false,
        status: 500,
        data: {},
      });

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 502 });
      expectNotPaid();
    });
  });

  describe("capture", () => {
    it("returns INSTRUMENT_DECLINED so the client can restart", async () => {
      mockCapture.mockResolvedValue({
        ok: false,
        status: 422,
        data: { details: [{ issue: "INSTRUMENT_DECLINED" }] },
      });

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({
        success: false,
        message: "INSTRUMENT_DECLINED",
      });
      expectNotPaid();
    });

    it("does not mark paid when the capture is still pending", async () => {
      mockCapture.mockResolvedValue(completedCapture(AMOUNT, "PENDING"));

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 402 });
      expectNotPaid();
    });

    it("does not mark paid when the captured amount is wrong", async () => {
      mockCapture.mockResolvedValue(
        completedCapture({ currency_code: "USD", value: "1.00" }),
      );

      const result = await confirmPayment(ORDER_ID);

      expect(result.success).toBe(false);
      expectNotPaid();
    });

    it("captures the stored PayPal order with an idempotency key", async () => {
      await confirmPayment(ORDER_ID);

      expect(mockGetPaypalOrder).toHaveBeenCalledWith(PAYPAL_ID);
      expect(mockCapture).toHaveBeenCalledWith(PAYPAL_ID, ORDER_ID);
    });

    it("skips capture on retry when PayPal already completed it", async () => {
      mockGetPaypalOrder.mockResolvedValue(completedCapture());

      const result = await confirmPayment(ORDER_ID);

      expect(result).toEqual({ success: true, message: "Payment completed" });
      expect(mockCapture).not.toHaveBeenCalled();
      expect(mockOrders.updateMany).toHaveBeenCalled();
    });
  });

  describe("marking the order paid", () => {
    it("transitions unpaid -> paid atomically and stores the capture ID", async () => {
      const result = await confirmPayment(ORDER_ID);

      expect(result).toEqual({ success: true, message: "Payment completed" });
      expect(mockOrders.updateMany).toHaveBeenCalledWith({
        where: {
          id: ORDER_ID,
          status: Allstatus.unpaid,
          paypalOrderId: PAYPAL_ID,
        },
        data: { status: Allstatus.paid, paypalCaptureId: CAPTURE_ID },
      });
      expect(mockOrderproduct.updateMany).toHaveBeenCalledWith({
        where: { orderId: ORDER_ID },
        data: { status: Allstatus.paid },
      });
    });

    it("increments amount_sold by the quantity bought", async () => {
      await confirmPayment(ORDER_ID);

      expect(mockProducts.updateMany).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { amount_sold: { increment: 2 } },
      });
    });

    it("sends server-rendered receipt and admin emails once", async () => {
      await confirmPayment(ORDER_ID);

      expect(renderOrderReceiptHtml).toHaveBeenCalledWith(
        expect.objectContaining({ id: ORDER_ID, status: Allstatus.paid }),
      );
      expect(mockSendOrderEmail).toHaveBeenCalledTimes(2);
      expect(mockSendOrderEmail).toHaveBeenCalledWith(
        "<wrapped><p>receipt</p></wrapped>",
        "buyer@example.com",
        expect.stringContaining(ORDER_ID),
        expect.any(Uint8Array),
      );
    });

    it("uses the discounted price in the invoice", async () => {
      await confirmPayment(ORDER_ID);

      expect(generateInvoicePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          product: [expect.objectContaining({ totalprice: 20 })],
        }),
      );
    });

    it("sends nothing on a replayed or concurrent confirmation", async () => {
      mockOrders.updateMany.mockResolvedValue({ count: 0 });

      const result = await confirmPayment(ORDER_ID);

      expect(result).toEqual({
        success: true,
        message: "Payment already confirmed",
      });
      expect(mockSendOrderEmail).not.toHaveBeenCalled();
      expect(mockProducts.updateMany).not.toHaveBeenCalled();
    });

    it("reports a captured payment whose order could not be confirmed", async () => {
      mockOrders.updateMany.mockResolvedValue({ count: 0 });
      db.statusAfterConflict = Allstatus.abandoned;

      const result = await confirmPayment(ORDER_ID);

      expect(result).toMatchObject({ success: false, status: 409 });
      expect(result.message).toMatch(/contact support/i);
      expect(mockSendOrderEmail).not.toHaveBeenCalled();
    });

    it("still succeeds when emails fail after payment", async () => {
      mockSendOrderEmail.mockRejectedValue(new Error("smtp down"));

      const result = await confirmPayment(ORDER_ID);

      expect(result).toEqual({ success: true, message: "Payment completed" });
    });
  });
});
