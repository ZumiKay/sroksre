import { Dispatch, SetStateAction, cache, useState } from "react";
import { LoadingState, useGlobalContext } from "./GlobalContext";
import Error from "next/error";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE"; // Add other request methods as needed

export const useRequest = (
  url: string,
  method: RequestMethod = "GET",
  data: any = null,
  alldatastate?: string,
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
  setloading: React.Dispatch<SetStateAction<LoadingState>>,
  method: RequestMethod = "DELETE",

  datatype: "JSON" | "FILE" = "JSON",
  data?: any,
): Promise<{
  success: boolean;
  error?: string;
  data?: any;
  total?: number;
}> => {
  try {
    setloading((prev) => ({ ...prev, [method]: true }));
    const requestOptions: RequestInit = {
      method,
    };
    if (data) {
      requestOptions.body = datatype === "JSON" ? JSON.stringify(data) : data;
    }

    const response = await fetch(url, requestOptions);

    const responseJson = await response.json();

    if (!response.ok) {
      throw new Error(responseJson.message || "Error Occured");
    }
    setloading((prev) => ({ ...prev, [method]: false }));

    if (method === "GET" || method === "POST") {
      return {
        success: true,
        data: responseJson.data,
        total: method === "GET" && responseJson.total,
      };
    } else {
      return { success: true };
    }
  } catch (error) {
    setloading((prev) => ({ ...prev, [method]: false }));

    return { success: false, error: "Error Occured" };
  }
};
