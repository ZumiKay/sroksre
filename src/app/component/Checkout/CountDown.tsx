"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { CancelOrder, RenewSessionId } from "../../checkout/cancelaction";
import { ContainerLoading, errorToast } from "../Loading";
import { useRouter, useSearchParams } from "next/navigation";
import { getTimeRemainingForSession } from "../../checkout/helper";

const AsyncCancelOrder = async (
  oid: string,
  setloading: (val: boolean) => void
) => {
  const cancel = CancelOrder.bind(null, oid);
  setloading(true);
  try {
    const cancelReq = await cancel();
    if (!cancelReq.success) {
      errorToast("Error Occured");
      return;
    }
    errorToast("Order is cancelled");
  } finally {
    setloading(false);
  }
};

const CountDown = React.memo(({ oid, sid }: { oid: string; sid: string }) => {
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setloading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const searchParam = useSearchParams();
  const router = useRouter();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleRenew = useCallback(async () => {
    if (loading) return; // Prevent multiple calls

    const renew = RenewSessionId.bind(null, oid);
    setloading(true);
    try {
      const renewReq = await renew();

      if (!renewReq.success || !renewReq.data) {
        errorToast("Error Occured");
        return;
      }

      const newParam = new URLSearchParams(searchParam);
      newParam.set("sid", renewReq.data.sessionId);
      router.push(`?${newParam}`);
      router.refresh();
      setTimeLeft(600);
      setIsExpired(false);
    } finally {
      setloading(false);
    }
  }, [oid, searchParam, router, loading]);

  // Initialize time remaining
  useEffect(() => {
    const timeremain = getTimeRemainingForSession(sid);

    if (timeremain === 0) {
      AsyncCancelOrder(oid, setloading);
      setIsExpired(true);
      return;
    }

    if (!timeremain) {
      return;
    }

    setTimeLeft(timeremain);
    setIsExpired(false);
  }, [oid, sid]);

  // Handle countdown timer
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (timeLeft === undefined || timeLeft <= 0) {
      if (timeLeft === 0) {
        setIsExpired(true);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === undefined || prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft]);

  const formattedTime = useMemo(() => {
    if (timeLeft === undefined || timeLeft <= 0) return "00:00";
    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, [timeLeft]);

  // Memoize the expired component to prevent re-renders
  const expiredComponent = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="text-red-600 text-xl font-bold mb-4">
          ⏰ Session Expired
        </div>
        <button
          type="button"
          onClick={handleRenew}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Renewing..." : "Renew Session"}
        </button>
      </div>
    ),
    [handleRenew, loading]
  );

  if (isExpired) {
    return expiredComponent;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
      {loading && <ContainerLoading />}
      <div className="text-gray-700 text-sm font-medium mb-2">
        Complete your order within
      </div>
      <div className="text-3xl font-bold text-yellow-700 font-mono">
        {formattedTime}
      </div>
      <div className="text-gray-600 text-xs mt-1">minutes remaining</div>
    </div>
  );
});

CountDown.displayName = "CountDown";

export default CountDown;
