/** Customer notifications: written only for order status changes, to the order's owner */

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    orders: { findMany: jest.fn() },
    notification: { createMany: jest.fn() },
  },
}));

import Prisma from "@/src/lib/prisma";
import { notifyOrderStatus, orderStatusMessage } from "@/src/lib/notification";
import { Allstatus } from "@/src/types/order.type";

const mockFindMany = Prisma.orders.findMany as unknown as jest.Mock;
const mockCreateMany = Prisma.notification.createMany as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFindMany.mockResolvedValue([
    { id: "SSC1", user: { id: 7 } },
    { id: "SSC2", user: { id: 9 } },
  ]);
  mockCreateMany.mockResolvedValue({ count: 2 });
});

describe("notifyOrderStatus", () => {
  it("writes one notification per order, addressed to its owner", async () => {
    await notifyOrderStatus(["SSC1", "SSC2"], Allstatus.shipped);

    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [
        {
          type: "Order update",
          content: "Your order #SSC1 has been shipped",
          link: "/dashboard/order?q=SSC1",
          userid: 7,
        },
        {
          type: "Order update",
          content: "Your order #SSC2 has been shipped",
          link: "/dashboard/order?q=SSC2",
          userid: 9,
        },
      ],
    });
  });

  it("skips abandoned orders", async () => {
    await notifyOrderStatus(["SSC1"], Allstatus.abandoned);

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it("does nothing for an empty list or unknown orders", async () => {
    await notifyOrderStatus([], Allstatus.shipped);
    mockFindMany.mockResolvedValue([]);
    await notifyOrderStatus(["NOPE"], Allstatus.shipped);

    expect(mockCreateMany).not.toHaveBeenCalled();
  });

  it("never throws when the database fails", async () => {
    mockCreateMany.mockRejectedValue(new Error("db down"));

    await expect(
      notifyOrderStatus(["SSC1"], Allstatus.shipped),
    ).resolves.toBeUndefined();
  });
});

describe("orderStatusMessage", () => {
  it("has friendly wording per status and a generic fallback", () => {
    expect(orderStatusMessage("A", Allstatus.prepareing)).toBe(
      "Your order #A is being prepared",
    );
    expect(orderStatusMessage("A", Allstatus.arrived)).toBe(
      "Your order #A has arrived",
    );
    expect(orderStatusMessage("A", Allstatus.unpaid)).toBe(
      "Your order #A is now Unpaid",
    );
  });
});
