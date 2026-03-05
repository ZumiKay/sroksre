import { totalpricetype } from "@/src/types/order.type";
import { userdata } from "@/src/types/user.type";
import { Productordertype } from "@/src/types/order.type";
import { shippingtype } from "@/src/app/component/Modals/User";
import { OrderUserType } from "@/src/app/checkout/action";
import dayjs from "dayjs";

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
    },
  ];
  shippingtype: string;
  shippingprice?: number;
  totalprice: number;
}

export interface OrderDetailType {
  user: userdata;
  shipping: shippingtype;
  createdAt: Date;
  updatedAt: Date;
  price: totalpricetype;
}

export interface ModalDataType {
  detail?: OrderDetailType;
  product?: Array<Productordertype>;
  action?: OrderUserType;
}

export interface Filterdatatype {
  q?: string;
  orderdate?: dayjs.Dayjs | string;
  fromdate?: dayjs.Dayjs | string;
  todate?: dayjs.Dayjs | string;
  startprice?: number | string;
  endprice?: number | string;
  filename?: string;
  [key: string]: any;
}
