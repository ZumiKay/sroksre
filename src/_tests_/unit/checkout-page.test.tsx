/**
 * @jest-environment node
 *
 * Unit tests for /src/app/checkout/page.tsx
 *
 * Strategy:
 * - Uses `@jest-environment node` so that React 19 async Server Components can
 *   render correctly via `renderToReadableStream` from react-dom/server.
 * - All Prisma database calls are intercepted via wrapper functions so we
 *   control them with standard jest.fn() without fighting the manual mock reset.
 * - Heavy render-tree dependencies are replaced with lightweight stubs.
 * - Covers: calculatePrice, redirect guards, per-step rendering, SuccessPage,
 *   Totalprice display, and variant breakdowns in pricing.
 *
 * renderAsync helper:
 *   Converts an RSC JSX node → static HTML string via renderToReadableStream,
 *   then parses it with JSDOM and returns a @testing-library/dom BoundFunctions
 *   so tests can use the familiar `getByTestId`, `getByText`, etc. API.
 */

//Mock next/navigation
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const mockNotFound = jest.fn(() => {
  throw new Error("NOT_FOUND");
});

jest.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...(props as any)} alt={props.alt} />
  ),
}));

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockPrismaFindUnique = jest.fn();

jest.mock("@/prisma/generated/prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    orders: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      findFirst: jest.fn(),
    },
  })),
}));

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn(() => ({})),
}));

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    orders: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      findFirst: jest.fn(),
    },
  },
}));

// Mock checkout action / fetchaction
const mockCheckOrder = jest.fn();
const mockGetCheckoutdata = jest.fn();

jest.mock("@/src/app/checkout/action", () => ({
  checkOrder: (...args: unknown[]) => mockCheckOrder(...args),
  updateShippingService: jest.fn(),
}));

jest.mock("@/src/app/checkout/fetchaction", () => ({
  getCheckoutdata: (...args: unknown[]) => mockGetCheckoutdata(...args),
}));

// Mock utilities
jest.mock("@/src/lib/utilities", () => ({
  ...jest.requireActual("@/src/lib/utilities"),
  decrypt: jest.fn((val: string) => `decrypted-${val}`),
}));

// Mock policy route
const mockGetPolicesByPage = jest.fn();

jest.mock("@/src/app/api/policy/route", () => ({
  getPolicesByPage: (...args: unknown[]) => mockGetPolicesByPage(...args),
}));

// Mock Checkout UI components
jest.mock("@/src/app/component/Checkout", () => ({
  StepIndicator: ({ step }: { step: number }) => (
    <div data-testid="step-indicator" data-step={step} />
  ),
  FormWrapper: ({
    children,
    step,
  }: {
    children: React.ReactNode;
    step: number;
  }) => (
    <form data-testid="form-wrapper" data-step={step}>
      {children}
    </form>
  ),
  BackAndEdit: ({ step }: { step: number }) => (
    <div data-testid="back-and-edit" data-step={step} />
  ),
  Proceedbutton: ({ step }: { step: number }) => (
    <button data-testid="proceed-button" data-step={step} />
  ),
  ShippingForm: ({ orderid }: { orderid: string }) => (
    <div data-testid="shipping-form" data-orderid={orderid} />
  ),
  Checkoutproductcard: (props: { name: string }) => (
    <div data-testid="product-card" data-name={props.name} />
  ),
  Shippingservicecard: (props: { value: string }) => (
    <div data-testid="shipping-service-card" data-type={props.value} />
  ),
  Paypalbutton: ({ orderId }: { orderId: string }) => (
    <div data-testid="paypal-button" data-orderid={orderId} />
  ),
  Navigatebutton: ({ title, to }: { title: string; to: string }) => (
    <a data-testid="navigate-button" href={to}>
      {title}
    </a>
  ),
}));

// Mock Asset
jest.mock("@/src/app/component/Asset", () => ({
  SuccessVector: () => <svg data-testid="success-vector" />,
}));

import React from "react";
import { renderToReadableStream } from "react-dom/server";
import { JSDOM } from "jsdom";
import { getQueriesForElement } from "@testing-library/dom";
import Checkoutpage, { calculatePrice } from "@/src/app/checkout/page";
import { Allstatus, ShippingTypeEnum } from "@/src/types/order.type";

// ─── renderAsync helper ───────────────────────────────────────────────────────
// Renders a React 19 async Server Component tree to a static HTML string using
// renderToReadableStream (which properly awaits async components), then exposes
// @testing-library/dom queries on the resulting document fragment.
async function renderAsync(ui: React.ReactNode) {
  const stream = await renderToReadableStream(ui);
  // Wait for all async work (Suspense boundaries) to finish.
  await stream.allReady;

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const html = Buffer.concat(chunks).toString("utf-8");
  const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
  const body = dom.window.document.body;

  return {
    ...getQueriesForElement(body),
    container: body,
    html,
  };
}

