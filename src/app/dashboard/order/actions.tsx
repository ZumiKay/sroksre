import { ApiRequest } from "@/src/context/CustomHook";
import { Ordertype } from "@/src/context/OrderContext";

const buildQueryString = (params: URLSearchParams) => {
  if (!params || typeof params !== "object") return "";

  const queryString = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, value.toString());
    }
  });

  const query = queryString.toString();
  return query ? `?${query}` : "";
};

export const GetOrder = async ({ param = null }) => {
  try {
    // Build URL with query parameters if provided
    const url = param
      ? `/api/order/list${buildQueryString(param)}`
      : "/api/order/list";

    const getReq = await ApiRequest({
      url,
      method: "GET",
    });

    return getReq || null;
  } catch (error) {
    console.error("Error fetching order data:", error);
    return null;
  }
};

export const EditOrder = async (order: Ordertype, type: "status") => {
  const editReq = await ApiRequest({
    url: "/api/order/list",
    method: "PUT",
    data: { ...order, type },
  });

  if (!editReq) {
    return null;
  }

  return editReq;
};
