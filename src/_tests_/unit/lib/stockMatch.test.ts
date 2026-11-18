/**
 * Stock matching shared by the product page, the cart limit and the checkout
 * hold. Scenario from the store: A [a, b], B [c, d], C [a, e]; b, c, d, e
 * belong to optional variants.
 */
jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: { $transaction: jest.fn() },
}));

import Prisma from "@/src/lib/prisma";
import {
  allocateStock,
  availableStockQuantity,
  matchStockEntries,
  parseStockAllocation,
  splitSelectedValues,
} from "@/src/lib/stockMatch";
import { calculateAvailableQuantity } from "@/src/app/api/products/stock/available/helper";
import {
  holdStock,
  releaseHeldStock,
  StockableItem,
} from "@/src/app/checkout/stock";
import { StockTypeEnum } from "@/src/types/product.type";

const A = { id: 1, qty: 2, variant_val: ["a", "b"] };
const B = { id: 2, qty: 4, variant_val: ["c", "d"] };
const C = { id: 3, qty: 3, variant_val: ["a", "e"] };
const entries = [A, B, C];

// Variant 10 holds a/c (required); 20 holds b/d, 30 holds e (optional)
const variants = [
  { id: 10, optional: false },
  { id: 20, optional: true },
  { id: 30, optional: true },
];

describe("stock matching", () => {
  it("selecting only 'a' pools every entry that has 'a' (A + C)", () => {
    expect(matchStockEntries(entries, ["a"])).toEqual([A, C]);
    expect(availableStockQuantity(entries, ["a"])).toBe(5);
  });

  it("product page check gives the same A + C", () => {
    expect(
      calculateAvailableQuantity(
        [{ qty: 0, Stockvalue: entries }],
        [{ variant_id: 10, value: "a" }],
      ),
    ).toBe(5);
  });

  it("uses an exact entry on its own", () => {
    expect(availableStockQuantity(entries, ["a", "b"])).toBe(2);
    expect(availableStockQuantity(entries, ["c"])).toBe(4);
  });

  it("returns 0 when nothing matches", () => {
    expect(availableStockQuantity(entries, ["a", "c"])).toBe(0);
    expect(availableStockQuantity(entries, [])).toBe(0);
  });

  it("ignores blank and 'null' values stored in entries", () => {
    expect(
      availableStockQuantity(
        [{ id: 9, qty: 7, variant_val: ["a", "", "null"] }, A],
        ["a"],
      ),
    ).toBe(7); // ["a"] is an exact match once blanks are dropped
  });

  it("optional selections don't decide stock", () => {
    const { required, optional } = splitSelectedValues(
      [
        { variant_id: 10, value: "a" },
        { variant_id: 30, value: "e" },
        { variant_id: 0, value: "" },
      ],
      variants,
    );
    expect(required).toEqual(["a"]);
    expect(optional).toEqual(["e"]);
  });
});

describe("allocateStock", () => {
  it("takes from A first, then C", () => {
    expect(allocateStock(entries, ["a"], 4)).toEqual([
      { id: 1, qty: 2 },
      { id: 3, qty: 2 },
    ]);
  });

  it("prefers the entry containing the customer's optional pick", () => {
    expect(allocateStock(entries, ["a"], 2, ["e"])).toEqual([
      { id: 3, qty: 2 },
    ]);
  });

  it("never touches entries without the selected value", () => {
    const plan = allocateStock(entries, ["a"], 5) ?? [];
    expect(plan.map((p) => p.id)).not.toContain(2);
  });

  it("returns null when matching entries are short", () => {
    expect(allocateStock(entries, ["a"], 6)).toBeNull();
  });

  it("parses saved allocations", () => {
    expect(parseStockAllocation(null)).toBeNull();
    expect(parseStockAllocation([{ id: 1, qty: 2 }, { id: "x" }])).toEqual([
      { id: 1, qty: 2 },
    ]);
  });
});

describe("checkout hold and release", () => {
  const tx = {
    stockvalue: { findMany: jest.fn(), updateMany: jest.fn() },
    orderproduct: { update: jest.fn() },
    products: { updateMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Prisma.$transaction as jest.Mock).mockImplementation(
      (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    );
    tx.stockvalue.findMany.mockResolvedValue(entries);
    tx.stockvalue.updateMany.mockResolvedValue({ count: 1 });
  });

  const item = (overrides: Partial<StockableItem> = {}): StockableItem => ({
    id: 77,
    quantity: 4,
    details: [{ variant_id: 10, value: "a" }],
    product: {
      id: 5,
      stocktype: StockTypeEnum.variants,
      Stock: [{ Stockvalue: entries.map(({ id }) => ({ id })) }],
      Variant: variants,
    },
    ...overrides,
  });

  it("holds only from matching entries and records the split", async () => {
    await holdStock([item()]);

    expect(tx.stockvalue.updateMany.mock.calls.map((c) => c[0])).toEqual([
      { where: { id: 1, qty: { gte: 2 } }, data: { qty: { decrement: 2 } } },
      { where: { id: 3, qty: { gte: 2 } }, data: { qty: { decrement: 2 } } },
    ]);
    expect(tx.orderproduct.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: {
        stockAllocation: [
          { id: 1, qty: 2 },
          { id: 3, qty: 2 },
        ],
      },
    });
  });

  it("releases exactly what was held, once", async () => {
    await releaseHeldStock([
      item({ stockAllocation: [{ id: 1, qty: 2 }, { id: 3, qty: 2 }] }),
    ]);

    expect(tx.stockvalue.updateMany.mock.calls.map((c) => c[0])).toEqual([
      { where: { id: 1 }, data: { qty: { increment: 2 } } },
      { where: { id: 3 }, data: { qty: { increment: 2 } } },
    ]);
    expect(tx.orderproduct.update).toHaveBeenCalledWith({
      where: { id: 77 },
      data: { stockAllocation: [] },
    });

    jest.clearAllMocks();
    await releaseHeldStock([item({ stockAllocation: [] })]);
    expect(tx.stockvalue.updateMany).not.toHaveBeenCalled();
  });

  it("restores old holds (no allocation saved) the old way", async () => {
    await releaseHeldStock([item({ stockAllocation: null })]);
    expect(tx.stockvalue.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2, 3] } },
      data: { qty: { increment: 4 } },
    });
  });
});