const ENCRYPTED_ID = "encrypted-abc123";
const DECRYPTED_ID = `decrypted-${ENCRYPTED_ID}`;

const makeParams = (overrides: Record<string, string> = {}) =>
  Promise.resolve({ step: "1", orderid: ENCRYPTED_ID, ...overrides });

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  id: DECRYPTED_ID,
  status: Allstatus.unpaid,
  ...overrides,
});

const makeCheckoutData = (overrides: Record<string, unknown> = {}) => ({
  id: DECRYPTED_ID,
  status: Allstatus.unpaid,
  shipping_id: 1,
  shippingtype: ShippingTypeEnum.standard,
  price: { subtotal: 100, vat: 10, shipping: 10, total: 120 },
  Orderproduct: [
    {
      id: 1,
      quantity: 2,
      selectedvariant: null,
      price: { price: 50, discount: null },
      product: {
        id: 1,
        name: "Test Product",
        covers: [{ url: "/img/test.jpg" }],
        stocktype: "Normal",
        Stock: [],
      },
    },
  ],
  ...overrides,
});

const DEFAULT_DB_PRICE = { price: { subtotal: 100, shipping: 10, total: 120 } };

describe("calculatePrice", () => {
  it("applies the discount percentage correctly", async () => {
    await expect(calculatePrice(100, 20)).resolves.toBe(80);
  });

  it("returns the original price when percent is 0", async () => {
    await expect(calculatePrice(200, 0)).resolves.toBe(200);
  });

  it("returns 0 when base price is 0", async () => {
    await expect(calculatePrice(0, 50)).resolves.toBe(0);
  });

  it("handles fractional percentages", async () => {
    await expect(calculatePrice(100, 10.5)).resolves.toBeCloseTo(89.5);
  });

  it("returns 0 when discount is 100%", async () => {
    await expect(calculatePrice(150, 100)).resolves.toBe(0);
  });
});

describe("Checkoutpage – redirect guards", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to / when step param is absent", async () => {
    await expect(
      Checkoutpage({ searchParams: makeParams({ step: "" }) }),
    ).rejects.toThrow("REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to / when orderid param is absent", async () => {
    await expect(
      Checkoutpage({ searchParams: makeParams({ orderid: "" }) }),
    ).rejects.toThrow("REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("redirects to / when checkOrder returns null (unknown order)", async () => {
    mockCheckOrder.mockResolvedValue(null);

    await expect(Checkoutpage({ searchParams: makeParams() })).rejects.toThrow(
      "REDIRECT:/",
    );
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});

// ─── Step 1: Order Summary ────────────────────────────────────────────────────

describe("Checkoutpage – step 1 (Order Summary)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockGetCheckoutdata.mockResolvedValue(makeCheckoutData());
    mockPrismaFindUnique.mockReset();
    mockPrismaFindUnique.mockResolvedValue(DEFAULT_DB_PRICE);
  });

  it("renders StepIndicator with step=1", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("step-indicator").getAttribute("data-step")).toBe("1");
  });

  it("renders FormWrapper", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("form-wrapper")).toBeTruthy();
  });

  it("renders BackAndEdit and Proceedbutton", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("back-and-edit")).toBeTruthy();
    expect(getByTestId("proceed-button")).toBeTruthy();
  });

  it("renders a product card for each item in the order", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getAllByTestId } = await renderAsync(jsx);
    const cards = getAllByTestId("product-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-name")).toBe("Test Product");
  });

  it("renders price totals section labels", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByText } = await renderAsync(jsx);
    expect(getByText("Subtotal")).toBeTruthy();
    expect(getByText("Shipping Fee")).toBeTruthy();
    expect(getByText("Total")).toBeTruthy();
  });

  it("redirects to / when order data is not found", async () => {
    // OrderSummary is an async child component — the redirect is thrown when
    // the sub-component renders, not when the top-level page resolves.
    mockGetCheckoutdata.mockResolvedValue(null);

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    await expect(renderAsync(jsx)).rejects.toThrow("REDIRECT:/");
  });
});

// ─── Step 2: Shipping Form ────────────────────────────────────────────────────

