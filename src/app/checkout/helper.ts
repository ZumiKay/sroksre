import { StockType } from "../dashboard/inventory/inventory.type";
import { Productordertype } from "@/src/context/OrderContext";

export const CheckOrderProduct = ({
  orderProduct,
}: {
  orderProduct: Productordertype[];
}) => {
  const result: string[] = [];

  orderProduct.forEach((order, index) => {
    const qty = order.quantity;
    const isOutOfStock =
      (order.product?.stocktype === StockType.Stock &&
        order.product.stock &&
        order.product.stock < qty) ||
      (order.product?.stocktype === StockType.Variant &&
        order.stockvar &&
        order.stockvar.qty < qty);

    if (isOutOfStock) {
      result.push(`Cart Item ${index + 1})`);
    }
  });

  return result.length > 0
    ? result.join(",") + " " + "is out of stock"
    : result;
};
export const isTimePassedByMinutes = (
  isoString: string,
  minutes: number = 10
): boolean => {
  const targetTime = new Date(isoString);
  const currentTime = new Date();
  const diffInMs = currentTime.getTime() - targetTime.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);

  return diffInMinutes >= minutes;
};

export function getDateFromSessionId(sessionId: string): Date | null {
  try {
    // Extract timestamp from sessionId (remove 'ssc' prefix)
    const timestampStr = sessionId.replace(/^ssc/i, "").split("-")[0];
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      return null;
    }

    return new Date(timestamp);
  } catch (error) {
    console.error("Error extracting date from sessionId:", error);
    return null;
  }
}

export function getTimeRemainingForSession(sessionId: string): number {
  try {
    const sessionDate = getDateFromSessionId(sessionId);
    if (!sessionDate) {
      return 0;
    }
    const currentTime = new Date();
    const elapsedSeconds =
      (currentTime.getTime() - sessionDate.getTime()) / 1000;
    const totalSessionSeconds = 11 * 60; // 11 minutes in seconds
    const remainingSeconds = totalSessionSeconds - elapsedSeconds;

    return Math.max(0, Math.floor(remainingSeconds));
  } catch (error) {
    console.error("Error calculating remaining time for session:", error);
    return 0;
  }
}

export const generateSessionId = (date?: Date) =>
  `ssc${date ?? Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
