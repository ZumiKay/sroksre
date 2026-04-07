"use client";

import { useCallback, useEffect, useRef } from "react";
import { ApiRequest } from "../context/CustomHook";

interface UseDataRefreshProps {
  onRefresh: (data: any) => void;
  enabled: boolean;
  endpoint: string;
  interval?: number; // Optional polling interval in ms
}

/**
 * Hook for managing data refresh with deduplication
 * Prevents multiple simultaneous requests and provides polling option
 */
export function useDataRefresh({
  onRefresh,
  enabled,
  endpoint,
  interval,
}: UseDataRefreshProps) {
  const isRefreshingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const MIN_FETCH_INTERVAL = 1000; // Minimum 1 second between requests

  const refresh = useCallback(async () => {
    if (!enabled || isRefreshingRef.current) return;

    // Prevent too frequent requests
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      return;
    }

    isRefreshingRef.current = true;
    lastFetchRef.current = now;

    try {
      const request = await ApiRequest(endpoint, undefined, "GET");
      if (request.success) {
        onRefresh(request.data);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [enabled, endpoint, onRefresh]);

  // Optional polling
  useEffect(() => {
    if (!interval || !enabled) return;

    const intervalId = setInterval(refresh, interval);
    return () => clearInterval(intervalId);
  }, [interval, enabled, refresh]);

  return { refresh };
}
