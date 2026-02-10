import dayjs from "dayjs";

interface FilterParams {
  status?: string;
  name?: string;
  childcate?: string;
  parentcate?: string;
  bannersize?: string;
  bannertype?: string;
  expired?: string;
  expiredate?: string;
  promoids?: string;
}

export const buildProductApiUrl = (
  page: number,
  show: string,
  filtervalue: FilterParams,
  promotionSelectProduct: boolean,
  pid?: number,
  promoids?: string,
): string => {
  const { status, name, childcate, parentcate } = filtervalue;

  const hasFilters =
    status ||
    name ||
    childcate ||
    parentcate ||
    promotionSelectProduct ||
    promoids;

  if (hasFilters) {
    const params = new URLSearchParams({
      ty: "filter",
      p: page.toString(),
      limit: show,
    });

    if (status) params.append("sk", status);
    if (name) params.append("q", name);
    if (parentcate) params.append("pc", parentcate);
    if (childcate) params.append("cc", childcate);
    if (pid) params.append("pid", pid.toString());
    if (promotionSelectProduct) params.append("sp", "1");
    if (promoids) params.append("pids", promoids);

    return `/api/products?${params.toString()}`;
  }

  return `/api/products?ty=all&limit=${show}&p=${page}`;
};

export const buildBannerApiUrl = (
  page: number,
  show: string,
  filtervalue: FilterParams,
  promotionSelectBanner: boolean,
): string => {
  const { name, bannersize, bannertype } = filtervalue;

  const hasFilters = name || bannersize || bannertype;

  if (hasFilters) {
    const params = new URLSearchParams({
      ty: "filter",
      limit: show,
      p: page.toString(),
    });

    if (bannertype) params.append("bty", bannertype);
    if (bannersize) params.append("bs", bannersize);
    if (name) params.append("q", name);

    return `/api/banner?${params.toString()}`;
  }

  if (promotionSelectBanner) {
    return `/api/banner?ty=filter&limit=${show}&p=${page}&bty=normal&promoselect=1`;
  }

  return `/api/banner?ty=all&limit=${show}&p=${page}`;
};

export const buildPromotionApiUrl = (
  page: number,
  show: string,
  filtervalue: FilterParams,
): string => {
  const { name, expiredate, expired } = filtervalue;

  const hasFilters = name || expiredate || expired;

  if (hasFilters) {
    const params = new URLSearchParams({
      ty: "filter",
      lt: show,
      p: (page ?? "1").toString(),
    });

    if (name) params.append("q", name);
    if (expiredate) params.append("exp", dayjs(expiredate).toISOString());
    if (expired) params.append("expired", expired);

    return `/api/promotion?${params.toString()}`;
  }

  return `/api/promotion?ty=all&lt=${show}&p=${page ?? "1"}`;
};

// Data transformation functions
export const transformProductData = (item: any) => ({
  ...item,
  category: {
    parent_id: item.parentcategory_id,
    child_id: item.childcategory_id,
  },
  parentcategory_id: undefined,
  childcategory_id: undefined,
});

export const transformBannerData = (item: any) => ({
  ...item,
  createdAt: undefined,
  updatedAt: undefined,
});

export const transformPromotionData = (item: any) => ({
  ...item,
  products: item.Products,
  expiredAt: dayjs(item.expireAt),
  tempproduct: [],
  createdAt: undefined,
  updatedAt: undefined,
  Products: undefined,
});
