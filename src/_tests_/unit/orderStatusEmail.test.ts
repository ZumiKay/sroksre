/** Admin order status updates: admin-only, valid statuses, server-rendered email */

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    orders: { updateMany: jest.fn(), findMany: jest.fn() },
  },
}));
jest.mock("@/src/lib/session", () => ({ requireAdmin: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/src/lib/utilities", () => ({
  OrderReciptEmail: jest.fn((html: string) => `<wrapped>${html}</wrapped>`),
}));
jest.mock("@/src/lib/email", () => ({
  ...jest.requireActual("@/src/lib/email"),
  SendOrderEmail: jest.fn(),
}));
jest.mock("@/src/app/checkout/orderReceipt", () => ({
  renderOrderReceiptHtml: jest.fn(),
}));
jest.mock("@/src/app/checkout/fetchaction", () => ({
  getCheckoutdata: jest.fn(),
}));
jest.mock("@/src/app/dashboard/order/OrderComponent", () => ({}));

import {
  bulkUpdateOrderStatus,
  updateOrderStatus,
} from "@/src/app/dashboard/order/action";
import Prisma from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/session";
import { SendOrderEmail } from "@/src/lib/email";
import { renderOrderReceiptHtml } from "@/src/app/checkout/orderReceipt";
import { getCheckoutdata } from "@/src/app/checkout/fetchaction";
import { Allstatus } from "@/src/types/order.type";

const mockUpdateMany = Prisma.orders.updateMany as unknown as jest.Mock;
const mockFindMany = Prisma.orders.findMany as unknown as jest.Mock;
const mockSend = SendOrderEmail as jest.Mock;
const mockRender = renderOrderReceiptHtml as jest.Mock;

const ORDER_ID = "SSC123456";

beforeEach(() => {
  jest.clearAllMocks();
  (requireAdmin as jest.Mock).mockResolvedValue({ sessionid: "s" });
  mockUpdateMany.mockResolvedValue({ count: 1 });
  (getCheckoutdata as jest.Mock).mockResolvedValue({
    id: ORDER_ID,
    status: Allstatus.paid,
    user: { email: "buyer@example.com" },
    Orderproduct: [],
  });
  mockRender.mockResolvedValue({ html: "<p>server</p>", adminhtml: "" });
  mockSend.mockResolvedValue(undefined);
});

describe("updateOrderStatus", () => {
  it("refuses non-admins", async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);

    const res = await updateOrderStatus(Allstatus.shipped, ORDER_ID);

    expect(res).toEqual({ success: false, message: "Unauthorized" });
    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects a status that isn't a real order status", async () => {
    const res = await updateOrderStatus("<script>", ORDER_ID);

    expect(res).toEqual({ success: false, message: "Invalid status" });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("emails a receipt rendered on the server from the database", async () => {
    const res = await updateOrderStatus(Allstatus.shipped, ORDER_ID);

    expect(res.success).toBe(true);
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({ id: ORDER_ID, status: Allstatus.shipped }),
    );
    expect(mockSend).toHaveBeenCalledWith(
      "<wrapped><p>server</p></wrapped>",
      "buyer@example.com",
      expect.stringContaining(Allstatus.shipped),
    );
  });

  it("ignores any extra HTML argument from the client", async () => {
    await (
      updateOrderStatus as unknown as (...a: unknown[]) => Promise<unknown>
    )(Allstatus.shipped, ORDER_ID, "<h1>phish</h1>");

    expect(mockSend.mock.calls[0][0]).not.toContain("phish");
  });

  it("sends no email when abandoning an order", async () => {
    await updateOrderStatus(Allstatus.abandoned, ORDER_ID);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it("reports a missing order", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const res = await updateOrderStatus(Allstatus.shipped, ORDER_ID);

    expect(res).toEqual({ success: false, message: "Order not found" });
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("bulkUpdateOrderStatus", () => {
  it("refuses non-admins", async () => {
    (requireAdmin as jest.Mock).mockResolvedValue(null);

    const res = await bulkUpdateOrderStatus([ORDER_ID], Allstatus.shipped);

    expect(res.success).toBe(false);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects an invalid status", async () => {
    const res = await bulkUpdateOrderStatus([ORDER_ID], "Hacked");

    expect(res).toEqual({ success: false, message: "Invalid status" });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("escapes the customer's name in the email", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: ORDER_ID,
        user: { email: "b@example.com", firstname: "<img src=x>" },
      },
    ]);

    await bulkUpdateOrderStatus([ORDER_ID], Allstatus.shipped);

    const html = mockSend.mock.calls[0][0] as string;
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).not.toContain("<img src=x>");
  });
});
