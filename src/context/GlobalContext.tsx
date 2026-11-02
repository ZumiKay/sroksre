"use client";
import React, { useContext, useState, useSyncExternalStore } from "react";
import { Ordertype, Productordertype } from "../types/order.type";
import { Categorytype } from "../app/api/categories/route";
import { confirmmodaltype, userdata, Userdatastate } from "../types/user.type";
import { Listproductfilter, ProductState, StockTypeEnum } from "../types/product.type";
import { AllDataState, filterinventorytype, ItemLength } from "../types/global.type";
import { BannerState, PromotionProductState, PromotionState } from "../types/productAction.type";
import dayjs from "dayjs";

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
export const CateogoryInitailizestate: CateogoryState = {
  name: "",
  description: "",
  subcategories: [],
};
export const Productinitailizestate: ProductState = {
  name: "",
  price: 0.0,
  description: "",
  stocktype: StockTypeEnum.normal,
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
  expireAt: dayjs(new Date()),
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
  phonenumber: "",
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

// Global store
type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

interface GlobalValues {
  openmodal: OpenModalState;
  globalindex: GlobalIndexState;
  product: ProductState;
  category: CateogoryState;
  banner: BannerState;
  promotion: PromotionState;
  allData?: AllDataState;
  isLoading: LoadingState;
  itemlength: ItemLength;
  inventoryfilter: filterinventorytype;
  userinfo: Userdatastate;
  page: number;
  productorderdetail: Productordertype;
  user: userdata;
  listproductfilval: Listproductfilter;
  error: boolean;
  reloaddata: boolean;
  reloadcart: boolean;
  order: Ordertype | undefined;
  cart: boolean;
  carttotal: number;
}

interface GlobalSetters {
  setopenmodal: Setter<OpenModalState>;
  setglobalindex: Setter<GlobalIndexState>;
  setproduct: Setter<ProductState>;
  setcategory: Setter<CateogoryState>;
  setbanner: Setter<BannerState>;
  setpromotion: Setter<PromotionState>;
  setalldata: Setter<AllDataState | undefined>;
  setisLoading: Setter<LoadingState>;
  setitemlength: Setter<ItemLength>;
  setinventoryfilter: Setter<filterinventorytype>;
  setuserinfo: Setter<Userdatastate>;
  setpage: Setter<number>;
  setproductorderdetail: Setter<Productordertype>;
  setuser: Setter<userdata>;
  setproductfilval: Setter<Listproductfilter>;
  seterror: Setter<boolean>;
  setreloaddata: Setter<boolean>;
  setreloadcart: Setter<boolean>;
  setorder: Setter<Ordertype | undefined>;
  setcart: Setter<boolean>;
  setcarttotal: Setter<number>;
}

export type GlobalState = GlobalValues & GlobalSetters;

const initialValues = (): GlobalValues => ({
  openmodal: OpenmodalinitialState,
  globalindex: GlobalIndexInitializeState,
  product: Productinitailizestate,
  category: CateogoryInitailizestate,
  banner: BannerInitialize,
  promotion: PromotionInitialize,
  allData: undefined,
  isLoading: LoadingStateInitialized,
  itemlength: ItemlengthInitialize,
  inventoryfilter: "product",
  userinfo: {},
  page: 1,
  productorderdetail: Productdetailinitialize,
  user: Userinitialize,
  listproductfilval: { size: [], color: [], text: [], order: "" },
  error: false,
  reloaddata: true,
  reloadcart: true,
  order: undefined,
  cart: false,
  carttotal: 0,
});

// Setter name for each value, e.g. allData -> setalldata
const setterNames: { [K in keyof GlobalValues]-?: keyof GlobalSetters } = {
  openmodal: "setopenmodal",
  globalindex: "setglobalindex",
  product: "setproduct",
  category: "setcategory",
  banner: "setbanner",
  promotion: "setpromotion",
  allData: "setalldata",
  isLoading: "setisLoading",
  itemlength: "setitemlength",
  inventoryfilter: "setinventoryfilter",
  userinfo: "setuserinfo",
  page: "setpage",
  productorderdetail: "setproductorderdetail",
  user: "setuser",
  listproductfilval: "setproductfilval",
  error: "seterror",
  reloaddata: "setreloaddata",
  reloadcart: "setreloadcart",
  order: "setorder",
  cart: "setcart",
  carttotal: "setcarttotal",
};

interface GlobalStore {
  getState: () => GlobalState;
  subscribe: (listener: () => void) => () => void;
}

const createGlobalStore = (): GlobalStore => {
  const listeners = new Set<() => void>();
  let state = initialValues() as GlobalState;

  const setters = {} as Record<keyof GlobalSetters, Setter<unknown>>;
  for (const key of Object.keys(setterNames) as (keyof GlobalValues)[]) {
    setters[setterNames[key]] = (action) => {
      const prev = state[key];
      const next =
        typeof action === "function" ? (action as (p: unknown) => unknown)(prev) : action;
      if (Object.is(prev, next)) return;
      state = { ...state, [key]: next };
      listeners.forEach((listener) => listener());
    };
  }
  state = { ...state, ...(setters as unknown as GlobalSetters) };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// The context only carries the store object, which never changes, so it
const GlobalStoreContext = React.createContext<GlobalStore | null>(null);

export const GlobalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [store] = useState(createGlobalStore);

  return <GlobalStoreContext.Provider value={store}>{children}</GlobalStoreContext.Provider>;
};

export function useGlobalStore<T>(selector: (state: GlobalState) => T): T {
  const store = useContext(GlobalStoreContext);
  if (!store) {
    throw new Error("useGlobalStore must be used inside GlobalContextProvider");
  }
  const getSnapshot = () => selector(store.getState());
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
