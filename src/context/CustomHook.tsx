"use client";

import { useState, useEffect, DependencyList, useRef } from "react";
import { errorToast } from "../app/component/Loading";
import { useSession } from "next-auth/react";
import { Usersessiontype } from "./GlobalType.type";

// Enhanced types
interface ApiRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: unknown;
  datatype?: "JSON" | "FORM_DATA" | "URL_ENCODED";
  headers?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  cache?: RequestCache;
  revalidate?: string;
  signal?: AbortSignal;
  onUploadProgress?: (progress: number) => void;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  // Pagination & metadata
  total?: number;
  totalPages?: number;
  totalFiltered?: number;
  currentPage?: number;
  // Specific response flags
  isLimit?: boolean;
  isInCart?: boolean;
  lowStock?: number;
  expireCount?: number;
  valid?: boolean;
}

// Loading state type
interface LoadingState {
  [key: string]: boolean;
}

export const ApiRequest = async <T = unknown,>({
  url,
  method = "GET",
  data,
  datatype = "JSON",
  headers = {},
  timeout = 10000,
  retryCount = 2,
  retryDelay = 1000,
  cache,
  revalidate,
  signal,
  showErrorToast = false,
  showSuccessToast = false,
}: ApiRequestOptions): Promise<ApiResponse<T>> => {
  // Input validation
  if (!url) {
    const error = "URL is required";
    if (showErrorToast) errorToast(error);
    return { success: false, error };
  }

  // Retry logic with exponential backoff
  const attemptRequest = async (attempt: number): Promise<ApiResponse<T>> => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Combine signals if provided
      const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal;

      // Prepare headers based on data type
      const defaultHeaders: Record<string, string> = {
        "Cache-Control": "no-cache",
      };

      if (datatype === "JSON" && method !== "GET") {
        defaultHeaders["Content-Type"] = "application/json";
        defaultHeaders["Accept"] = "application/json";
      } else if (datatype === "URL_ENCODED") {
        defaultHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      }
      // For FORM_DATA, don't set Content-Type (browser will set it with boundary)

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: { ...defaultHeaders, ...headers },
        signal: combinedSignal,
        ...(cache && { cache }),
      };

      // Add Next.js specific options
      if (revalidate) {
        requestOptions.next = { tags: [revalidate] };
      }

      // Prepare body based on data type and method
      if (data && method !== "GET") {
        switch (datatype) {
          case "JSON":
            requestOptions.body = JSON.stringify(data);
            break;
          case "FORM_DATA":
            if (data instanceof FormData) {
              requestOptions.body = data;
            } else {
              // Convert object to FormData
              const formData = new FormData();
              Object.entries(data as Record<string, unknown>).forEach(
                ([key, value]) => {
                  if (value instanceof File) {
                    formData.append(key, value);
                  } else if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                  }
                }
              );
              requestOptions.body = formData;
            }
            break;
          case "URL_ENCODED":
            if (typeof data === "object" && data !== null) {
              const params = new URLSearchParams();
              Object.entries(data as Record<string, unknown>).forEach(
                ([key, value]) => {
                  if (value !== null && value !== undefined) {
                    params.append(key, String(value));
                  }
                }
              );
              requestOptions.body = params.toString();
            }
            break;
        }
      }

      // Make the request
      const response = await fetch(url, requestOptions);

      // Clear timeout
      clearTimeout(timeoutId);

      // Handle response
      let responseData: unknown;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        responseData = await response.json();
      } else if (contentType?.includes("text/")) {
        responseData = await response.text();
      } else {
        responseData = await response.blob();
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorMessage =
          typeof responseData === "object" && responseData !== null
            ? (responseData as Record<string, unknown>).message ||
              (responseData as Record<string, unknown>).error ||
              `HTTP ${response.status}`
            : `HTTP ${response.status}: ${response.statusText}`;

        throw new Error(errorMessage as string);
      }

      // Parse successful response
      const result: ApiResponse<T> = {
        success: true,
        status: response.status,
      };

      if (typeof responseData === "object" && responseData !== null) {
        const parsed = responseData as Record<string, unknown>;

        // Standard response data
        result.data = parsed.data as T;
        result.message = parsed.message as string;

        // Pagination metadata
        if (method === "GET") {
          result.total = parsed.total as number;
          result.totalPages = parsed.totalpage as number;
          result.totalFiltered = parsed.totalfilter as number;
          result.currentPage = parsed.page as number;
          result.lowStock = parsed.lowstock as number;
          result.expireCount = parsed.expirecount as number;
          result.isLimit = parsed.isLimit as boolean;
          result.isInCart = parsed.isInCart as boolean;
        }

        // Validation flags
        result.valid = parsed.valid as boolean;
      } else {
        result.data = responseData as T;
      }

      // Show success toast if requested
      if (showSuccessToast && result.message) {
        errorToast(result.message);
      }

      return result;
    } catch (error) {
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          const timeoutError = "Request timeout";
          if (showErrorToast) errorToast(timeoutError);
          return {
            success: false,
            error: timeoutError,
            status: 408,
          };
        }

        // Retry logic for network errors
        if (attempt < retryCount && isRetryableError(error)) {
          console.warn(
            `Request failed (attempt ${
              attempt + 1
            }), retrying in ${retryDelay}ms...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
          return attemptRequest(attempt + 1);
        }

        const errorMessage = error.message || "Request failed";
        if (showErrorToast) errorToast(errorMessage);

        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
        };
      }

      // Unknown error type
      const unknownError = "An unexpected error occurred";
      if (showErrorToast) errorToast(unknownError);

      return {
        success: false,
        error: unknownError,
        message: unknownError,
      };
    }
  };

  return attemptRequest(0);
};

// Helper function to determine if error is retryable
const isRetryableError = (error: Error): boolean => {
  const retryableErrors = [
    "NetworkError",
    "TypeError", // Often network-related in fetch
    "ConnectionError",
  ];

  const retryableMessages = [
    "fetch",
    "network",
    "connection",
    "timeout",
    "ECONNRESET",
    "ENOTFOUND",
    "ECONNREFUSED",
  ];

  return (
    retryableErrors.includes(error.name) ||
    retryableMessages.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    )
  );
};

// Enhanced hook for API requests with loading states
export const useApiRequest = <T = unknown,>() => {
  const [loading, setLoading] = useState<LoadingState>({});
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = async (
    options: ApiRequestOptions
  ): Promise<ApiResponse<T>> => {
    const method = options.method || "GET";

    setLoading((prev) => ({ ...prev, [method]: true }));
    setError(null);

    try {
      const result = await ApiRequest<T>(options);

      if (result.success && result.data) {
        setData(result.data);
      } else if (!result.success) {
        setError(result.error || "Request failed");
      }

      return result;
    } finally {
      setLoading((prev) => ({ ...prev, [method]: false }));
    }
  };

  const isLoading = (method?: string) => {
    if (method) return loading[method] || false;
    return Object.values(loading).some(Boolean);
  };

  return {
    request,
    loading: isLoading,
    error,
    data,
    setData,
    clearError: () => setError(null),
  };
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
export const useClickOutside = (callback: () => void) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [callback]);

  return ref;
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
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 432,
        isSmallTablet: width > 432 && width < 650,
        isTablet: width >= 432 && width < 768,
        isSmallDesktop: width >= 768 && width < 850,
        isDesktop: width >= 768,
      });
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
};
export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps?: DependencyList
) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn();
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, [fn, waitTime, ...(deps || [])]);
}

export const useCheckSession = () => {
  const { data: session, status } = useSession();
  const [user, setuser] = useState<Usersessiontype | null>(null);

  useEffect(() => {
    setuser((session?.user as Usersessiontype) ?? null);
  }, [session]);

  return { user, status };
};

export const apiGet = <T = unknown,>(
  url: string,
  options?: Omit<ApiRequestOptions, "url" | "method">
) => ApiRequest<T>({ url, method: "GET", ...options });

export const apiPost = <T = unknown,>(
  url: string,
  data: unknown,
  options?: Omit<ApiRequestOptions, "url" | "method" | "data">
) => ApiRequest<T>({ url, method: "POST", data, ...options });

export const apiPut = <T = unknown,>(
  url: string,
  data: unknown,
  options?: Omit<ApiRequestOptions, "url" | "method" | "data">
) => ApiRequest<T>({ url, method: "PUT", data, ...options });

export const apiDelete = <T = unknown,>(
  url: string,
  options?: Omit<ApiRequestOptions, "url" | "method">
) => ApiRequest<T>({ url, method: "DELETE", ...options });
