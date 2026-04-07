//Mock modules and Helpers
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));
jest.mock("@/src/lib/session", () => ({
  getUser: jest.fn(),
}));
jest.mock("@/src/lib/prisma");
jest.mock("@/prisma/generated/prisma/client");

//Imports

import { CheckCart } from "@/src/app/product/detail/[id]/action";
import Prisma from "@/src/lib/prisma";
import { getUser } from "@/src/lib/session";
import {
  Allstatus,
  Productorderdetailtype,
  Productordertype,
} from "@/src/types/order.type";
import { StockTypeEnum, VariantValueObjType } from "@/src/types/product.type";
import { Usersessiontype } from "@/src/types/user.type";

//Mock prisma
const mockedPrisma = Prisma as unknown as {
  orderproduct: {
    findMany: jest.Mock;
  };
};

mockedPrisma.orderproduct = {
  findMany: jest.fn(),
};

describe("Check Cart Method", () => {
  const toBeTestUser: Partial<Usersessiontype> = {
    sessionid: "sessionID",
    refresh_token_hash: "ssss",
    userId: 1,
    createdAt: new Date(),
    device: "Safari",
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should Throw Error", async () => {
    (getUser as jest.Mock)
      .mockResolvedValue(toBeTestUser)
      .mockResolvedValue({});
    mockedPrisma.orderproduct.findMany.mockRejectedValue(new Error("DB Error"));
    const isCheck = await CheckCart();

    expect(isCheck).toMatchObject({ success: false, message: "Network error" });
  });

  test("check without ProductId", async () => {
    const inCartItems: Productorderdetailtype[] = [
      { variant_id: 1, value: "variant1" },
      { variant_id: 2, value: "variant2" },
      {
        variant_id: 3,
        value: "variant3",
      },
    ];
    const inDBOrderProduct: Array<Partial<Productordertype>> = [
      {
        id: 1,
        details: inCartItems,
        user_id: 1,
        status: Allstatus.incart,
        product: {
          stocktype: StockTypeEnum.normal,
        } as never,
      },
    ];

    (getUser as jest.Mock).mockResolvedValue(toBeTestUser);
    mockedPrisma.orderproduct.findMany.mockResolvedValue(inDBOrderProduct);

    const isInCart = await CheckCart(inCartItems);

    expect(isInCart).toMatchObject({
      success: true,
      incart: true,
    });
  });

  test("check By ProductId", async () => {
    const productId = 1;
    const inDBOrderProduct: Array<Partial<Productordertype>> = [
      {
        id: 1,
        user_id: 1,
        status: Allstatus.incart,
        productId: 1,
        product: {
          stocktype: StockTypeEnum.normal,
        } as never,
      },
    ];
    (getUser as jest.Mock).mockResolvedValue(toBeTestUser);
    mockedPrisma.orderproduct.findMany.mockResolvedValue(inDBOrderProduct);

    const isInCart = await CheckCart(undefined, productId);

    expect(isInCart).toMatchObject({
      success: true,
      incart: true,
    });
  });
});
