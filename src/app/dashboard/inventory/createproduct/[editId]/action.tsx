import { ApiRequest } from "@/src/context/CustomHook";

export const FetchCategory = async ({
  ty,
  offset,
  pid,
  type,
}: {
  ty: "parent" | "child";
  offset: number;
  pid?: number;
  type?: string;
}) => {
  const makereq = await ApiRequest({
    url:
      "/api/categories/select" +
      `?ty=${ty}${type ? `&catetype=${type}` : ""}&take=${offset}${
        pid ? `&pid=${pid}` : ""
      }`,
    method: "GET",
    revalidate: "selectcate",
  });
  if (!makereq.success) {
    return;
  }
  return makereq.data;
};

export const FetchEditProduct = async (id: string) => {
  const getReq = await ApiRequest({
    url: `/api/products?ty=info&id=${id}`,
    method: "GET",
  });
  if (!getReq.success) {
    return { success: false };
  }

  return { success: true, data: getReq.data };
};
