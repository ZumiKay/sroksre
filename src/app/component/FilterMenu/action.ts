import { ApiRequest } from "@/src/context/CustomHook";

export const FetchPromotionSelection = async (offset: number) => {
  const makeReq = await ApiRequest({
    url: `/api/promotion?ty=selection&limit=${offset}`,
    method: "GET",
  });

  if (!makeReq.success) {
    return null;
  }

  return makeReq.data;
};
