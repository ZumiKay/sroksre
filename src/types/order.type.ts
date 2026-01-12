import { Address, User } from "@prisma/client";
import { ProductState, VariantColorValueType } from "./product.type";

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

export enum ShippingTypeEnum {
  standard = "Normal",
  express = "Express",
  pickup = "Pickup",
}

export interface Productorderdetailtype {
  variant_id: number;
  value: string;
  [key: string]: string | number | VariantColorValueType | undefined;
}

export interface Productordertype {
  id: number;
  details?: Array<Productorderdetailtype>;
  user_id?: number;
  quantity: number;
  price: Orderpricetype;
  productId?: number;
  maxqty?: number;
  product?: ProductState;
  orderId?: string;
  status?: Allstatus;
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
  buyer_id: string;
  Orderproduct: Array<Productordertype>;
  status: Allstatus;
  price: totalpricetype;
  estimate?: Date;
  shippingtype: ShippingTypeEnum;
  createdAt?: Date;
  updatdAt?: Date;
  shipping_id?: number;
  shipping?: Address;
  user: User;
}
