import {
  SetStateAction,
  useState,
  useEffect,
  DependencyList,
  useRef,
} from "react";
import { LoadingState, useGlobalContext } from "./GlobalContext";
import Error from "next/error";
import { useRouter, useSearchParams } from "next/navigation";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE"; // Add other request methods as needed

export const useRequest = (
  url: string,
  method: RequestMethod = "GET",
  data: any = null,
  alldatastate?: string
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const { setalldata } = useGlobalContext();

  const makeRequest = async () => {
    try {
      setLoading(true);

      const requestOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (data) {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, requestOptions);

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Error Occured");
      }

      if ("data" in responseJson && alldatastate) {
        setResponseData(responseJson.data);
        setalldata((prev) => ({
          ...prev,
          [alldatastate as string]: responseJson.data,
        }));
      } else {
        setResponseData(responseJson);
      }
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setError(error.message || "Error Occured");
      setLoading(false);
    }
  };

  return { loading, error, responseData, makeRequest };
};

export const ApiRequest = async (
  url: string,
  setloading?: React.Dispatch<SetStateAction<LoadingState>>,
  method: RequestMethod = "DELETE",
  datatype: "JSON" | "FILE" = "JSON",
  data?: any,
  revalidate?: string
): Promise<{
  success: boolean;
  error?: string;
  data?: any;
  total?: number;
  totalpage?: number;
  lowstock?: number;
  valid?: boolean;
  totalfilter?: number;
  message?: string;
  isLimit?: boolean;
}> => {
  try {
    setloading && setloading((prev) => ({ ...prev, [method]: true }));
    const requestOptions: RequestInit = {
      method,
      next: { tags: [revalidate ?? ""] },
    };
    if (data) {
      requestOptions.body = datatype === "JSON" ? JSON.stringify(data) : data;
    }

    const response = await fetch(url, requestOptions);

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message ?? "Error Occured");
    }
    setloading && setloading((prev) => ({ ...prev, [method]: false }));

    if (method === "GET" || method === "POST") {
      return {
        success: true,
        data: responseJson.data,
        total: method === "GET" && responseJson?.total,
        lowstock: method === "GET" && responseJson?.lowstock,
        totalpage: method === "GET" && responseJson?.totalpage,
        totalfilter: method === "GET" && responseJson?.totalfilter,
        valid: responseJson.valid ?? undefined,
        isLimit: method === "GET" && responseJson?.isLimit,
      };
    } else {
      return { success: true, message: responseJson.message };
    }
  } catch (error: any) {
    setloading && setloading((prev) => ({ ...prev, [method]: false }));

    return {
      success: false,
      error: error.props ?? "Error Occured",
      message: error.message ?? "Error Occured",
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
      fn.apply(undefined, deps as any);
    }, waitTime);

    return () => {
      clearTimeout(t);
    };
  }, deps);
}

export function useSetSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getSearchParams = () => {
    const searchParam = new URLSearchParams(searchParams);
    return Object.fromEntries(searchParam);
  };
  const setSearchParams = (newParams: Record<string, string>) => {
    const searchParam = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        searchParam.delete(key);
      } else {
        searchParam.set(key, `${value}`);
      }
    });

    router.push(`?${searchParam}`);
  };
  const deleteSearchParams = (key: string) => {
    const searchParam = new URLSearchParams(searchParams);

    searchParam.delete(key);

    router.push(`?${searchParam}`);
  };

  return { getSearchParams, setSearchParams, deleteSearchParams };
}

export const useEffectOnce = (effect: () => void | (() => void)) => {
  const destroyFunc = useRef<void | (() => void)>();
  const effectCalled = useRef(false);
  const renderAfterCalled = useRef(false);
  const [val, setVal] = useState<number>(0);

  if (effectCalled.current) {
    renderAfterCalled.current = true;
  }

  useEffect(() => {
    // only execute the effect first time around
    if (!effectCalled.current) {
      destroyFunc.current = effect();
      effectCalled.current = true;
    }

    // this forces one render after the effect is run
    setVal((val) => val + 1);

    return () => {
      // if the comp didn't render since the useEffect was called,
      // we know it's the dummy React cycle
      if (!renderAfterCalled.current) {
        return;
      }
      if (destroyFunc.current) {
        destroyFunc.current();
      }
    };
  }, []);
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
