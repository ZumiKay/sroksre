import {
  ProductState,
  userdata,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { Address } from "@prisma/client";
import { OrderUserType } from "../app/checkout/action";
import dayjs from "dayjs";

export type OrderDetialModalType = "user" | "shipping" | "close" | "none";

export type Orderstatus =
  | "Incart"
  | "Unpaid"
  | "Paid"
  | "Preparing"
  | "Shipped"
  | "Arrived"
  | "Problem";

export enum Allstatus {
  incart = "Incart",
  unpaid = "Unpaid",
  paid = "Paid",
  prepareing = "Preparing",
  shipped = "Shipped",
  arrived = "Arrived",
}

export interface Productorderdetailtype {
  variant_id: number;
  value: string;
  [key: string]: string | number | VariantColorValueType | undefined;
}

export interface Productordertype {
  id: number;
  details?: Array<Productorderdetailtype>;
  quantity: number;
  price: Orderpricetype;
  productId?: number;
  maxqty?: number;
  product?: ProductState;
  orderId?: string;
  selectedvariant?: (string | VariantColorValueType)[];
}

export interface Orderpricetype {
  price: number;
  discount?: {
    percent?: number;
    newprice?: number;
  };
}

export interface totalpricetype {
  vat?: number;
  shipping?: number;
  subtotal: number;
  total: number;
}

export interface Ordertype {
  id?: string;
  buyerId: string;
  products: Array<Productordertype>;
  status: Orderstatus;
  price: totalpricetype;
  estimate?: Date;
}

export interface OrderDetailType {
  user: userdata;
  shipping: Address;
  createdAt: Date;
  updatedAt: Date;
  price: totalpricetype;
}
export interface ModalDataType {
  detail?: OrderDetailType;
  product?: Array<Productordertype>;
  action?: OrderUserType;
}

export interface DownloadData {
  orderID: string;
  orderDate: string;
  buyer: string;
  product: [
    {
      productid: string;
      productname: string;
      quantity: number;
      price: number;
      discount: number;
    }
  ];
  shippingtype: string;
  shippingprice?: number;
  totalprice: number;
}

export interface Filterdatatype {
  q?: string;
  orderdate?: dayjs.Dayjs | string;
  fromdate?: dayjs.Dayjs | string;
  todate?: dayjs.Dayjs | string;
  startprice?: number | string;
  endprice?: number | string;
  filename?: string;
  [key: string]: number | dayjs.Dayjs | string | undefined;
}

export interface AllorderStatus {
  id: string;
  status: string;
  price: totalpricetype;
  shippingtype?: string;
  createdAt: Date;
  updatedAt: Date;
}
