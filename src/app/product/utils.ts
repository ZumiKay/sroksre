import { IsNumber } from "@/src/lib/utilities";

export interface ProductParam {
  p?: string;
  show?: string;
  pid?: string;
  cid?: string;
  filter?: string;
  color?: string;
  size?: string;
  other?: string;
  promo?: string;
  search?: string;
  promoid?: string;
  ppid?: string;
  pids?: string;
  bid?: string;
  all?: string;
  sort?: string;
  pcate?: string;
  ccate?: string;
}

export interface ParsedParams {
  color?: string[];
  size?: string[];
  other?: string[];
  promo?: string[];
  selectProduct?: string[];
  parentCate?: string[];
  childCate?: string[];
  page: string;
  limit: string;
}

/**
 * Check if an array contains only empty strings
 */
export const isArrayWithEmptyStrings = (arr?: string[]): boolean => {
  if (!arr) return false;
  return arr.every((item) => item === "");
};

/**
 * Validate search parameters
 */
export const validateSearchParams = (params: ProductParam): boolean => {
  const {
    p,
    show,
    color,
    size,
    other,
    promo,
    pids,
    pid,
    cid,
    all,
    bid,
    search,
    promoid,
    ppid,
    sort,
  } = params;

  // Check for empty strings
  const colorArr = color?.split(",");
  const sizeArr = size?.split(",");
  const otherArr = other?.split(",");
  const promoArr = promo?.split(",");
  const pidsArr = pids?.split(",");

  if (
    isArrayWithEmptyStrings(colorArr) ||
    isArrayWithEmptyStrings(sizeArr) ||
    isArrayWithEmptyStrings(otherArr) ||
    isArrayWithEmptyStrings(promoArr) ||
    isArrayWithEmptyStrings(pidsArr) ||
    (p && p === "") ||
    (show && show === "") ||
    (all && all === "") ||
    (bid && bid === "") ||
    (search && search === "") ||
    (promoid && promoid === "") ||
    (ppid && ppid === "") ||
    (pids && pids === "") ||
    (pid && pid === "") ||
    (cid && cid === "") ||
    (sort && (sort === "" || parseInt(sort) > 2))
  ) {
    return false;
  }

  // Check for valid numbers
  if (
    (show && !IsNumber(show)) ||
    (pid && !IsNumber(pid)) ||
    (cid && !IsNumber(cid)) ||
    (p && !IsNumber(p)) ||
    (promoid && !IsNumber(promoid)) ||
    (ppid && !IsNumber(ppid)) ||
    (bid && !IsNumber(bid)) ||
    (all && !IsNumber(all)) ||
    (sort && !IsNumber(sort))
  ) {
    return false;
  }

  return true;
};

/**
 * Parse search parameters into a structured object
 */
export const parseSearchParams = (searchParams: ProductParam): ParsedParams => {
  const { color, size, other, promo, pids, pcate, ccate, p, show } =
    searchParams;

  return {
    color: color?.split(","),
    size: size?.split(","),
    other: other?.split(","),
    promo: promo?.split(","),
    selectProduct: pids?.split(","),
    parentCate: pcate?.split(","),
    childCate: ccate?.split(","),
    page: p ?? "1",
    limit: show ?? "1",
  };
};

/**
 * Determine the page title based on categories
 */
export const getPageTitle = (
  parentCateName?: string,
  childCateName?: string,
  promotionName?: string,
  bannerName?: string,
  isAll?: boolean,
): string => {
  if (promotionName) return promotionName;
  if (bannerName) return bannerName;
  if (isAll) return "All Products";

  const parts = [parentCateName, childCateName].filter(Boolean);
  return parts.join(" - ") || "";
};
