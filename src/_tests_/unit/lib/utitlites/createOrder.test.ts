//Mocks mdoule

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/src/lib/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/src/lib/prisma");
jest.mock("@/prisma/generated/prisma/client");

//Mocks helper method
jest.mock("@/src/lib/utilities", () => ({
  calculateDiscountProductPrice: jest.fn(),
  encrypt: jest.fn(),
  generateRandomNumber: jest.fn(),
  OrderReciptEmail: jest.fn(),
}));

jest.mock("@/src/context/Checkoutcontext", () => ({
  Shippingservice: [{ value: "Pickup", price: 0 }],
}));

jest.mock("@/src/app/checkout/constants", () => ({
  CHECKOUT_SESSION_LIMIT_MS: 60 * 60 * 1000,
}));

//Mocks Module
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));
jest.mock("@/src/app/component/EmailTemplate", () => ({
  formatDate: jest.fn(),
}));
jest.mock("@/src/app/component/Modals/User", () => ({}));
jest.mock("@/src/app/checkout/helper", () => ({ canPlaceOrder: jest.fn() }));
jest.mock("@/src/app/checkout/fetchaction", () => ({
  getCheckoutdata: jest.fn(),
}));
jest.mock("@/src/app/severactions/notification_action", () => ({
  SaveNotification: jest.fn(),
  SaveUserNotification: jest.fn(),
}));
jest.mock("@/src/app/api/order/helper", () => ({
  generateInvoicePdf: jest.fn(),
}));

import { createOrder } from "@/src/app/checkout/action";
import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import * as utilities from "@/src/lib/utilities";
import { Allstatus, ShippingTypeEnum } from "@/src/types/order.type";
import { StockTypeEnum } from "@/src/types/product.type";

//Helper Mocks
const mockGetUser = getUser as jest.Mock;
const mockEncrypt = utilities.encrypt as jest.Mock;
const mockGenerateRandomNumber = utilities.generateRandomNumber as jest.Mock;
const mockCalculateDiscount =
  utilities.calculateDiscountProductPrice as jest.Mock;

