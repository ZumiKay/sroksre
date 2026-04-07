//Mocks definition
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn(),
}));
jest.mock("@/src/lib/session", () => ({
  getUser: jest.fn(),
}));
jest.mock("@/src/lib/prisma");
jest.mock("@/prisma/generated/prisma/client");
jest.mock("@/src/app/checkout/fetchaction.ts");

import { generateOrderData } from "@/src/_tests_/mocks/order";
import { updateStatus } from "@/src/app/checkout/action";
import { getCheckoutdata } from "@/src/app/checkout/fetchaction";
import { canPlaceOrder } from "@/src/app/checkout/helper";
import Prisma from "@/src/lib/prisma";
import { Ordertype } from "@/src/types/order.type";

//Mock methods
const mockedPrisma = Prisma as unknown as {
  products: {
    updateMany: jest.Func;
  };
  stockvalue: {
    updateMany: jest.Func;
  };
  orders: {
    update: jest.Func;
  };
  orderproduct: {
    updateMany: jest.Func;
  };
};

// Not mocking canPlaceOrder - using actual validation

jest.mock("@/src/app/api/order/helper", () => ({
  generateInvoicePdf: jest.fn(),
}));
jest.mock("@/src/app/component/EmailTemplate", () => ({
  formatDate: jest.fn(),
}));
jest.mock("@/src/app/component/Modals/User", () => ({}));
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));
jest.mock("@/src/lib/utilities", () => ({
  calculateDiscountProductPrice: jest.fn(),
  encrypt: jest.fn(),
  generateRandomNumber: jest.fn(() => "123456"),
  OrderReciptEmail: jest.fn(),
}));
jest.mock("@/src/context/Checkoutcontext", () => ({
  Shippingservice: [{ value: "Pickup", price: 0 }],
  CountryCode: { cambodia: "KH" },
}));
jest.mock("@/src/app/checkout/constants", () => ({
  CHECKOUT_SESSION_LIMIT_MS: 60 * 60 * 1000,
}));
jest.mock("@/src/app/severactions/notification_action", () => ({
  SaveNotification: jest.fn(),
  SaveUserNotification: jest.fn(),
}));

//Mock Prisma methods

mockedPrisma.orderproduct = {
  updateMany: jest.fn(),
};
mockedPrisma.products = { updateMany: jest.fn() };
mockedPrisma.stockvalue = { updateMany: jest.fn() };
mockedPrisma.orders = { update: jest.fn() };

///Test
describe("Testing Update Order Status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should Return Rejection If Data is Invalid", async () => {
    const invalidOrder = generateOrderData({
      customField: {
        status: "Unkown Status" as never,
      },
    }) as Ordertype;

    //mock resolved
    (getCheckoutdata as jest.Mock).mockResolvedValue(invalidOrder);

    const handleUpdateStatus = await updateStatus(
      invalidOrder.id as never,
      "",
      "",
    );
    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      status: 400,
    });
  });

  test("Should Return Error When Order is Null", async () => {
    (getCheckoutdata as jest.Mock).mockResolvedValue(null);

    const handleUpdateStatus = await updateStatus("invalid-id", "", "");

    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      status: 400,
    });
  });

  test("Should Return Error When User is Missing", async () => {
    const orderWithoutUser = generateOrderData({
      customField: {
        user: undefined,
      },
    }) as Ordertype;

    (getCheckoutdata as jest.Mock).mockResolvedValue(orderWithoutUser);

    const handleUpdateStatus = await updateStatus(
      orderWithoutUser.id as never,
      "",
      "",
    );

    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      status: 400,
    });
  });

  test("Should Handle Order Update Failure", async () => {
    const validOrder = generateOrderData() as Ordertype;

    (getCheckoutdata as jest.Mock).mockResolvedValue(validOrder);

    mockedPrisma.products.updateMany = jest.fn().mockResolvedValue({});
    mockedPrisma.stockvalue.updateMany = jest.fn().mockResolvedValue({});
    mockedPrisma.orders.update = jest
      .fn()
      .mockRejectedValue(new Error("Failed to update order"));

    const handleUpdateStatus = await updateStatus(
      validOrder.id as never,
      "",
      "",
    );

    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      message: "Error occurred",
      status: 500,
    });
  });

  test("Should Handle Invalid Order ID", async () => {
    (getCheckoutdata as jest.Mock).mockResolvedValue(null);

    const handleUpdateStatus = await updateStatus("", "", "");

    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      status: 400,
    });
  });

  test("Should Handle Multiple Promise Failures", async () => {
    const validOrder = generateOrderData() as Ordertype;
    (getCheckoutdata as jest.Mock).mockResolvedValue(validOrder);

    // Mock multiple failures
    mockedPrisma.products.updateMany = jest
      .fn()
      .mockRejectedValue(new Error("Product update failed"));
    mockedPrisma.orderproduct.updateMany = jest
      .fn()
      .mockRejectedValue(new Error("Order product update failed"));

    const handleUpdateStatus = await updateStatus(
      validOrder.id as never,
      "",
      "",
    );

    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      message: "Error occurred",
      status: 500,
    });
  });

  test("Should Handle Non-Error Exceptions", async () => {
    const validOrder = generateOrderData() as Ordertype;
    (getCheckoutdata as jest.Mock).mockResolvedValue(validOrder);

    // Mock throwing a non-Error object
    mockedPrisma.products.updateMany = jest
      .fn()
      .mockRejectedValue("Unexpected error string");

    const handleUpdateStatus = await updateStatus(
      validOrder.id as never,
      "",
      "",
    );

    expect(handleUpdateStatus).toStrictEqual({
      success: false,
      message: "Error occurred",
      status: 500,
    });
  });
});
