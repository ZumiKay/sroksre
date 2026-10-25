import Prisma from "@/src/lib/prisma";
import { StockTypeEnum } from "@/src/types/product.type";
import {
  BatchPayload,
  PrismaPromise,
} from "@/prisma/generated/prisma/internal/prismaNamespace";
import { CHECKOUT_SESSION_LIMIT_MS } from "./constants";

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
  quantity: number;
  product: {
    id: number;
    stocktype: string;
    Stock: Array<{ Stockvalue: Array<{ id: number }> }>;
  };
};

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
