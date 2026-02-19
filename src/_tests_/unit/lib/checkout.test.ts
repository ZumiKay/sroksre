/**Test Checkout updateStatus method */

// Mock all dependencies before imports
jest.mock("@/src/lib/session", () => ({
  getUser: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    products: {
      updateMany: jest.fn(),
    },
    stockvalue: {
      updateMany: jest.fn(),
    },
    orders: {
      update: jest.fn(),
    },
    orderproduct: {
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("@/src/app/checkout/page", () => ({
  getCheckoutdata: jest.fn(),
}));

jest.mock("@/src/app/checkout/helper", () => ({
  canPlaceOrder: jest.fn(),
}));

jest.mock("@/src/app/api/order/route", () => ({
  generateInvoicePdf: jest.fn(),
}));

jest.mock("@/src/lib/utilities", () => ({
  ...jest.requireActual("@/src/lib/utilities"),
  OrderReciptEmail: jest.fn((html) => html),
}));

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));

// Import types first
import { Allstatus } from "@/src/types/order.type";
import { ProductStockType } from "@/src/types/product.type";

// Import mocked modules
import Prisma from "@/src/lib/prisma";
import { getCheckoutdata } from "@/src/app/checkout/page";
import { canPlaceOrder } from "@/src/app/checkout/helper";
import { generateInvoicePdf } from "@/src/app/api/order/route";

// Import the module and create spy
import * as checkoutActions from "@/src/app/checkout/action";
const mockSendOrderEmail = jest.spyOn(checkoutActions, "SendOrderEmail");

describe("updateStatus", () => {
  const mockOrderId = "SSC123456";
  const mockHtml = "<html>User Receipt</html>";
  const mockAdminHtml = "<html>Admin Order</html>";
  const mockInvoicePdf = new Uint8Array([1, 2, 3]);

  beforeEach(() => {
    jest.clearAllMocks();
    (generateInvoicePdf as jest.Mock).mockResolvedValue(mockInvoicePdf);
    mockSendOrderEmail.mockResolvedValue(undefined);
  });

  describe("Success scenarios", () => {
    it("should successfully update order status for products with stock type", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 100,
          shipping: 10,
          total: 110,
        },
        shipping: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
          street: "123 Main St",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 1,
            productId: 1,
            quantity: 2,
            price: {
              price: 50,
            },
            selectedvariant: null,
            product: {
              id: 1,
              name: "Test Product",
              stocktype: ProductStockType.stock,
              stock: 10,
              Stock: null,
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.products.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Payment completed");

      // Verify product stock was decremented
      expect(Prisma.products.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [{ id: 1 }, { stock: { not: 0 } }],
          }),
          data: { stock: { decrement: 2 } },
        }),
      );

      // Verify order status was updated to paid
      expect(Prisma.orders.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: { status: Allstatus.paid },
      });

      // Verify emails were sent
      expect(mockSendOrderEmail).toHaveBeenCalledTimes(2);
      expect(mockSendOrderEmail).toHaveBeenCalledWith(
        mockHtml,
        "user@example.com",
        `Order #${mockOrderId} receipt and processing for shipping`,
        mockInvoicePdf,
      );
    });

    it("should successfully update order status for products with stock variations", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 100,
          shipping: 10,
          total: 110,
        },
        shipping: {
          id: 1,
          firstname: "Jane",
          lastname: "Smith",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 2,
            productId: 2,
            quantity: 1,
            price: {
              price: 100,
            },
            selectedvariant: null,
            product: {
              id: 2,
              name: "Variant Product",
              stocktype: ProductStockType.variant,
              Stock: [
                {
                  id: 1,
                  Stockvalue: [
                    { id: 10, qty: 5 },
                    { id: 11, qty: 3 },
                  ],
                },
              ],
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.stockvalue.updateMany as jest.Mock).mockResolvedValue({
        count: 2,
      });
      (Prisma.products.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Payment completed");

      // Verify stock values were decremented
      expect(Prisma.stockvalue.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [{ id: { in: [10, 11] } }, { qty: { not: 0 } }],
          }),
          data: { qty: { decrement: 1 } },
        }),
      );
    });

    it("should handle products with discount pricing correctly", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 80,
          shipping: 10,
          total: 90,
        },
        shipping: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 3,
            productId: 3,
            quantity: 2,
            price: {
              price: 50,
              discount: {
                newprice: 40,
              },
            },
            selectedvariant: null,
            product: {
              id: 3,
              name: "Discounted Product",
              stocktype: ProductStockType.stock,
              stock: 20,
              Stock: null,
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.products.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(true);

      // Verify invoice includes discounted price
      expect(generateInvoicePdf).toHaveBeenCalledWith(
        expect.objectContaining({
          product: expect.arrayContaining([
            expect.objectContaining({
              totalprice: 80, // 2 * 40 (discounted price)
            }),
          ]),
        }),
      );
    });
  });

  describe("Failure scenarios", () => {
    it("should return error when order is not found", async () => {
      (getCheckoutdata as jest.Mock).mockResolvedValue(null);

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(Prisma.orders.update).not.toHaveBeenCalled();
      expect(mockSendOrderEmail).not.toHaveBeenCalled();
    });

    it("should return error when order cannot be placed (invalid order)", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        Orderproduct: [],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(false);

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(Prisma.orders.update).not.toHaveBeenCalled();
      expect(mockSendOrderEmail).not.toHaveBeenCalled();
    });

    it("should return error when user email is missing", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: null,
        },
        Orderproduct: [
          {
            id: 1,
            productId: 1,
            quantity: 1,
            price: { price: 50 },
            product: {
              id: 1,
              name: "Test Product",
              stocktype: ProductStockType.stock,
              stock: 5,
              Stock: null,
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(Prisma.orders.update).not.toHaveBeenCalled();
      expect(mockSendOrderEmail).not.toHaveBeenCalled();
    });

    it("should handle database update errors gracefully", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 100,
          shipping: 10,
          total: 110,
        },
        shipping: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 1,
            productId: 1,
            quantity: 1,
            price: { price: 100 },
            selectedvariant: null,
            product: {
              id: 1,
              name: "Test Product",
              stocktype: ProductStockType.stock,
              stock: 5,
              Stock: null,
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.products.updateMany as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error occurred");
    });

    it("should handle email sending errors gracefully", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 100,
          shipping: 10,
          total: 110,
        },
        shipping: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 1,
            productId: 1,
            quantity: 1,
            price: { price: 100 },
            selectedvariant: null,
            product: {
              id: 1,
              name: "Test Product",
              stocktype: ProductStockType.stock,
              stock: 5,
              Stock: null,
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.products.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      mockSendOrderEmail.mockRejectedValue(new Error("Email service error"));

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Error occurred");
    });
  });

  describe("Edge cases", () => {
    it("should handle products with null Stock array", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 50,
          shipping: 10,
          total: 60,
        },
        shipping: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 1,
            productId: 1,
            quantity: 1,
            price: { price: 50 },
            selectedvariant: null,
            product: {
              id: 1,
              name: "Test Product",
              stocktype: ProductStockType.stock,
              stock: 5,
              Stock: null,
            },
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.products.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(true);
      expect(Prisma.stockvalue.updateMany).not.toHaveBeenCalled();
    });

    it("should filter out products without productId", async () => {
      const mockOrder = {
        id: mockOrderId,
        user: {
          email: "user@example.com",
        },
        price: {
          price: 50,
          shipping: 10,
          total: 60,
        },
        shipping: {
          id: 1,
          firstname: "John",
          lastname: "Doe",
        },
        createdAt: new Date("2024-01-01"),
        Orderproduct: [
          {
            id: 1,
            productId: 1,
            quantity: 1,
            price: { price: 50 },
            selectedvariant: null,
            product: {
              id: 1,
              name: "Valid Product",
              stocktype: ProductStockType.stock,
              stock: 5,
              Stock: null,
            },
          },
          {
            id: 2,
            productId: null,
            quantity: 1,
            price: { price: 0 },
            selectedvariant: null,
            product: null,
          },
        ],
      };

      (getCheckoutdata as jest.Mock).mockResolvedValue(mockOrder);
      (canPlaceOrder as jest.Mock).mockReturnValue(true);
      (Prisma.products.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (Prisma.orders.update as jest.Mock).mockResolvedValue({});
      (Prisma.orderproduct.updateMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      const result = await checkoutActions.updateStatus(
        mockOrderId,
        mockHtml,
        mockAdminHtml,
      );

      expect(result.success).toBe(true);

      // Verify amount_sold incremented for only valid products
      expect(Prisma.products.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: [1] } },
          data: { amount_sold: { increment: 1 } },
        }),
      );
    });
  });
});