describe("Checkoutpage – step 2 (Shipping Form)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockGetCheckoutdata.mockResolvedValue(makeCheckoutData());
    mockPrismaFindUnique.mockReset();
    mockPrismaFindUnique.mockResolvedValue(DEFAULT_DB_PRICE);
  });

  it("renders ShippingForm with the correct order id", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "2" }) });
    const { getByTestId } = await renderAsync(jsx);
    const form = getByTestId("shipping-form");
    expect(form).toBeTruthy();
    expect(form.getAttribute("data-orderid")).toBe(DECRYPTED_ID);
  });

  it("does not render ShippingServiceCard at step 2", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "2" }) });
    const { queryByTestId } = await renderAsync(jsx);
    expect(queryByTestId("shipping-service-card")).toBeNull();
  });

  it("renders StepIndicator with step=2", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "2" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("step-indicator").getAttribute("data-step")).toBe("2");
  });
});

// ─── Step 3: Payment Detail ───────────────────────────────────────────────────

describe("Checkoutpage – step 3 (Payment Detail)", () => {
  const UNPAID_SHIPPING = {
    shippingtype: ShippingTypeEnum.standard,
    status: Allstatus.unpaid,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaFindUnique.mockReset(); // clear any queued Once values from previous describes
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockGetCheckoutdata.mockResolvedValue(makeCheckoutData());
    // First DB call → getShippingtype; second → getOrderTotal in Totalprice
    mockPrismaFindUnique
      .mockResolvedValueOnce(UNPAID_SHIPPING)
      .mockResolvedValueOnce(DEFAULT_DB_PRICE);
  });

  it("renders PayPal button with the correct order id", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "3" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("paypal-button").getAttribute("data-orderid")).toBe(
      DECRYPTED_ID,
    );
  });

  it("renders at least one shipping service card", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "3" }) });
    const { getAllByTestId } = await renderAsync(jsx);
    expect(getAllByTestId("shipping-service-card").length).toBeGreaterThan(0);
  });

  it("renders the correct step number in StepIndicator", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "3" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("step-indicator").getAttribute("data-step")).toBe("3");
  });

  it("calls notFound when the order is already paid", async () => {
    jest.clearAllMocks();
    mockPrismaFindUnique.mockReset();
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockGetCheckoutdata.mockResolvedValue(makeCheckoutData());
    mockPrismaFindUnique
      .mockResolvedValueOnce({ ...UNPAID_SHIPPING, status: Allstatus.paid })
      .mockResolvedValueOnce(DEFAULT_DB_PRICE);

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "3" }) });
    // notFound is thrown during async rendering of PaymentDetail sub-component
    await expect(renderAsync(jsx)).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("only shows the Pickup service when the order has no shipping address", async () => {
    jest.clearAllMocks();
    mockPrismaFindUnique.mockReset();
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockGetCheckoutdata.mockResolvedValue(
      makeCheckoutData({ shipping_id: null }),
    );
    mockPrismaFindUnique
      .mockResolvedValueOnce(UNPAID_SHIPPING)
      .mockResolvedValueOnce(DEFAULT_DB_PRICE);

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "3" }) });
    const { getAllByTestId } = await renderAsync(jsx);

    const cards = getAllByTestId("shipping-service-card");
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("data-type")).toBe("Pickup");
  });
});

// ─── Step 4 / SuccessPage ─────────────────────────────────────────────────────

describe("Checkoutpage – step 4 / SuccessPage", () => {
  const policies = [
    { id: 1, title: "Return Policy" },
    { id: 2, title: "Privacy Policy" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaFindUnique.mockReset();
    mockCheckOrder.mockResolvedValue(makeOrder({ status: Allstatus.paid }));
    mockGetPolicesByPage.mockResolvedValue(policies);
    mockPrismaFindUnique.mockResolvedValue(DEFAULT_DB_PRICE);
  });

  it("shows the success page when step=4", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "4" }) });
    const { getByText } = await renderAsync(jsx);
    expect(getByText(/Thank you for your purchase/i)).toBeTruthy();
  });

  it("shows the success page when order is already paid (regardless of step)", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByText } = await renderAsync(jsx);
    expect(getByText(/Thank you for your purchase/i)).toBeTruthy();
  });

  it("does NOT render StepIndicator in the success state", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "4" }) });
    const { queryByTestId } = await renderAsync(jsx);
    expect(queryByTestId("step-indicator")).toBeNull();
  });

  it("displays the decrypted order id on the success page", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "4" }) });
    const { getByText } = await renderAsync(jsx);
    expect(getByText(new RegExp(`Order #${DECRYPTED_ID}`, "i"))).toBeTruthy();
  });

  it("renders a policy link for every policy returned", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "4" }) });
    const { getByText } = await renderAsync(jsx);
    expect(getByText("Return Policy")).toBeTruthy();
    expect(getByText("Privacy Policy")).toBeTruthy();
  });

  it("renders the 'View Order Details' button with the order id in its href", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "4" }) });
    const { getByTestId } = await renderAsync(jsx);
    const btn = getByTestId("navigate-button");
    expect(btn.textContent).toContain("View Order Details");
    expect(btn.getAttribute("href")).toContain(DECRYPTED_ID);
  });

  it("renders the success icon", async () => {
    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "4" }) });
    const { getByTestId } = await renderAsync(jsx);
    expect(getByTestId("success-vector")).toBeTruthy();
  });
});

