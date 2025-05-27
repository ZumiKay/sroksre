"use client";
import { useState, useEffect, DependencyList, useRef } from "react";
import Error from "next/error";
import { ApiRequestHookProps, Usersessiontype } from "./GlobalType.type";
import { useSession } from "next-auth/react";

export const ApiRequest = async ({
  url,
  method = "DELETE",
  setloading,
  data,
  datatype = "JSON",
  revalidate,
  cache,
}: ApiRequestHookProps): Promise<{
  success: boolean;
  error?: string;
  data?: unknown;
  total?: number;
  totalpage?: number;
  lowstock?: number;
  valid?: boolean;
  totalfilter?: number;
  expirecount?: number;
  message?: string;
  isLimit?: boolean;
  isInCart?: boolean;
}> => {
  try {
    if (setloading) setloading((prev) => ({ ...prev, [method]: true }));
    const requestOptions: RequestInit = {
      method,
      next: { tags: [revalidate ?? ""] },
      cache,
    };
    if (data) {
      requestOptions.body =
        datatype === "JSON" ? JSON.stringify(data) : (data as never);
    }

    const response = await fetch(url, requestOptions);

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message ?? "Error Occured");
    }
    if (setloading) setloading((prev) => ({ ...prev, [method]: false }));

    if (method === "GET" || method === "POST" || method === "PUT") {
      return {
        success: true,
        data: responseJson.data,
        total: method === "GET" && responseJson?.total,
        lowstock: method === "GET" && responseJson?.lowstock,
        totalpage: method === "GET" && responseJson?.totalpage,
        totalfilter: method === "GET" && responseJson?.totalfilter,
        valid: responseJson.valid ?? undefined,
        isLimit: method === "GET" && responseJson?.isLimit,
        expirecount: method === "GET" && responseJson?.expirecount,
        isInCart: method === "GET" && responseJson?.isInCart,
      };
    } else {
      return { success: true, message: responseJson.message };
    }
  } catch (error) {
    if (setloading) setloading((prev) => ({ ...prev, [method]: false }));
    const err = error as Record<string, unknown>;

    return {
      success: false,
      error: (err.props ?? "Error Occured") as string,
      message: (err.message ?? "Error Occured") as string,
    };
  }
};

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps?: DependencyList
) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn(...(deps as []));
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, [deps, waitTime]);
}

export const useClickOutside = (callback: () => void) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return ref;
};

export const Delayloading = async (
  asyncFn: () => Promise<void>,
  setLoading: (loading: boolean) => void,
  delay: number = 3000
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  // Create a promise that sets loading to true after a delay
  const loadingTimeout = new Promise<void>((resolve) => {
    timeoutId = setTimeout(() => {
      setLoading(true);
      resolve();
    }, delay);
  });

  // Execute the async function and clear the timeout if it completes first
  const operationPromise = asyncFn().finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setLoading(false);
  });

  // Wait for either the loading timeout or the async function to complete
  await Promise.race([loadingTimeout, operationPromise]);
};

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isSmallTablet: false,
    isTablet: false,
    isDesktop: false,
    isSmallDesktop: false,
  });

  useEffect(() => {
    setScreenSize({
      isSmallTablet: window.innerWidth > 432 && window.innerWidth < 650,
      isMobile: window && window?.innerWidth <= 432,
      isTablet: window && window?.innerWidth >= 432 && window?.innerWidth < 768,
      isDesktop: window && window?.innerWidth >= 768,
      isSmallDesktop:
        window && window.innerWidth >= 768 && window.innerWidth < 850,
    });

    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth <= 432,
        isSmallTablet: window.innerWidth > 432 && window.innerWidth < 650,
        isTablet: window.innerWidth >= 432 && window.innerWidth < 768,
        isSmallDesktop:
          window && window.innerWidth >= 768 && window.innerWidth < 850,
        isDesktop: window.innerWidth >= 768,
      });
    };

    window.addEventListener("resize", handleResize);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screenSize;
};

export const useDetectKeyboardOpen = (
  minKeyboardHeight = 300,
  defaultValue = false
) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(defaultValue);

  useEffect(() => {
    const listener = () => {
      const newState =
        window.screen.height - minKeyboardHeight >
        (window?.visualViewport?.height ?? 0);
      if (isKeyboardOpen != newState) {
        setIsKeyboardOpen(newState);
      }
    };
    if (typeof visualViewport != "undefined") {
      window?.visualViewport?.addEventListener("resize", listener);
    }
    return () => {
      if (typeof visualViewport != "undefined") {
        window?.visualViewport?.removeEventListener("resize", listener);
      }
    };
  }, [isKeyboardOpen, minKeyboardHeight]);

  return isKeyboardOpen;
};

export const useCheckSession = () => {
  const { data: session, status } = useSession();
  const [user, setuser] = useState<Usersessiontype | null>(null);

  useEffect(() => {
    setuser((session?.user as Usersessiontype) ?? null);
  }, [session]);

  return { user, status };
};