//Prisma Mocks
const mockPrisma = Prisma as unknown as {
  orders: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  orderproduct: {
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  products: {
    updateMany: jest.Mock;
  };
  stockvalue: {
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

mockPrisma.orders = {
  findFirst: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};
mockPrisma.orderproduct = {
  findMany: jest.fn(),
  updateMany: jest.fn(),
};
mockPrisma.products = { updateMany: jest.fn() };
mockPrisma.stockvalue = { updateMany: jest.fn() };
mockPrisma.$transaction = jest.fn();

const makeUser = (overrides: Record<string, any> = {}) => ({
  userId: 1,
  user: { buyer_id: "buyer-001" },
  ...overrides,
});

/** A single cart item with no variants and no discount */
const makeCartItem = (id: number, overrides: Record<string, any> = {}) => ({
  id,
  orderId: null,
  quantity: 1,
  details: [],
  product: {
    id: id + 100,
    price: 10,
    discount: null,
    stocktype: StockTypeEnum.normal,
    Stock: [],
    Variant: [],
  },
  ...overrides,
});

const DEFAULT_ORDER_ID = "SSC123456";
const DEFAULT_ENCRYPT = "enc-abc";

beforeEach(() => {
  jest.clearAllMocks();

  // For create new order on default
  mockGetUser.mockResolvedValue(makeUser());
  mockPrisma.orders.findFirst.mockResolvedValue(null); // no existing unpaid order
  mockPrisma.orders.findUnique.mockResolvedValue(null); // generated ID is available
  mockPrisma.orders.create.mockResolvedValue({ id: DEFAULT_ORDER_ID });
  mockPrisma.orderproduct.findMany.mockResolvedValue([makeCartItem(1)]);
  mockPrisma.orderproduct.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.$transaction.mockResolvedValue([]);
  mockGenerateRandomNumber.mockReturnValue("123456");
  mockEncrypt.mockReturnValue(DEFAULT_ENCRYPT);
  mockCalculateDiscount.mockReturnValue({ discount: { newprice: 8 } });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createOrder", () => {
  describe("authentication", () => {
    it("returns No Access when user is null", async () => {
      mockGetUser.mockResolvedValue(null);

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result).toEqual({ success: false, message: "No Access" });
      expect(mockPrisma.orders.findFirst).not.toHaveBeenCalled();
    });

    it("returns No Access when buyer_id is missing", async () => {
      mockGetUser.mockResolvedValue({ userId: 1, user: {} });

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result).toEqual({ success: false, message: "No Access" });
    });
  });

  describe("cart validation", () => {
    it("returns No valid cart items when incartProduct is empty", async () => {
      const result = await createOrder({
        price: {} as any,
        incartProduct: [],
      });

      expect(result).toEqual({
        success: false,
        message: "No valid cart items",
      });
    });

    it("filters out invalid IDs before validating", async () => {
      const result = await createOrder({
        price: {} as any,
        incartProduct: [0, -1, -99],
      });

      expect(result).toEqual({
        success: false,
        message: "No valid cart items",
      });
    });

    it("filters out not int IDs", async () => {
      const result = await createOrder({
        price: {} as any,
        incartProduct: [1.5, 2.9],
      });

      expect(result).toEqual({
        success: false,
        message: "No valid cart items",
      });
    });

    it("duplicates repeated ID", async () => {
      mockPrisma.orderproduct.findMany.mockResolvedValue([makeCartItem(1)]);

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1, 1, 1],
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.orderproduct.updateMany).toHaveBeenCalledTimes(1);
    });

    it("returns Invalid cart selection when DB not match with requested items", async () => {
      mockPrisma.orderproduct.findMany.mockResolvedValue([makeCartItem(1)]);

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1, 2],
      });

      expect(result).toEqual({
        success: false,
        message: "Invalid cart selection",
      });
    });
  });

  describe("new order", () => {
    it("creates a new order and returns success with orderId and encrypt", async () => {
      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result).toEqual({
        success: true,
        data: { orderId: DEFAULT_ORDER_ID, encrypt: DEFAULT_ENCRYPT },
      });
      expect(mockPrisma.orders.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            buyer_id: "buyer-001",
            status: Allstatus.unpaid,
            shippingtype: ShippingTypeEnum.pickup,
          }),
        }),
      );
    });

    it("ID generation when the first generated ID already exists", async () => {
      mockPrisma.orders.findUnique
        .mockResolvedValueOnce({ id: "SSC111111" }) // collision
        .mockResolvedValueOnce(null); // free ID

      mockGenerateRandomNumber
        .mockReturnValueOnce("111111") // colliding ID
        .mockReturnValueOnce("999999"); // unique ID

      mockPrisma.orders.create.mockResolvedValue({ id: "SSC999999" });
      mockEncrypt.mockReturnValue("enc-999");

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result).toEqual({
        success: true,
        data: { orderId: "SSC999999", encrypt: "enc-999" },
      });
      expect(mockPrisma.orders.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrisma.orders.create).toHaveBeenCalledTimes(1);
    });

    it("links cart items to the new order", async () => {
      await createOrder({ price: {} as any, incartProduct: [1] });

      expect(mockPrisma.orderproduct.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 1 }),
          data: { orderId: DEFAULT_ORDER_ID },
        }),
      );
    });

    it("holds stock for newly linked cart items", async () => {
      await createOrder({ price: {} as any, incartProduct: [1] });

      // holdStockForItems → buildStockAdjustments → Prisma.$transaction
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("existing unpaid order (re-checkout)", () => {
    const recentOrder = {
      id: "SSC-EXISTING",
      status: Allstatus.unpaid,
      createdAt: new Date(), // fresh, not expired
      renewedAt: null,
    };

    beforeEach(() => {
      mockPrisma.orders.findFirst.mockResolvedValue(recentOrder);
      mockPrisma.orders.update.mockResolvedValue({});
      // Cart item already linked to the existing order
      mockPrisma.orderproduct.findMany.mockResolvedValue([
        makeCartItem(1, { orderId: recentOrder.id }),
      ]);
      mockEncrypt.mockReturnValue("enc-existing");
    });

    it("updates the existing order price instead of creating a new one", async () => {
      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe(recentOrder.id);
      expect(mockPrisma.orders.create).not.toHaveBeenCalled();
      expect(mockPrisma.orders.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: recentOrder.id } }),
      );
    });

    it("does NOT hold stock again for items already linked to the existing order", async () => {
      await createOrder({ price: {} as any, incartProduct: [1] });

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it("holds stock only for items that are newly entering the session", async () => {
      mockPrisma.orderproduct.findMany.mockResolvedValue([
        makeCartItem(1, { orderId: recentOrder.id }),
        makeCartItem(2, { orderId: null }),
      ]);
      mockPrisma.orderproduct.updateMany.mockResolvedValue({ count: 1 });

      await createOrder({ price: {} as any, incartProduct: [1, 2] });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ── Expired pre-existing order ──────────────────────────────────────────────
  describe("expired pre-existing order", () => {
    it("abandons the expired order and creates a fresh one", async () => {
      const expiredOrder = {
        id: "SSC-EXPIRED",
        status: Allstatus.unpaid,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 h ago
        renewedAt: null,
      };

      mockPrisma.orders.findFirst.mockResolvedValue(expiredOrder);
      mockPrisma.orderproduct.findMany
        .mockResolvedValueOnce([]) // release stock query (no products)
        .mockResolvedValueOnce([makeCartItem(1)]);
      mockPrisma.orders.update.mockResolvedValue({});
      mockPrisma.orderproduct.updateMany.mockResolvedValue({ count: 0 });

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result.success).toBe(true);
      // A new order should have been created (not the expired one)
      expect(mockPrisma.orders.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.orders.create).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: "SSC-EXPIRED" }),
        }),
      );
    });
  });

  // ── Price calculation ───────────────────────────────────────────────────────
  describe("price calculation", () => {
    it("uses discounted price when product has a discount", async () => {
      const discountedItem = makeCartItem(1, {
        quantity: 2,
        product: {
          id: 101,
          price: 100,
          discount: { percent: 20 },
          stocktype: StockTypeEnum.normal,
          Stock: [],
          Variant: [],
        },
      });
      mockPrisma.orderproduct.findMany.mockResolvedValue([discountedItem]);
      // calculateDiscountProductPrice returns newprice: 80
      mockCalculateDiscount.mockReturnValue({ discount: { newprice: 80 } });

      await createOrder({ price: {} as any, incartProduct: [1] });

      expect(mockPrisma.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: expect.objectContaining({ subtotal: 160 }), // 80 * 2
          }),
        }),
      );
    });

    it("uses base price when product has no discount", async () => {
      const plainItem = makeCartItem(1, { quantity: 3 }); // price = 10
      mockPrisma.orderproduct.findMany.mockResolvedValue([plainItem]);

      await createOrder({ price: {} as any, incartProduct: [1] });

      expect(mockPrisma.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: expect.objectContaining({ subtotal: 30 }), // 10 * 3
          }),
        }),
      );
    });

    it("adds variant-level price extra to the subtotal", async () => {
      const itemWithVariant = makeCartItem(1, {
        quantity: 1,
        details: [{ variant_id: 10, value: "Red" }],
        product: {
          id: 101,
          price: 50,
          discount: null,
          stocktype: StockTypeEnum.normal,
          Stock: [],
          Variant: [
            { id: 10, price: 5, option_title: "Color", option_value: [] },
          ],
        },
      });
      mockPrisma.orderproduct.findMany.mockResolvedValue([itemWithVariant]);

      await createOrder({ price: {} as any, incartProduct: [1] });

      expect(mockPrisma.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            // extra = 5, total = subtotal(50) + extra(5) + shipping(0)
            price: expect.objectContaining({ extra: 5, total: 55 }),
          }),
        }),
      );
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────────
  describe("error handling", () => {
    it("returns Error Occured when orders.create throws", async () => {
      mockPrisma.orders.create.mockRejectedValue(new Error("DB down"));

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result).toEqual({ success: false, message: "Error Occured" });
    });

    it("returns Error Occured when orderproduct.updateMany throws", async () => {
      mockPrisma.orderproduct.updateMany.mockRejectedValue(
        new Error("updateMany failed"),
      );

      const result = await createOrder({
        price: {} as any,
        incartProduct: [1],
      });

      expect(result).toEqual({ success: false, message: "Error Occured" });
    });
  });
});
