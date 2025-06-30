import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CancelOrder, RenewSessionId } from "../../checkout/cancelaction";
import { ContainerLoading, errorToast } from "../Loading";
import { useRouter, useSearchParams } from "next/navigation";
import { getDateFromSessionId } from "../../checkout/helper";

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
  const [timeLeft, setTimeLeft] = useState<number | undefined>(
    getDateFromSessionId(sid)?.getMilliseconds
  );
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setloading] = useState(false);
  const searchParam = useSearchParams();
  const router = useRouter();

  const setLoadingCallback = useCallback((val: boolean) => setloading(val), []);

  const handleRenew = useCallback(async () => {
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
  }, [oid, searchParam, router]);

  useEffect(() => {
    if (!timeLeft) {
      AsyncCancelOrder(oid, setLoadingCallback);
      return;
    }

    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const current = prev ?? 0;
        return current > 0 ? current - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [oid, timeLeft, setLoadingCallback]);

  const formattedTime = useMemo(() => {
    if (!timeLeft) return "00:00";
    const minutes = Math.floor(timeLeft / 60);
    const remainingSeconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, [timeLeft]);

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="text-red-600 text-xl font-bold mb-4">
          ⏰ Session Expired
        </div>
        <button
          type="button"
          onClick={handleRenew}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Renew Session
        </button>
      </div>
    );
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
