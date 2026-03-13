import { Dayjs } from "dayjs";
import { BannerType } from "../app/severactions/actions";

export interface SelectType {
  label: string;
  value: string | number;
}
export interface BannerState {
  id?: number;
  name: string;
  type: BannerType;
  size: string;
  image: {
    url: string;
    name: string;
    type: string;
  };
  linktype?: string;
  parentcate_id?: number;
  childcate_id?: number;
  selectedproduct_id?: Array<number>;
  parentcate?: SelectType;
  childcate?: SelectType;
  promotionId?: number;
  promotion?: PromotionState;
  selectedproduct?: SelectType[];
  selectedpromotion?: SelectType;
  link?: string;
}

export interface PromotionProductState {
  id: number;
  discount?: {
    percent: number;
    newprice: string;
    oldprice: number;
  };
}
export interface PromotionState {
  id?: number;
  name: string;
  description: string;
  selectproduct: boolean;
  selectbanner: boolean;
  Products: Array<PromotionProductState>;
  expireAt?: Dayjs;
  banner_id?: number;
  banner?: BannerState;
  tempproduct?: number[];
  tempproductstate?: Array<PromotionProductState>;
  type?: string;
  isExpired?: boolean;
  autocate?: boolean;
}
