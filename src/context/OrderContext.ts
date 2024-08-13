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