describe("Checkoutpage – Totalprice price values", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaFindUnique.mockReset();
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockGetCheckoutdata.mockResolvedValue(makeCheckoutData());
  });

  it("displays subtotal, shipping and grand total from the order", async () => {
    mockPrismaFindUnique.mockResolvedValue({
      price: { subtotal: 80, shipping: 15, total: 95 },
    });

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByText } = await renderAsync(jsx);

    expect(getByText("$80.00")).toBeTruthy();
    expect(getByText("$15.00")).toBeTruthy();
    expect(getByText("$95.00")).toBeTruthy();
  });

  it("shows $0.00 for all price fields when DB returns no price data", async () => {
    mockPrismaFindUnique.mockResolvedValue(null);

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getAllByText } = await renderAsync(jsx);

    const zeroPrices = getAllByText("$0.00");
    expect(zeroPrices.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Checkoutpage – Totalprice variant breakdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaFindUnique.mockReset();
    mockCheckOrder.mockResolvedValue(makeOrder());
    mockPrismaFindUnique.mockResolvedValue({
      price: { subtotal: 200, shipping: 10, total: 215 },
    });
  });

  it("renders the variant options section when products have priced variants", async () => {
    mockGetCheckoutdata.mockResolvedValue(
      makeCheckoutData({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            selectedvariant: {
              variant: [{ name: "Size L", val: "L", price: "5.00" }],
            },
            price: { price: 100, discount: null },
            product: {
              id: 1,
              name: "T-Shirt",
              covers: [{ url: "/img/t.jpg" }],
              stocktype: "Normal",
              Stock: [],
            },
          },
        ],
      }),
    );

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByText, getAllByText } = await renderAsync(jsx);

    expect(getByText("Variant Options")).toBeTruthy();
    expect(getByText(/Size L/)).toBeTruthy();
    expect(getAllByText("$5.00").length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT render the variant section when no variants have a price", async () => {
    mockGetCheckoutdata.mockResolvedValue(
      makeCheckoutData({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            selectedvariant: null,
            price: { price: 50, discount: null },
            product: {
              id: 1,
              name: "Plain Item",
              covers: [{ url: "/img/p.jpg" }],
              stocktype: "Normal",
              Stock: [],
            },
          },
        ],
      }),
    );

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { queryByText } = await renderAsync(jsx);

    expect(queryByText("Variant Options")).toBeNull();
  });

  it("aggregates variant prices from variantsection structure", async () => {
    mockGetCheckoutdata.mockResolvedValue(
      makeCheckoutData({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            selectedvariant: {
              variantsection: [
                {
                  variantSection: { id: 1, name: "Color" },
                  variants: [{ name: "Red", val: "red", price: "3.00" }],
                },
              ],
            },
            price: { price: 100, discount: null },
            product: {
              id: 1,
              name: "Hoodie",
              covers: [{ url: "/img/h.jpg" }],
              stocktype: "Normal",
              Stock: [],
            },
          },
        ],
      }),
    );

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByText, getAllByText } = await renderAsync(jsx);

    expect(getByText("Variant Options")).toBeTruthy();
    expect(getByText(/Red/)).toBeTruthy();
    expect(getAllByText("$3.00").length).toBeGreaterThanOrEqual(1);
  });

  it("shows per-product breakdown with the product name", async () => {
    mockGetCheckoutdata.mockResolvedValue(
      makeCheckoutData({
        Orderproduct: [
          {
            id: 1,
            quantity: 1,
            selectedvariant: {
              variant: [
                { name: "Material: Cotton", val: "cotton", price: "2.50" },
              ],
            },
            price: { price: 80, discount: null },
            product: {
              id: 1,
              name: "Premium Shirt",
              covers: [{ url: "/img/s.jpg" }],
              stocktype: "Normal",
              Stock: [],
            },
          },
        ],
      }),
    );

    const jsx = await Checkoutpage({ searchParams: makeParams({ step: "1" }) });
    const { getByText, getAllByText } = await renderAsync(jsx);

    expect(getByText("Premium Shirt")).toBeTruthy();
    expect(getByText(/Material: Cotton/)).toBeTruthy();
    expect(getAllByText("$2.50").length).toBeGreaterThanOrEqual(1);
  });
});
