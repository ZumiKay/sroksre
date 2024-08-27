"use client";
import { Dayjs } from "dayjs";
import React, { useContext, useState } from "react";
import { Role } from "@prisma/client";
import { Ordertype } from "./OrderContext";
import { BannerType } from "../app/severactions/actions";
import { Categorytype } from "../app/api/categories/route";
import { InventoryType } from "../app/dashboard/inventory/varaint_action";

export interface ActionReturnType<t = string> {
  success: boolean;
  message?: string;
  data?: t;

  [x: string]: any;
}
export interface SelectType {
  label: string;
  value: string | number;
}
export interface userdata {
  id?: number;
  email?: string;
  password?: string;
  confirmpassword?: string;
  firstname?: string;
  lastname?: string;
  sessionid?: string;
  role?: Role;
  agreement?: boolean;
  cid?: string;
  recapcha: string | null;
}
export interface infovaluetype {
  qty: number;
  val: string;
}
export interface ProductInfo {
  id?: number;
  info_title: string;
  info_value: Array<string> | Array<infovaluetype>;
  info_type: InventoryType;
}

export const DefaultSize: Array<infovaluetype> = [
  {
    val: "S",
    qty: 1,
  },
  {
    val: "M",
    qty: 1,
  },
  {
    val: "XL",
    qty: 1,
  },
  {
    val: "2XL",
    qty: 1,
  },
];

export interface productcoverstype {
  url: string;
  type: string;
  name: string;
  isSaved?: boolean;
  id?: number;
}

export type VariantColorValueType = {
  val: string;
  name?: string;
};
export interface Varianttype {
  id?: number;
  option_title: string;
  option_type: "COLOR" | "TEXT";
  option_value: Array<string | VariantColorValueType>;
  [key: string]: any;
}
export interface Stocktype {
  id?: number;
  qty: number;
  Stockvalue: {
    id?: number;
    qty: number;
    variant_val: string[];
  }[];
  isLowStock?: boolean;
}

export interface Relatedproducttype {
  id: number;
  name: string;
  parentcategory_id: number;
  childcategory_id: number;
  covers: {
    id: number;
    url: string;
  }[];
}
export interface ProductState {
  id?: number;
  name: string;
  price: number;
  description: string;
  stocktype: string;
  covers: productcoverstype[] | [];
  category: { parent_id: number; child_id?: number };
  details: ProductInfo[] | [];
  stock?: number;
  variantcount?: number;
  variants?: Array<Varianttype>;
  varaintstock?: Array<Stocktype>;
  lowstock?: boolean;
  incart?: boolean;
  promotion_id?: number;
  discount?: {
    percent: number;
    newprice: string;
  };
  relatedproductid?: Array<number>;
  relatedproduct?: Array<Relatedproducttype>;
  amount_sold?: number;
  amount_incart?: number;
  amount_wishlist?: number;
  createdAt?: Date;
}
export interface FilterValue {
  parentcate?: number;
  childcate?: number;
  status?: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  expiredate?: string;
  promotionid?: number;
  promoselect?: boolean;
  bannertype?: string;
  bannersize?: string;
  search?: string;
  expired?: string;
  promoids?: number[];
}

interface Listproductfilter {
  size: Array<string>;
  color: Array<string>;
  text: Array<string>;
  order?: string;
}

export interface NotificationType {
  id?: number;
  type: string;
  content: string;
  link?: string;
  userid?: string;
  createdAt?: string;
  checked: boolean;
}

export const FiltervalueInitialize: FilterValue = {
  parentcate: 0,
  childcate: 0,
  status: "",
  name: "",
  email: "",
};

export interface BannerState {
  id?: number;
  name: string;
  type: BannerType;
  size: string;
  image: {
    url: string;
    name: string;
    type: string;
  };
  linktype?: string;
  parentcate?: SelectType;
  childcate?: SelectType;
  selectedproduct?: SelectType[];
  selectedpromotion?: SelectType;
  link?: string;
}
export interface UserState {
  id?: number;
  lastname?: string;
  password?: string;
  confirmpassword?: string;
  newpassword?: string;
  phonenumber?: string;
  role?: Role;
  firstname: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Userdatastate {
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: Role;
  oldpassword?: string;
  newpassword?: string;
}
export interface ItemLength {
  total: number;
  lowstock?: number;
  totalpage: number;
}

export interface PromotionProductState {
  id: number;
  discount?: {
    percent: number;
    newprice: string;
    oldprice: number;
  };
}
export interface PromotionState {
  id?: number;
  name: string;
  description: string;
  selectproduct: boolean;
  selectbanner: boolean;
  Products: Array<PromotionProductState>;
  expireAt?: Dayjs;
  banner_id?: number;
  banner?: BannerState;
  tempproduct?: number[];
  tempproductstate?: Array<PromotionProductState>;
  type?: string;

