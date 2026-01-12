"use client";
import React, { useContext, useState } from "react";
import { Ordertype, Productordertype } from "../types/order.type";
import { Categorytype } from "../app/api/categories/route";
import { confirmmodaltype, userdata, Userdatastate } from "../types/user.type";
import { Listproductfilter, ProductState } from "../types/product.type";
import {
  AllDataState,
  Allrefstate,
  filterinventorytype,
  ItemLength,
} from "../types/global.type";
import {
  BannerState,
  PromotionProductState,
  PromotionState,
} from "../types/productAction.type";

type alerttype = {
  open: boolean;
  text: string;
  action?: () => Promise<void> | void;
};
interface OpenModalState {
  createProduct: boolean;
  createCategory: boolean;
  productdetail: boolean;
  createBanner: boolean;
  createPromotion: boolean;
  createUser: boolean;
  updatestock: boolean;
  addsubcategory: boolean;
  subcreatemenu_ivt: boolean;
  subeditmenu_ivt: boolean;
  subeditmenu_banner: boolean;
  imageupload: boolean;
  filteroption: boolean;
  addproductvariant: boolean;
  confirmmodal: confirmmodaltype;
  discount: boolean;
  loaded: boolean;
  managebanner: boolean;
  editprofile: boolean;
  editvariantstock: boolean;
  editsize: boolean;
  alert: alerttype;
  orderdetail: boolean;
  orderlaert: boolean;
  orderactionmodal: boolean;
  orderproductdetailmodal: boolean;
  exportoption: boolean;

  [key: string]: boolean | confirmmodaltype | alerttype;
}

export interface GlobalIndexState {
  productdetailindex: number;
  productcovereditindex: number;
  producteditindex: number;
  bannereditindex: number;
  categoryeditindex: number[];
  promotioneditindex: number;
  promotionproductedit: number;
  useredit: number;
  homeeditindex?: number;
}

export interface SubcategoriesState {
  id?: number;
  type?: "normal" | "promo";
  pid?: number;
  name: string;
  isExpired?: boolean;
}

export interface CateogoryState {
  id?: number;
  name: string;
  description: string;
  childid?: number[];
  subcategories: Array<SubcategoriesState> | [];
  type?: Categorytype;
  daterange?: {
    start: string;
    end: string;
  };
}

export interface LoadingState {
  GET: boolean;
  POST: boolean;
  PUT: boolean;
  DELETE: boolean;
  IMAGE: any;
}
export interface Sessiontype {
  id?: number;
  email?: string;
  name?: string;
  image?: string;
  role?: "USER" | "ADMIN" | "EDITOR";
  status?: string;
}

//Initail State
//

const OpenmodalinitialState: OpenModalState = {
  createProduct: false,
  createCategory: false,
  createBanner: false,
  createPromotion: false,
  createUser: false,
  productdetail: false,
  addsubcategory: false,
  subcreatemenu_ivt: false,
  subeditmenu_ivt: false,
  subeditmenu_banner: false,
  addproductvariant: false,
  updatestock: false,
  imageupload: false,
  filteroption: false,
  discount: false,
  loaded: false,
  managebanner: false,
  editprofile: false,
  editvariantstock: false,
  editsize: false,
  orderdetail: false,
  orderlaert: false,
  orderactionmodal: false,
  orderproductdetailmodal: false,
  exportoption: false,
  alert: {
    open: false,
    text: "",
  },
  confirmmodal: {
    open: false,
    confirm: true,
    closecon: "",
  },
};
export const Allrefinitialize: Allrefstate = {
  filterref: null,
};
export const CateogoryInitailizestate: CateogoryState = {
  name: "",
  description: "",
  subcategories: [],
};
export const Productinitailizestate: ProductState = {
  name: "",
  price: 0.0,
  description: "",
  stocktype: "stock",
  stock: 0,
  variantcount: 0,
  covers: [],
  category: {
    parent_id: 0,
    child_id: 0,
  },
  details: [],
  relatedproductid: [],
};
export const AllDataInitialize: AllDataState = {
  product: [],
  banner: [],
  category: [],
  promotion: [],
  filteredData: [],
  user: [],
};
export const ItemlengthInitialize: ItemLength = {
  total: 0,
  totalpage: 0,
};
export const BannerInitialize: BannerState = {
  name: "",
  type: "normal",
  size: "normal",
  image: {
    name: "",
    type: "",
    url: "",
  },
};
export const PromotionProductInitialize: PromotionProductState = {
  id: 0,
};
export const PromotionInitialize: PromotionState = {
  name: "",
  description: "",
  Products: [PromotionProductInitialize],
  selectbanner: false,
  selectproduct: false,

  tempproduct: [],
};

const GlobalIndexInitializeState: GlobalIndexState = {
  producteditindex: -1,
  productcovereditindex: -1,
  productdetailindex: -1,
  bannereditindex: -1,
  categoryeditindex: [],
  promotioneditindex: -1,
  promotionproductedit: -1,
  useredit: -1,
};
const LoadingStateInitialized: LoadingState = {
  GET: true,
  POST: false,
  PUT: false,
  DELETE: false,
  IMAGE: {},
};

export const Userinitialize: userdata = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmpassword: "",
  recapcha: null,
};

export const ProductStockType = {
  size: "size",
  variant: "variant",
  stock: "stock",
};

