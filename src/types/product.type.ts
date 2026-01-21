import { InventoryType } from "../app/dashboard/inventory/varaint_action";
import { Orderpricetype } from "./order.type";

export enum StockTypeEnum {
  normal = "stock",
  variants = "variant",
}

export interface infovaluetype {
  qty: number;
  val: string;
}

export interface ProductInfo {
  id?: number;
  info_title: string;
  info_value: Array<string> | Array<infovaluetype>;
  info_type: InventoryType;
}

export const DefaultSize: Array<infovaluetype> = [
  {
    val: "S",
    qty: 1,
  },
  {
    val: "M",
    qty: 1,
  },
  {
    val: "XL",
    qty: 1,
  },
  {
    val: "2XL",
    qty: 1,
  },
];

export interface productcoverstype {
  url: string;
  type: string;
  name: string;
  isSaved?: boolean;
  id?: number;
}

export type VariantColorValueType = {
  val: string;
  name?: string;
};

export enum VariantTypeEnum {
  color = "COLOR",
  text = "TEXT",
}
export interface Varianttype {
  id?: number;
  option_title: string;
  option_type: VariantTypeEnum;
  option_value: Array<string | VariantColorValueType>;
  optional?: boolean;
  sectionId?: string;
  [key: string]: any;
}

export interface SubStockType {
  id?: number;
  qty: number;
  variant_val: string[];
}
export interface Stocktype {
  id?: number;
  qty: number;
  Stockvalue: SubStockType[];
  isLowStock?: boolean;
}

export interface Relatedproducttype {
  id: number;
  name: string;
  parentcategory_id: number;
  childcategory_id: number;
  covers: {
    id: number;
    url: string;
  }[];
}

export interface VariantSectionType {
  id?: number;
  strId?: string;
  Variants: Array<Varianttype>;
  Product?: ProductState;
  productsId?: number;
}
export interface ProductState {
  id?: number;
  name: string;
  price: number;
  description: string;
  stocktype: StockTypeEnum;
  covers: productcoverstype[] | [];
  category: { parent_id: number; child_id?: number };
  details: ProductInfo[] | [];
  stock?: number;
  variantcount?: number;
  Variant?: Array<Varianttype>;
  VariantSection?: Array<VariantSectionType>;
  Stock?: Array<Stocktype>;
  lowstock?: boolean;
  incart?: boolean;
  promotion_id?: number;
  discount?: Orderpricetype | number;
  relatedproductid?: Array<number>;
  relatedproduct?: Array<Relatedproducttype>;
  amount_sold?: number;
  amount_incart?: number;
  amount_wishlist?: number;
  createdAt?: Date;
}
export interface FilterValue {
  parentcate?: number;
  childcate?: number;
  status?: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  expiredate?: string;
  promotionid?: number;
  promoselect?: boolean;
  bannertype?: string;
  bannersize?: string;
  search?: string;
  expired?: string;
  promoids?: number[];
}
export const ProductStockType = {
  size: "size",
  variant: "variant",
  stock: "stock",
};

export interface Listproductfilter {
  size: Array<string>;
  color: Array<string>;
  text: Array<string>;
  order?: string;
}

export const FiltervalueInitialize: FilterValue = {
  parentcate: 0,
  childcate: 0,
  status: "",
  name: "",
  email: "",
};
