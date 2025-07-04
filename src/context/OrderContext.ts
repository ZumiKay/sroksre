import {
  DiscountpriceType,
  ProductState,
  SelectType,
  Stocktype,
  userdata,
  VariantColorValueType,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { Address } from "@prisma/client";
import { OrderUserType } from "../app/checkout/action";
import dayjs from "dayjs";
import { isValidDate } from "../lib/utilities";
import { ShippingOptionTypes } from "./Checkoutcontext";

export enum Allstatus {
  all = "All",
  incart = "Incart",
  unpaid = "Unpaid",
  paid = "Paid",
  prepareing = "Preparing",
  ready = "Ready",
  shipped = "Shipped",
  arrived = "Arrived",
  cancelled = "Cancelled",
  problem = "Problem",
  achieve = "Achieve",
}

export const AllOrderStatusData: SelectType<string>[] = [
  { label: "All", value: Allstatus.all, color: "lightgray" },
  { label: "Incart", value: Allstatus.incart, color: "#495464" },
  { label: "Unpaid", value: Allstatus.unpaid, color: "#EB5757" },
  { label: "Paid", value: Allstatus.paid, color: "#35C191" },
  { label: "Preparing", value: Allstatus.prepareing, color: "#0097FA" },
  { label: "Ready", value: Allstatus.ready, color: "#F2C94C" },
  { label: "Shipped", value: Allstatus.shipped, color: "#60513C" },
  { label: "Arrived", value: Allstatus.arrived, color: "#35C191" },
  { label: "Problem", value: Allstatus.problem, color: "red" },
  { label: "Cancelled", value: Allstatus.cancelled, color: "#EB5757" },
  { label: "Achieved", value: Allstatus.achieve, color: "lightgray" },
];

export type OrderDetialModalType = "user" | "shipping" | "close" | "none";

export type OrderGetReqType =
  | "product"
  | "all"
  | "user"
  | "export"
  | "filter"
  | "shipping"
  | "status";

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

export enum OrderAction {
  delete = "delete",
  updatestatus = "updatestatus",
  cancel = "cancel",
  achieve = "achieve",
  none = "none",
}

export interface Productorderdetailtype {
  id?: number;
  variantId: number;
  variantIdx: number;
  variant?: Varianttype;
  orderProductId?: number;
  Orderproduct?: Productordertype;
  stock_selected_id?: number;
  stockvar?: Stocktype;
}

export interface Productordertype {
  id: number;
  details?: Array<Productorderdetailtype>;
  quantity: number;
  productId?: number;
  price: number;
  discount?: DiscountpriceType;
  product?: ProductState;
  orderId?: string;
  selectedvariant?: (string | VariantColorValueType)[];
  user_id?: number;
  user?: userdata;
  variantId?: number;
  stock_selected_id?: number;
  stockvar?: Stocktype;
  maxqty?: number;
  total?: number;
}

export interface InvoiceProductPdfType {
  id: number;
  name: string;
  price: Pick<ProductState, "price" | "discount">;
  selectedVariant: string[];
  quantity: number;
  totalprice: number;
}

export interface GenerateInvoicePdf {
  id: string;
  product: InvoiceProductPdfType[];
  price: totalpricetype;
  shipping?: Address;
  createdAt?: string;
}

export interface totalpricetype {
  vat?: number;
  shipping?: number;
  subtotal: number;
  total: number;
}

export interface Ordertype {
  id?: string;
  buyer_id: string;
  Orderproduct: Array<Productordertype>;
  status: Allstatus;
  price: totalpricetype;
  orderDate?: Date;
  estimate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  shipping_id?: number;
  shipping?: Address;
  shippingtype?: ShippingOptionTypes;
  user?: userdata;
  sessionId?: string;
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

export interface OrderFilterParam<t = string, d = string> {
  q?: string;
  startprice?: t;
  endprice?: t;
  fromdate?: d;
  enddate?: d;
  p?: t;
  lt?: t;
  status?: Allstatus[];
  sort?: "asc" | "desc";
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