export const Productdetailinitialize: Productordertype = {
  id: 0,
  details: [],
  quantity: 0,
  price: { price: 0 },
};

//
//
//
///////////////////////
interface ContextType {
  openmodal: OpenModalState;
  setopenmodal: React.Dispatch<React.SetStateAction<OpenModalState>>;
  globalindex: GlobalIndexState;
  setglobalindex: React.Dispatch<React.SetStateAction<GlobalIndexState>>;
  product: ProductState;
  setproduct: React.Dispatch<React.SetStateAction<ProductState>>;
  category: CateogoryState;
  setcategory: React.Dispatch<React.SetStateAction<CateogoryState>>;
  banner: BannerState;
  setbanner: React.Dispatch<React.SetStateAction<BannerState>>;
  promotion: PromotionState;
  setpromotion: React.Dispatch<React.SetStateAction<PromotionState>>;
  allData?: AllDataState;
  setalldata: React.Dispatch<React.SetStateAction<AllDataState | undefined>>;
  isLoading: LoadingState;
  setisLoading: React.Dispatch<React.SetStateAction<LoadingState>>;
  itemlength: ItemLength;
  setitemlength: React.Dispatch<React.SetStateAction<ItemLength>>;
  inventoryfilter: filterinventorytype;
  setinventoryfilter: React.Dispatch<React.SetStateAction<filterinventorytype>>;
  userinfo: Userdatastate;
  page: number;
  setpage: React.Dispatch<React.SetStateAction<number>>;
  setuserinfo: React.Dispatch<React.SetStateAction<Userdatastate>>;
  productorderdetail: Productordertype;
  setproductorderdetail: React.Dispatch<React.SetStateAction<Productordertype>>;
  user: userdata;
  setuser: React.Dispatch<React.SetStateAction<userdata>>;
  listproductfilval: Listproductfilter;
  setproductfilval: React.Dispatch<React.SetStateAction<Listproductfilter>>;
  error: boolean;
  seterror: React.Dispatch<React.SetStateAction<boolean>>;
  reloaddata: boolean;
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
  reloadcart: boolean;
  setreloadcart: React.Dispatch<React.SetStateAction<boolean>>;
  order: Ordertype | undefined;
  setorder: React.Dispatch<React.SetStateAction<Ordertype | undefined>>;
  cart: boolean;
  setcart: React.Dispatch<React.SetStateAction<boolean>>;
  carttotal: number;
  setcarttotal: React.Dispatch<React.SetStateAction<number>>;
}
const GlobalContext = React.createContext<ContextType | null>(null);

export const GlobalContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [openmodal, setopenmodal] = useState(OpenmodalinitialState);
  const [category, setcategory] = useState(CateogoryInitailizestate);
  const [globalindex, setglobalindex] = useState(GlobalIndexInitializeState);
  const [product, setproduct] = useState(Productinitailizestate);
  const [banner, setbanner] = useState(BannerInitialize);
  const [promotion, setpromotion] = useState(PromotionInitialize);
  const [allData, setalldata] = useState<AllDataState | undefined>(undefined);
  const [isLoading, setisLoading] = useState(LoadingStateInitialized);
  const [itemlength, setitemlength] = useState(ItemlengthInitialize);
  const [user, setuser] = useState(Userinitialize);
  const [page, setpage] = useState(1);
  const [userinfo, setuserinfo] = useState({});
  const [error, seterror] = useState<boolean>(false);
  const [reloaddata, setreloaddata] = useState(true);
  const [reloadcart, setreloadcart] = useState(true);
  const [order, setorder] = useState<Ordertype | undefined>(undefined);
  const [cart, setcart] = useState(false);
  const [carttotal, setcarttotal] = useState(0);
  const [productorderdetail, setproductorderdetail] =
    useState<Productordertype>(Productdetailinitialize);

  const [listproductfilval, setproductfilval] = useState<Listproductfilter>({
    size: [],
    color: [],
    text: [],
    order: "",
  });
  const [inventoryfilter, setinventoryfilter] =
    useState<filterinventorytype>("product");

  return (
    <GlobalContext.Provider
      value={{
        productorderdetail,
        setproductorderdetail,
        listproductfilval,
        setproductfilval,
        error,
        reloaddata,
        setreloaddata,
        order,
        cart,
        setcart,
        reloadcart,
        setreloadcart,
        setorder,
        seterror,
        promotion,
        setpromotion,
        userinfo,
        setuserinfo,
        page,
        setpage,
        banner,
        setbanner,
        openmodal,
        setopenmodal,
        product,
        setproduct,
        globalindex,
        setglobalindex,
        category,
        setcategory,
        allData,
        setalldata,
        isLoading,
        setisLoading,
        itemlength,
        setitemlength,
        inventoryfilter,
        setinventoryfilter,
        user,
        setuser,
        carttotal,
        setcarttotal,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("Context Not Found");
  } else {
    return context;
  }
};
type closecontype =
  | "createProduct"
  | "createBanner"
  | "createPromotion"
  | "createCategory"
  | "addsubcategory"
  | "createUser";
export const SaveCheck = (
  confirm: boolean,
  closecon: closecontype,
  openmodal: OpenModalState,
  open?: boolean,
  deletecallback?: any
) => {
  return {
    ...openmodal,
    confirmmodal: {
      open: open ?? false,
      confirm: confirm,
      closecon: closecon,
      deletecallback: deletecallback,
    },
  };
};
