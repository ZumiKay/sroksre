import {
  ProductState,
  userdata,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { Address } from "@prisma/client";
import { OrderUserType } from "../app/checkout/action";
import dayjs from "dayjs";
import { isValidDate } from "../lib/utilities";

export const AllOrderStatusData = [
  { label: "All", value: "All", color: "lightgray" },
  { label: "Incart", value: "Incart", color: "#495464" },
  { label: "Unpaid", value: "Unpaid", color: "#EB5757" },
  { label: "Paid", value: "Paid", color: "#35C191" },
  { label: "Preparing", value: "Preparing", color: "#0097FA" },
  { label: "Shipped", value: "Shipped", color: "#60513C" },
  { label: "Arrived", value: "Arrived", color: "#35C191" },
  { label: "Problem", value: "Problem", color: "red" },
  { label: "Cancelled", value: "Cancelled", color: "#EB5757" },
];

export type OrderDetialModalType = "user" | "shipping" | "close" | "none";

export type OrderGetReqType = "product" | "all" | "user" | "export" | "filter";

export type Orderstatus =
  | "All"
  | "Incart"
  | "Unpaid"
  | "Paid"
  | "Preparing"
  | "Shipped"
  | "Arrived"
  | "Problem"
  | "Cancelled";

export enum Allstatus {
  all = "All",
  incart = "Incart",
  unpaid = "Unpaid",
  paid = "Paid",
  prepareing = "Preparing",
  shipped = "Shipped",
  arrived = "Arrived",
  cancelled = "Cancelled",
  problem = "Problem",
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
  orderDate?: Date;
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
  orderdate?: Date;
  fromdate?: Date;
  todate?: dayjs.Dayjs;
  startprice?: string;
  endprice?: string;
  filename?: string;
  p?: number;
  lt?: number;
  [key: string]: number | dayjs.Dayjs | string | undefined | Date;
}

export interface AllorderStatus {
  id: string;
  status: string;
  price: totalpricetype;
  shippingtype?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function isValidFilterParam(key: string, value: unknown): boolean {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return true; // Optional params can be null/undefined
  }

  // Check specific fields
  switch (key) {
    case "q":
    case "filename":
    case "startprice":
    case "endprice":
      return typeof value === "string";

    case "orderdate":
    case "fromdate":
    case "todate":
      return isValidDate(value);

    default:
      // For dynamic [key: string] check if it's string, number, or Date
      return (
        typeof value === "string" ||
        typeof value === "number" ||
        isValidDate(value)
      );
  }
}
