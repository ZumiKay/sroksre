"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { renewCheckoutSession } from "@/src/app/checkout/action";
import { CHECKOUT_SESSION_LIMIT_MS } from "@/src/app/checkout/constants";

const getRemainingMs = (base: string, now = Date.now()) => {
  const baseTime = new Date(base).getTime();
  const expiresAt = baseTime + CHECKOUT_SESSION_LIMIT_MS;
  return Math.max(expiresAt - now, 0);
};

const formatRemainingTime = (remainingMs: number) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const CheckoutSessionTimer = ({
  createdAt,
  renewedAt,
  orderId,
}: {
  createdAt: string;
  renewedAt?: string | null;
  orderId: string;
}) => {
  const router = useRouter();
  // Use the latest renewal timestamp as the timer base, falling back to createdAt
  const [timerBase, setTimerBase] = useState(() => renewedAt ?? createdAt);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    setRemainingMs(getRemainingMs(timerBase));

    const intervalId = setInterval(() => {
      const next = getRemainingMs(timerBase);
      setRemainingMs(next);

      if (next <= 0) {
        clearInterval(intervalId);
        router.refresh();
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerBase, router]);

  const timerLabel = useMemo(
    () => (remainingMs !== null ? formatRemainingTime(remainingMs) : "--:--"),
    [remainingMs],
  );

  const isExpiringSoon =
    remainingMs !== null && remainingMs > 0 && remainingMs <= 10 * 60 * 1000;

  const handleRenew = async () => {
    setIsRenewing(true);
    const result = await renewCheckoutSession(orderId);
    if (result.success && result.renewedAt) {
      setTimerBase(result.renewedAt);
    }
    setIsRenewing(false);
  };

  return (
    <div
      className={`w-full rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
        isExpiringSoon
          ? "bg-red-50 border-red-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <p className="text-sm font-medium text-gray-700">
        Checkout session{" "}
        {remainingMs === null || remainingMs > 0 ? "expires in" : "expired"}
      </p>
      <div className="flex items-center gap-3">
        <div
          className={`text-lg font-bold tracking-wide ${
            isExpiringSoon ? "text-red-600" : "text-amber-700"
          }`}
        >
          {remainingMs === null || remainingMs > 0 ? timerLabel : "00:00"}
        </div>
        {(remainingMs === null || remainingMs > 0) && (
          <button
            onClick={handleRenew}
            disabled={isRenewing}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 disabled:opacity-50 transition-colors"
          >
            {isRenewing ? "Renewing…" : "Renew"}
          </button>
        )}
      </div>
    </div>
  );
};
