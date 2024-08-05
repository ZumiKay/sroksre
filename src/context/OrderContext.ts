import { getServerSession } from "next-auth";
import {
  ProductState,
  Usersessiontype,
  VariantColorValueType,
} from "./GlobalContext";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export const getUser = async (): Promise<Usersessiontype | null> => {
  const user = (await getServerSession(authOptions)) as any;
  const result = user?.user as Usersessiontype | null;

  return result;
};
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
  id?: number;
  option_title: string;
  option_type: string;
  option_value: string | VariantColorValueType;
  [key: string]: any;
}

export interface Productordertype {
  id: number;
  details: Array<Productorderdetailtype>;
  quantity: number;
  price: Orderpricetype;
  productId?: number;
  maxqty?: number;
  product?: ProductState;
  orderId?: string;
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