  isExpired?: boolean;
}

export type filterinventorytype =
  | "product"
  | "banner"
  | "promotion"
  | "usermanagement"
  | string;

export interface Allrefstate {
  filterref: HTMLDivElement | null;
}

interface AllDataState {
  product?: ProductState[];
  banner?: BannerState[];
  promotion?: PromotionState[];
  category?: CateogoryState[];
  filteredData?: ProductState[] | BannerState[] | PromotionState[];
  user?: UserState[];
  tempbanner?: {
    id: number;
    show: boolean;
  }[];
  [x: string]: any;
}

export interface Usersessiontype {
  sub: number;
  id: number;
  role: Role;
  session_id: string;
}

type confirmmodaltype = {
  open: boolean;
  confirm: boolean;
  closecon: string;
  index?: number | string;
  Warn?: string;
  type?:
    | "product"
    | "banner"
    | "promotion"
    | "promotioncancel"
    | "user"
    | "userinfo";
  onDelete?: () => void;
  onAsyncDelete?: () => Promise<void>;
};

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

export interface AllFilterValueState {
  page: "product" | "banner" | "promotion" | "usermanagement" | "listproduct";
  filter: FilterValue;
}
export interface CateogoryState {
  id?: number;
  name: string;
  childid?: number[];
  subcategories: Array<SubcategoriesState> | [];
  type?: Categorytype;
  daterange?: {
    start: string;
    end: string;
  };
}
export interface SubcategoriesState {
  id?: number;
  type?: "normal" | "promo";
  pid?: number;
  name: string;
  isExpired?: boolean;
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

export interface ProductOrderType {
  id: number;
  quantity: number;
  details: Array<ProductInfo>;
  price: string;
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

export const AllFilterValueInitialize: AllFilterValueState = {
  page: "product",
  filter: FiltervalueInitialize,
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
  allData: AllDataState;
  setalldata: React.Dispatch<React.SetStateAction<AllDataState>>;
  isLoading: LoadingState;
  setisLoading: React.Dispatch<React.SetStateAction<LoadingState>>;
  subcate: Array<SubcategoriesState>;
  setsubcate: React.Dispatch<React.SetStateAction<Array<SubcategoriesState>>>;
  itemlength: ItemLength;
  setitemlength: React.Dispatch<React.SetStateAction<ItemLength>>;
  inventoryfilter: filterinventorytype;
  setinventoryfilter: React.Dispatch<React.SetStateAction<filterinventorytype>>;
  allfiltervalue: Array<AllFilterValueState>;
  userinfo: Userdatastate;
  page: number;
  setpage: React.Dispatch<React.SetStateAction<number>>;
  setuserinfo: React.Dispatch<React.SetStateAction<Userdatastate>>;
  setallfilterval: React.Dispatch<
    React.SetStateAction<Array<AllFilterValueState>>
  >;
  user: userdata;
  setuser: React.Dispatch<React.SetStateAction<userdata>>;
  listproductfilter: Listproductfilter;
  setlistprodfil: React.Dispatch<React.SetStateAction<Listproductfilter>>;
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
  const [subcate, setsubcate] = useState<SubcategoriesState[]>([]);
  const [globalindex, setglobalindex] = useState(GlobalIndexInitializeState);
  const [product, setproduct] = useState(Productinitailizestate);
  const [banner, setbanner] = useState(BannerInitialize);
  const [promotion, setpromotion] = useState(PromotionInitialize);
  const [allData, setalldata] = useState(AllDataInitialize);
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

  const [listproductfilter, setlistprodfil] = useState<Listproductfilter>({
    size: [],
    color: [],
    text: [],
  });
  const [listproductfilval, setproductfilval] = useState<Listproductfilter>({
    size: [],
    color: [],
    text: [],
    order: "",
  });
  const [inventoryfilter, setinventoryfilter] =
    useState<filterinventorytype>("product");
  const [allfiltervalue, setallfilterval] = useState<AllFilterValueState[]>([
    AllFilterValueInitialize,
  ]);

  return (
    <GlobalContext.Provider
      value={{
        listproductfilter,
        setlistprodfil,
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
        subcate,
        setsubcate,
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
        allfiltervalue,
        setallfilterval,
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
