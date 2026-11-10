import Prisma from "@/src/lib/prisma";
import { revalidatePath } from "next/cache";

const MAX_CHECK_INTERVAL_MS = 60_000;

let nextCheckAt = 0;
let inFlight: Promise<void> | null = null;

/**
 * Ends every expired promotion that is still attached to something:
 * products go back to their normal price and are released from the
 * promotion, the banner is unlinked and the auto-created sale category is
 * removed. The promotion record itself is kept for the admin list.
 */
export async function revertExpiredPromotions(now = new Date()) {
  return Prisma.$transaction(async (tx) => {
    const saleCategoryPromoIds = (
      await tx.childcategories.findMany({
        where: { pid: { not: null } },
        select: { pid: true },
      })
    ).map((c) => c.pid as number);

    const expired = await tx.promotion.findMany({
      where: {
        expireAt: { lte: now },
        OR: [
          { Products: { some: {} } },
          { banner: { isNot: null } },
          { id: { in: saleCategoryPromoIds } },
        ],
      },
      select: { id: true },
    });

    if (expired.length === 0) return 0;

    const ids = expired.map((p) => p.id);

    const products = await tx.products.updateMany({
      where: { promotion_id: { in: ids } },
      data: { promotion_id: null, discount: null },
    });

    await tx.banner.updateMany({
      where: { promotionId: { in: ids } },
      data: { promotionId: null },
    });

    await tx.childcategories.deleteMany({
      where: { pid: { in: ids } },
    });

    return products.count;
  });
}

/**
 * Call before reading or charging product prices.
 */
export function syncExpiredPromotions(): Promise<void> {
  if (Date.now() < nextCheckAt) return Promise.resolve();

  inFlight ??= runCheck().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Forces the next syncExpiredPromotions() call to check the database. */
export function resetPromotionExpiryCheck() {
  nextCheckAt = 0;
}

async function runCheck() {
  try {
    const now = new Date();
    const reverted = await revertExpiredPromotions(now);

    const upcoming = await Prisma.promotion.findFirst({
      where: { expireAt: { gt: now } },
      orderBy: { expireAt: "asc" },
      select: { expireAt: true },
    });

    nextCheckAt = Math.min(
      upcoming?.expireAt.getTime() ?? Infinity,
      now.getTime() + MAX_CHECK_INTERVAL_MS,
    );

    if (reverted > 0) {
      // The home page is statically cached; refresh it so it stops showing
      // the old discount. This throws when called during a page render, in
      // which case that render already has the fresh prices.
      try {
        revalidatePath("/");
      } catch {}
    }
  } catch (error) {
    console.log("Failed to revert expired promotions:", error);
  }
}
