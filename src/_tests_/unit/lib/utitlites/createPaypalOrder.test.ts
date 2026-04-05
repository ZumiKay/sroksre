//Module mock
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/src/lib/session", () => ({ getUser: jest.fn() }));
jest.mock("@/src/lib/prisma");
jest.mock("@/prisma/generated/prisma/client");
jest.mock("@/src/lib/utilities", () => ({
  calculateDiscountProductPrice: jest.fn(),
  encrypt: jest.fn(),
  generateRandomNumber: jest.fn(),
  OrderReciptEmail: jest.fn(),
}));
jest.mock("@/src/context/Checkoutcontext", () => ({
  Shippingservice: [
    { value: "Pickup", price: 0 },
    { value: "Economy", price: 5 },
  ],
  CountryCode: { cambodia: "KH" },
}));
jest.mock("@/src/app/checkout/constants", () => ({
  CHECKOUT_SESSION_LIMIT_MS: 60 * 60 * 1000,
}));
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

// ── Imports ───────────────────────────────────────────────────────────────────

import { createPaypalOrder } from "@/src/app/checkout/action";
import { getUser } from "@/src/lib/session";
import Prisma from "@/src/lib/prisma";
import * as utilities from "@/src/lib/utilities";
import { Allstatus } from "@/src/types/order.type";

// ── Mock method ─────────────────────────────────────────────────────────────

const mockGetUser = getUser as jest.Mock;
const mockCalculateDiscount =
  utilities.calculateDiscountProductPrice as jest.Mock;

const mockPrisma = Prisma as unknown as {
  orders: { findUnique: jest.Mock };
};
mockPrisma.orders = { findUnique: jest.fn() };

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Helpers ───────────────────────────────────────────────────────────────────

const ORDER_ID = "SSC123456";

const makeUser = () => ({
  userId: 1,
  user: { buyer_id: "buyer-001" },
});

/** Correct paypal order structure */
const makeOrder = (overrides: Record<string, any> = {}) => ({
  id: ORDER_ID,
  buyer_id: "buyer-001",
  status: Allstatus.unpaid,
  estimate: null,
  price: { subtotal: 20, shipping: 5, total: 25 },
  shippingtype: "Economy",
  shipping: {
    street: "123 Main St",
    houseId: "A1",
    songkhat: "Daun Penh",
    district: "Daun Penh",
    province: "Phnom Penh",
    postalcode: "12000",
  },
  user: {
    id: 1,
    firstname: "John",
    lastname: "Doe",
    email: "john@example.com",
  },
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
        covers: [{ id: 1, url: "https://example.com/img.jpg" }],
        Variant: [],
      },
    },
  ],
  ...overrides,
});

/** A resolved fetch response */
const mockFetchResponse = (body: object, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);

