import { SetStateAction, useState, useEffect, DependencyList } from "react";
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
        total: method === "GET" && responseJson.total,
        lowstock: method === "GET" && responseJson.lowstock,
        totalpage: method === "GET" && responseJson.totalpage,
        totalfilter: method === "GET" && responseJson.totalfilter,
        valid: responseJson.valid ?? undefined,
      };
    } else {
      return { success: true };
    }
  } catch (error: any) {
    setloading && setloading((prev) => ({ ...prev, [method]: false }));

    return { success: false, error: error.props ?? "Error Occured" };
  }
};

export function useDebounceEffect(
  fn: () => void,
  waitTime: number,
  deps?: DependencyList
) {
  useEffect(() => {
    const t = setTimeout(() => {
      fn.apply(undefined, deps);
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
