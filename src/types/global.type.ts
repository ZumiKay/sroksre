import { CateogoryState } from "../context/GlobalContext";
import { ProductState } from "./product.type";
import { BannerState, PromotionState } from "./productAction.type";
import { UserState } from "./user.type";

export interface AllDataState {
  product?: ProductState[];
  banner?: BannerState[];
  promotion?: PromotionState[];
  category?: CateogoryState[];
  filteredData?: ProductState[] | BannerState[] | PromotionState[];
  user?: UserState[];
  tempbanner?: {
    id: number;
    show: boolean;
  }[];
  [x: string]: any;
}

export interface ActionReturnType<t = string> {
  success: boolean;
  message?: string;
  data?: t;

  [x: string]: any;
}

export interface ItemLength {
  total: number;
  lowstock?: number;
  totalpage: number;
}

export type filterinventorytype =
  | "product"
  | "banner"
  | "promotion"
  | "usermanagement"
  | string;

export interface Allrefstate {
  filterref: HTMLDivElement | null;
}
