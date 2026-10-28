jest.mock("@/src/lib/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    products: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    stockvalue: {
      updateMany: jest.fn(),
    },
    orders: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderproduct: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import { Allstatus } from "@/src/types/order.type";
import { StockTypeEnum } from "@/src/types/product.type";
import { CHECKOUT_SESSION_LIMIT_MS } from "@/src/app/checkout/constants";
import {
  isValidOrderId,
  isCheckoutSessionExpired,
  buildStockAdjustments,
} from "@/src/app/checkout/stock";
import { renewCheckoutSession, terminateCheckoutSession } from "@/src/app/checkout/action";

describe("Checkout Session & Stock Hold/Release Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUser as jest.Mock).mockResolvedValue({
      user: { buyer_id: "BUYER_123" },
    });
  });

  describe("isValidOrderId", () => {
    it("accepts valid alphanumeric, dashed, and underscored IDs between 6 and 64 chars", () => {
      expect(isValidOrderId("ORDER_123456")).toBe(true);
      expect(isValidOrderId("ord-9988-test")).toBe(true);
      expect(isValidOrderId("abc123XYZ")).toBe(true);
    });

    it("rejects IDs that are too short, empty, undefined, or contain forbidden characters", () => {
      expect(isValidOrderId("abc")).toBe(false);
      expect(isValidOrderId("")).toBe(false);
      expect(isValidOrderId(undefined)).toBe(false);
      expect(isValidOrderId("order#12345")).toBe(false);
      expect(isValidOrderId("order 12345")).toBe(false);
    });
  });

  describe("isCheckoutSessionExpired", () => {
    const now = 1700000000000;

    it("returns false if created within checkout session limit (10 mins)", () => {
      const createdAt = new Date(now - 5 * 60 * 1000); // 5 mins ago
      expect(isCheckoutSessionExpired(createdAt, null, now)).toBe(false);
    });

    it("returns true if created beyond checkout session limit", () => {
      const createdAt = new Date(now - (CHECKOUT_SESSION_LIMIT_MS + 1000)); // 10m 1s ago
      expect(isCheckoutSessionExpired(createdAt, null, now)).toBe(true);
    });

    it("evaluates expiry against renewedAt when renewedAt is present", () => {
      const createdAt = new Date(now - (CHECKOUT_SESSION_LIMIT_MS * 2)); // created 2 hours ago
      const renewedAt = new Date(now - 10 * 60 * 1000); // renewed 10 mins ago (active)
      expect(isCheckoutSessionExpired(createdAt, renewedAt, now)).toBe(false);

      const oldRenewedAt = new Date(now - (CHECKOUT_SESSION_LIMIT_MS + 1000)); // renewed over 1 hour ago
      expect(isCheckoutSessionExpired(createdAt, oldRenewedAt, now)).toBe(true);
    });
  });

  describe("buildStockAdjustments", () => {
    it("builds decrement query with gte guard for normal stock", () => {
      const items = [
        {
          quantity: 2,
          product: {
            id: 10,
            stocktype: StockTypeEnum.normal,
            Stock: [],
          },
        },
      ];

      buildStockAdjustments(items as any, "decrement");
      expect(Prisma.products.updateMany).toHaveBeenCalledWith({
        where: { AND: [{ id: 10 }, { stock: { gte: 2 } }] },
        data: { stock: { decrement: 2 } },
      });
    });

    it("builds increment query without gte guard for normal stock restore", () => {
      const items = [
        {
          quantity: 2,
          product: {
            id: 10,
            stocktype: StockTypeEnum.normal,
            Stock: [],
          },
        },
      ];

      buildStockAdjustments(items as any, "increment");
      expect(Prisma.products.updateMany).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { stock: { increment: 2 } },
      });
    });

    it("builds decrement and increment queries for variant stockvalue IDs", () => {
      const items = [
        {
          quantity: 1,
          product: {
            id: 20,
            stocktype: StockTypeEnum.variants,
            Stock: [
              {
                Stockvalue: [{ id: 501 }, { id: 502 }],
              },
            ],
          },
        },
      ];

      buildStockAdjustments(items as any, "decrement");
      expect(Prisma.stockvalue.updateMany).toHaveBeenCalledWith({
        where: { AND: [{ id: { in: [501, 502] } }, { qty: { gte: 1 } }] },
        data: { qty: { decrement: 1 } },
      });

      buildStockAdjustments(items as any, "increment");
      expect(Prisma.stockvalue.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [501, 502] } },
        data: { qty: { increment: 1 } },
      });
    });
  });

  describe("renewCheckoutSession", () => {
    it("rejects invalid order ID format", async () => {
      const res = await renewCheckoutSession("short");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Invalid order");
    });

    it("rejects if order is not found or not in unpaid status", async () => {
      (Prisma.orders.findUnique as jest.Mock).mockResolvedValue({
        id: "ORDER_123456",
        status: Allstatus.paid,
      });

      const res = await renewCheckoutSession("ORDER_123456");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Checkout session expired");
    });

    it("successfully updates renewedAt for active unpaid order", async () => {
      (Prisma.orders.findUnique as jest.Mock).mockResolvedValue({
        id: "ORDER_123456",
        status: Allstatus.unpaid,
        createdAt: new Date(),
      });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});

      const res = await renewCheckoutSession("ORDER_123456");
      expect(res.success).toBe(true);
      expect(res.renewedAt).toBeDefined();
      expect(Prisma.orders.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ORDER_123456" },
          data: expect.objectContaining({ renewedAt: expect.any(Date) }),
        })
      );
    });
  });

  describe("terminateCheckoutSession", () => {
    it("rejects invalid order ID format", async () => {
      const res = await terminateCheckoutSession("bad");
      expect(res.success).toBe(false);
    });

    it("rejects if order is not unpaid", async () => {
      (Prisma.orders.findUnique as jest.Mock).mockResolvedValue({
        id: "ORDER_123456",
        status: Allstatus.paid,
      });

      const res = await terminateCheckoutSession("ORDER_123456");
      expect(res.success).toBe(false);
      expect(res.message).toBe("Order not found or already paid");
    });

    it("releases stock, unlinks cart products, and marks order abandoned", async () => {
      (Prisma.orders.findUnique as jest.Mock).mockResolvedValue({
        id: "ORDER_123456",
        status: Allstatus.unpaid,
      });
      (Prisma.orderproduct.findMany as jest.Mock).mockResolvedValue([
        {
          quantity: 2,
          product: {
            id: 5,
            stocktype: StockTypeEnum.normal,
            Stock: [],
          },
        },
      ]);
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.$transaction as jest.Mock).mockResolvedValue([]);

      const res = await terminateCheckoutSession("ORDER_123456");

      expect(res.success).toBe(true);
      // Unlink orderproducts back to cart
      expect(Prisma.orderproduct.updateMany).toHaveBeenCalledWith({
        where: { orderId: "ORDER_123456" },
        data: { orderId: null },
      });
      // Mark order as abandoned
      expect(Prisma.orders.update).toHaveBeenCalledWith({
        where: { id: "ORDER_123456" },
        data: { status: Allstatus.abandoned },
      });
    });
  });
});
