import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast } from "../component/Loading";

export const FetchDataForDashboard = async (url: string) => {
  const getReq = await ApiRequest({ url, method: "GET" });

  if (!getReq.success) {
    errorToast(getReq.error ?? "Error Occured");
    return null;
  }
  return getReq.data;
};
