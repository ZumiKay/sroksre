import Prisma from "@/src/lib/prisma";
import { StockTypeEnum } from "@/src/types/product.type";
import {
  BatchPayload,
  PrismaPromise,
} from "@/prisma/generated/prisma/internal/prismaNamespace";
import type { InputJsonValue } from "@/prisma/generated/prisma/internal/prismaNamespace";
import { CHECKOUT_SESSION_LIMIT_MS } from "./constants";
import {
  allocateStock,
  parseStockAllocation,
  splitSelectedValues,
  type StockAllocation,
  type StockEntry,
} from "@/src/lib/stockMatch";

const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export const isValidOrderId = (id?: string) => !!id && ORDER_ID_PATTERN.test(id);

export const isCheckoutSessionExpired = (
  createdAt: Date,
  renewedAt?: Date | null,
  now = Date.now(),
) => {
  const base = renewedAt ?? createdAt;
  return now - base.getTime() >= CHECKOUT_SESSION_LIMIT_MS;
};

// ─── Stock hold / release helpers ────────────────────────────────────────────

export type StockableItem = {
  /** Orderproduct id; needed to record which stock entries were held */
  id?: number;
  quantity: number;
  details?: unknown;
  stockAllocation?: unknown;
  product: {
    id: number;
    stocktype: string;
    Stock: Array<{ Stockvalue: Array<{ id: number }> }>;
    Variant?: Array<{ id: number; optional?: boolean | null }>;
  };
};

/**
 * Old-style adjustments: normal stock, and the release of variant holds made
 * before allocations were recorded (those decremented every combination of
 * the product, so they are restored the same way).
 */
export function buildStockAdjustments(
  items: StockableItem[],
  direction: "decrement" | "increment",
): PrismaPromise<BatchPayload>[] {
  const ops: PrismaPromise<BatchPayload>[] = [];

  for (const item of items) {
    const { id, stocktype, Stock } = item.product;
    const qty = item.quantity;

    if (stocktype === StockTypeEnum.normal) {
      if (direction === "decrement") {
        ops.push(
          Prisma.products.updateMany({
            where: { AND: [{ id }, { stock: { gte: qty } }] },
            data: { stock: { decrement: qty } },
          }),
        );
      } else {
        ops.push(
          Prisma.products.updateMany({
            where: { id },
            data: { stock: { increment: qty } },
          }),
        );
      }
    } else if (Stock && Stock.length > 0) {
      const svIds = Stock.flatMap((sk) => sk.Stockvalue.map((sv) => sv.id));
      if (svIds.length > 0) {
        if (direction === "decrement") {
          ops.push(
            Prisma.stockvalue.updateMany({
              where: { AND: [{ id: { in: svIds } }, { qty: { gte: qty } }] },
              data: { qty: { decrement: qty } },
            }),
          );
        } else {
          ops.push(
            Prisma.stockvalue.updateMany({
              where: { id: { in: svIds } },
              data: { qty: { increment: qty } },
            }),
          );
        }
      }
    }
  }

  return ops;
}

/**
 * Holds stock for cart items entering checkout. Variant products take the
 * quantity only from the stock entries matching the customer's selection
 * (same rule as the product page) and record what was taken on the line.
 */
export async function holdStock(items: StockableItem[]) {
  if (items.length === 0) return;

  await Prisma.$transaction(async (tx) => {
    for (const item of items) {
      const { id: productId, stocktype, Variant } = item.product;

      if (stocktype === StockTypeEnum.normal) {
        await tx.products.updateMany({
          where: { AND: [{ id: productId }, { stock: { gte: item.quantity } }] },
          data: { stock: { decrement: item.quantity } },
        });
        continue;
      }
      if (!item.id) continue;

      // Read current quantities inside the transaction
      const entries = await tx.stockvalue.findMany({
        where: { stock: { product_id: productId } },
        select: { id: true, qty: true, variant_val: true },
        orderBy: { id: "asc" },
      });
      if (entries.length === 0) continue;

      const { required, optional } = splitSelectedValues(
        item.details,
        Variant ?? [],
      );
      const plan =
        allocateStock(
          entries as Array<StockEntry & { id: number }>,
          required.length > 0 ? required : optional,
          item.quantity,
          optional,
        ) ?? [];
      if (plan.length === 0) {
        console.warn(
          "[Stock] not enough matching stock to hold",
          { orderproductId: item.id, productId, quantity: item.quantity },
        );
      }

      const held: StockAllocation[] = [];
      for (const part of plan) {
        const res = await tx.stockvalue.updateMany({
          where: { id: part.id, qty: { gte: part.qty } },
          data: { qty: { decrement: part.qty } },
        });
        if (res.count > 0) held.push(part);
      }

      await tx.orderproduct.update({
        where: { id: item.id },
        data: { stockAllocation: held as unknown as InputJsonValue },
      });
    }
  });
}

/**
 * Gives back stock held by `holdStock`. Released lines are marked with an
 * empty allocation so a repeated release can't add stock twice.
 */
export async function releaseHeldStock(items: StockableItem[]) {
  if (items.length === 0) return;

  await Prisma.$transaction(async (tx) => {
    for (const item of items) {
      const { id: productId, stocktype, Stock } = item.product;

      if (stocktype === StockTypeEnum.normal) {
        await tx.products.updateMany({
          where: { id: productId },
          data: { stock: { increment: item.quantity } },
        });
        continue;
      }

      const allocation = parseStockAllocation(item.stockAllocation);
      if (!allocation) {
        // Held before allocations were recorded: that hold took the quantity
        // from every combination, so restore every combination
        const svIds = Stock.flatMap((sk) => sk.Stockvalue.map((sv) => sv.id));
        if (svIds.length > 0) {
          await tx.stockvalue.updateMany({
            where: { id: { in: svIds } },
            data: { qty: { increment: item.quantity } },
          });
        }
        continue;
      }

      for (const part of allocation) {
        await tx.stockvalue.updateMany({
          where: { id: part.id },
          data: { qty: { increment: part.qty } },
        });
      }
      if (item.id) {
        await tx.orderproduct.update({
          where: { id: item.id },
          data: { stockAllocation: [] },
        });
      }
    }
  });
}
