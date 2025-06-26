import {
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

export const AllOrderStatusData: SelectType<string>[] = [
  { label: "All", value: "All", color: "lightgray" },
  { label: "Incart", value: "Incart", color: "#495464" },
  { label: "Unpaid", value: "Unpaid", color: "#EB5757" },
  { label: "Paid", value: "Paid", color: "#35C191" },
  { label: "Preparing", value: "Preparing", color: "#0097FA" },
  { label: "Ready", value: "Ready", color: "#F2C94C" },
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
  ready = "Ready",
  shipped = "Shipped",
  arrived = "Arrived",
  cancelled = "Cancelled",
  problem = "Problem",
}

export interface Productorderdetailtype {
  id?: number;
  variantId: number;
  variantIdx: number;
  variant?: Varianttype;
  orderProductId?: number;
  Orderproduct?: Productordertype;
}

export interface Productordertype {
  id: number;
  details?: Array<Productorderdetailtype>;
  quantity: number;
  productId?: number;
  product?: ProductState;
  orderId?: string;
  selectedvariant?: (string | VariantColorValueType)[];
  user_id?: number;
  user?: userdata;
  variantId?: number;
  stock_selected_id?: number;
  stockvar?: Stocktype;
  maxqty?: number;
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
  createAt?: Date;
  updateAt?: Date;
  shipping_id?: number;
  shipping?: Address;
  user?: userdata;
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
