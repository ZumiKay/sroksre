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
import Prisma from "@/src/lib/prisma";
import { Ordertype } from "@/src/types/order.type";
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

jest.mock("@/src/app/checkout/helper", () => ({
  canPlaceOrder: jest.fn(),
}));

jest.mock("@/src/app/api/order/helper", () => ({
  generateInvoicePdf: jest.fn(),
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

  //Case 1
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
});