beforeEach(() => {
  jest.clearAllMocks();
  process.env.PAYPAL_BASE = "https://api-m.sandbox.paypal.com";
  process.env.NEXT_PUBLIC_PAYPAL_ID = "test-client-id";
  process.env.PAYPAL_KEY = "test-client-secret";

  // Default: valid authenticated user
  mockGetUser.mockResolvedValue(makeUser());

  // Default: order is valid and unpaid
  mockPrisma.orders.findUnique
    .mockResolvedValueOnce({
      id: ORDER_ID,
      status: Allstatus.unpaid,
      createdAt: new Date(),
      renewedAt: null,
    }) // checkOrder call
    .mockResolvedValueOnce(makeOrder()); // createPaypalOrder db fetch

  // Default: access token fetch
  mockFetch
    .mockResolvedValueOnce(
      mockFetchResponse({ access_token: "test-token" }), // generateAccessToken
    )
    .mockResolvedValueOnce(
      mockFetchResponse({ id: "PAYPAL-ORDER-123", status: "CREATED" }), // PayPal order creation
    );

  mockCalculateDiscount.mockReturnValue({ discount: { newprice: 8 } });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("createPaypalOrder", () => {
  describe("order validation", () => {
    it("returns 410 when checkOrder returns null (session expired or invalid)", async () => {
      mockGetUser.mockResolvedValue(null);
      mockPrisma.orders.findUnique.mockReset();

      const result = await createPaypalOrder(ORDER_ID);

      expect(result).toEqual({
        success: false,
        message: "Checkout session expired",
        status: 410,
      });
    });

    it("returns 400 when order status is not unpaid", async () => {
      mockPrisma.orders.findUnique.mockReset().mockResolvedValueOnce({
        id: ORDER_ID,
        status: Allstatus.paid,
        createdAt: new Date(),
        renewedAt: null,
      });

      const result = await createPaypalOrder(ORDER_ID);

      expect(result).toEqual({
        success: false,
        message: "Order is no longer unpaid",
        status: 400,
      });
    });

    it("returns 404 when Prisma findUnique returns null for the order", async () => {
      mockPrisma.orders.findUnique
        .mockReset()
        .mockResolvedValueOnce({
          id: ORDER_ID,
          status: Allstatus.unpaid,
          createdAt: new Date(),
          renewedAt: null,
        }) // checkOrder
        .mockResolvedValueOnce(null);

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ access_token: "test-token" }),
      );

      const result = await createPaypalOrder(ORDER_ID);

      expect(result).toEqual({
        success: false,
        message: "Invalid Order",
        status: 404,
      });
    });

    it("returns error when access token cannot be obtained", async () => {
      mockFetch
        .mockReset()
        .mockResolvedValueOnce(
          mockFetchResponse({ error: "invalid_client" }, false, 401),
        ); // generateAccessToken returns undefined access_token

      const result = await createPaypalOrder(ORDER_ID);

      expect(result).toEqual({ success: false, message: "Invalid Token" });
    });
  });

  describe("successful PayPal order creation", () => {
    it("returns success with PayPal response data", async () => {
      const result = await createPaypalOrder(ORDER_ID);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: "PAYPAL-ORDER-123",
        status: "CREATED",
      });
      expect(result.status).toBe(200);
    });

    it("includes correct item name, quantity, and unit_amount", async () => {
      await createPaypalOrder(ORDER_ID);

      const [, options] = mockFetch.mock.calls[1];
      const payload = JSON.parse(options.body);
      const item = payload.purchase_units[0].items[0];

      expect(item.name).toBe("Test Product");
      expect(item.quantity).toBe("2");
      expect(item.unit_amount).toEqual({
        currency_code: "USD",
        value: "10.00",
      });
    });

    it("computes item_total as sum of (unit_amount * quantity) across all items", async () => {
      await createPaypalOrder(ORDER_ID);

      const [, options] = mockFetch.mock.calls[1];
      const payload = JSON.parse(options.body);
      const { breakdown } = payload.purchase_units[0].amount;

      // 2 × $10 = $20
      expect(breakdown.item_total.value).toBe("20.00");
    });
  });

  describe("discount and variant pricing", () => {
    it("uses discounted price when product has a discount", async () => {
      const orderWithDiscount = makeOrder({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            details: [],
            product: {
              id: 101,
              name: "Discounted Product",
              price: 100,
              discount: { percent: 20 },
              covers: [],
              Variant: [],
            },
          },
        ],
        price: { subtotal: 80, shipping: 0, total: 80 },
      });

      mockCalculateDiscount.mockReturnValue({ discount: { newprice: 80 } });
      mockPrisma.orders.findUnique
        .mockReset()
        .mockResolvedValueOnce({
          id: ORDER_ID,
          status: Allstatus.unpaid,
          createdAt: new Date(),
          renewedAt: null,
        })
        .mockResolvedValueOnce(orderWithDiscount);

      await createPaypalOrder(ORDER_ID);

      const [, options] = mockFetch.mock.calls[1];
      const payload = JSON.parse(options.body);
      const item = payload.purchase_units[0].items[0];

      expect(item.unit_amount.value).toBe("80.00");
    });

    it("adds variant-level extra price to unit amount", async () => {
      const orderWithVariant = makeOrder({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            details: [{ variant_id: 10, value: "Red" }],
            product: {
              id: 101,
              name: "Variant Product",
              price: 50,
              discount: null,
              covers: [],
              Variant: [
                { id: 10, price: 5, option_title: "Color", option_value: [] },
              ],
            },
          },
        ],
        price: { subtotal: 55, shipping: 0, total: 55 },
      });

      mockPrisma.orders.findUnique
        .mockReset()
        .mockResolvedValueOnce({
          id: ORDER_ID,
          status: Allstatus.unpaid,
          createdAt: new Date(),
          renewedAt: null,
        })
        .mockResolvedValueOnce(orderWithVariant);

      await createPaypalOrder(ORDER_ID);

      const [, options] = mockFetch.mock.calls[1];
      const payload = JSON.parse(options.body);
      const item = payload.purchase_units[0].items[0];

      // base 50 + variant extra 5
      expect(item.unit_amount.value).toBe("55.00");
    });

    it("includes variant description when variant option is selected", async () => {
      const orderWithVariant = makeOrder({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            details: [{ variant_id: 10, value: "Red" }],
            product: {
              id: 101,
              name: "Variant Product",
              price: 50,
              discount: null,
              covers: [],
              Variant: [
                {
                  id: 10,
                  price: null,
                  option_title: "Color",
                  option_value: ["Red", "Blue"],
                },
              ],
            },
          },
        ],
        price: { subtotal: 50, shipping: 0, total: 50 },
      });

      mockPrisma.orders.findUnique
        .mockReset()
        .mockResolvedValueOnce({
          id: ORDER_ID,
          status: Allstatus.unpaid,
          createdAt: new Date(),
          renewedAt: null,
        })
        .mockResolvedValueOnce(orderWithVariant);

      await createPaypalOrder(ORDER_ID);

      const [, options] = mockFetch.mock.calls[1];
      const payload = JSON.parse(options.body);
      const item = payload.purchase_units[0].items[0];

      expect(item.description).toBe("Color: Red");
    });
  });

  describe("error handling", () => {
    it("returns status 500 when the PayPal order fetch throws", async () => {
      mockFetch
        .mockReset()
        .mockResolvedValueOnce(
          mockFetchResponse({ access_token: "test-token" }),
        ) // token succeeds
        .mockRejectedValueOnce(new Error("Network error")); // PayPal call throws

      const result = await createPaypalOrder(ORDER_ID);

      expect(result).toEqual({ success: false, status: 500 });
    });

    it("returns status 500 when Prisma throws", async () => {
      mockPrisma.orders.findUnique
        .mockReset()
        .mockResolvedValueOnce({
          id: ORDER_ID,
          status: Allstatus.unpaid,
          createdAt: new Date(),
          renewedAt: null,
        })
        .mockRejectedValueOnce(new Error("DB error"));

      mockFetch.mockResolvedValueOnce(
        mockFetchResponse({ access_token: "test-token" }),
      );

      const result = await createPaypalOrder(ORDER_ID);

      expect(result).toEqual({ success: false, status: 500 });
    });
  });
});
