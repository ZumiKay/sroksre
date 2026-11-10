jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    promotion: { findFirst: jest.fn() },
  },
}));

import Prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  resetPromotionExpiryCheck,
  revertExpiredPromotions,
  syncExpiredPromotions,
} from "@/src/lib/promotion";

const mockPrisma = Prisma as unknown as {
  $transaction: jest.Mock;
  promotion: { findFirst: jest.Mock };
};

const makeTx = (expiredIds: number[], productCount = 0) => ({
  childcategories: {
    findMany: jest.fn().mockResolvedValue([{ pid: 7 }]),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  promotion: {
    findMany: jest.fn().mockResolvedValue(expiredIds.map((id) => ({ id }))),
  },
  products: {
    updateMany: jest.fn().mockResolvedValue({ count: productCount }),
  },
  banner: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
});

const useTx = (tx: ReturnType<typeof makeTx>) =>
  mockPrisma.$transaction.mockImplementation(
    (fn: (t: typeof tx) => unknown) => fn(tx),
  );

describe("revertExpiredPromotions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does nothing when no expired promotion is still attached", async () => {
    const tx = makeTx([]);
    useTx(tx);

    const count = await revertExpiredPromotions();

    expect(count).toBe(0);
    expect(tx.products.updateMany).not.toHaveBeenCalled();
    expect(tx.banner.updateMany).not.toHaveBeenCalled();
    expect(tx.childcategories.deleteMany).not.toHaveBeenCalled();
  });

  it("restores product prices and detaches banner and sale category", async () => {
    const tx = makeTx([3, 7], 5);
    useTx(tx);
    const now = new Date("2026-01-01T00:00:00Z");

    const count = await revertExpiredPromotions(now);

    expect(count).toBe(5);
    const promoWhere = tx.promotion.findMany.mock.calls[0][0].where;
    expect(promoWhere.expireAt).toEqual({ lte: now });
    expect(promoWhere.OR).toContainEqual({ id: { in: [7] } });

    expect(tx.products.updateMany).toHaveBeenCalledWith({
      where: { promotion_id: { in: [3, 7] } },
      data: { promotion_id: null, discount: null },
    });
    expect(tx.banner.updateMany).toHaveBeenCalledWith({
      where: { promotionId: { in: [3, 7] } },
      data: { promotionId: null },
    });
    expect(tx.childcategories.deleteMany).toHaveBeenCalledWith({
      where: { pid: { in: [3, 7] } },
    });
  });
});

describe("syncExpiredPromotions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPromotionExpiryCheck();
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => jest.useRealTimers());

  it("skips the database until the next check is due", async () => {
    useTx(makeTx([]));
    mockPrisma.promotion.findFirst.mockResolvedValue(null);

    await syncExpiredPromotions();
    await syncExpiredPromotions();
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(60_000);
    await syncExpiredPromotions();
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("checks again as soon as the next promotion expires", async () => {
    useTx(makeTx([]));
    mockPrisma.promotion.findFirst.mockResolvedValue({
      expireAt: new Date(Date.now() + 5_000),
    });

    await syncExpiredPromotions();
    jest.advanceTimersByTime(4_999);
    await syncExpiredPromotions();
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await syncExpiredPromotions();
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("checks right away after a reset", async () => {
    useTx(makeTx([]));
    mockPrisma.promotion.findFirst.mockResolvedValue(null);
    
    await syncExpiredPromotions();
    resetPromotionExpiryCheck();
    await syncExpiredPromotions();
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("refreshes the home page only when something was reverted", async () => {
    mockPrisma.promotion.findFirst.mockResolvedValue(null);

    useTx(makeTx([]));
    await syncExpiredPromotions();
    expect(revalidatePath).not.toHaveBeenCalled();

    resetPromotionExpiryCheck();
    useTx(makeTx([3], 2));
    await syncExpiredPromotions();
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("never throws and retries on the next call after a failure", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    mockPrisma.$transaction.mockRejectedValueOnce(new Error("db down"));

    await expect(syncExpiredPromotions()).resolves.toBeUndefined();

    useTx(makeTx([]));
    mockPrisma.promotion.findFirst.mockResolvedValue(null);
    await syncExpiredPromotions();
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });
});
