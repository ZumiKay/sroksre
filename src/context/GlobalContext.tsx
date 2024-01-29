"use client";
import dayjs, { Dayjs } from "dayjs";
import React, { useContext, useState } from "react";
import { Role } from "@prisma/client";
import { info } from "../app/severactions/actions";

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
}
export interface infovaluetype {
  qty: number;
  val: string;
}
export interface ProductInfo {
  id?: number;
  info_title: string;
  info_value: Array<string> | Array<infovaluetype>;
  info_type: string;
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
export interface ProductState {
  id?: number;
  name: string;
  price: number;
  description: string;
  stock: number;

  covers: productcoverstype[] | [];
  category: { parent_id: number; child_id: number };
  details: ProductInfo[] | [];
  discount?: {
    percent: string;
    newPrice: string;
  };
}
export interface FilterValue {
  page: number;
  category: {
    parent_id: number;
    child_id: number;
  };
  status: string;
  name: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  expiredate?: dayjs.Dayjs;
  promotionid?: number;
}

interface Listproductfilter {
  size: Array<string>;
  color: Array<string>;
  order?: string;
}
export const FiltervalueInitialize: FilterValue = {
  page: 1,
  category: {
    parent_id: 0,
    child_id: 0,
  },
  status: "",
  name: "",
  email: "",
};

export interface BannerState {
  id?: number;
  name: string;
  type: "banner" | "promotion";

  image: {
    url: string;
    name: string;
    type: string;
  };
  show?: boolean;
}
export interface UserState {
  id?: string;
  lastname?: string;
  password?: string;
  confirmpassword?: string;
  newpassword?: string;
  phonenumber?: string;
  firstname: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Userdatastate {
  firstname?: string;
  lastname?: string;
  email?: string;
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
    percent: string;
    newPrice: string;
    oldPrice: number;
  };
}
export interface PromotionState {
  id?: number;
  name: string;
  description: string;
  selectproduct: boolean;
  selectbanner: boolean;
  Products: Array<PromotionProductState>;
  expiredAt: Dayjs;
  banner_id?: number;

  banner?: BannerState;
  tempproduct?: number[];
  tempproductstate?: Array<PromotionProductState>;
  type?: string;
}

export type filterinventorytype =
  | "product"
  | "banner"
  | "promotion"
  | "usermanagement";

export interface Allrefstate {
  filterref: HTMLDivElement | null;
}

interface AllDataState {
  product: ProductState[] | [];
  banner: BannerState[] | [];
  promotion: PromotionState[] | [];
  category: CateogoryState[] | [];
  filteredData: ProductState[] | BannerState[] | PromotionState[] | [];
  user: UserState[] | [];
  tempbanner?: {
    id: number;
    show: boolean;
  }[];
  [x: string]: any;
}

type confirmmodaltype = {
  open: boolean;
  confirm: boolean;
  closecon: string;
  index?: number;
  type?: "product" | "banner" | "promotion" | "promotioncancel" | "user";
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
  alert: {
    open: boolean;
    text: string;
    action?: () => Promise<void> | void;
  };
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
}
export interface SubcategoriesState {
  id?: number;
  name: string;
}

export interface LoadingState {
  GET: boolean;
  POST: boolean;
  PUT: boolean;
  DELETE: boolean;
  IMAGE: any;
}
export interface Sessiontype {
  id?: string;
  email?: string;
  name?: string;
  image?: string;
  role?: "USER" | "ADMIN" | "EDITOR";
}

export interface ProductOrderType {
  id: number;
  quantity: number;
  details: Array<ProductInfo>;
  price: string;
}
export type OrderStatus =
  | "Unpaid"
  | "Paid"
  | "Preparing"
  | "Shipping"
  | "Shipped"
  | "Arrived";

export interface Ordertype {
  id?: string;
  products: Array<ProductOrderType>;
  status: OrderStatus;
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
  stock: 0,
  covers: [],
  category: {
    parent_id: 0,
    child_id: 0,
  },
  details: [],
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
  type: "banner",
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
  expiredAt: dayjs(),
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

export const Userinitialize: UserState = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmpassword: "",
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
  user: UserState;
  setuser: React.Dispatch<React.SetStateAction<UserState>>;
  listproductfilter: Listproductfilter;
  setlistprodfil: React.Dispatch<React.SetStateAction<Listproductfilter>>;
  listproductfilval: Listproductfilter;
  setproductfilval: React.Dispatch<React.SetStateAction<Listproductfilter>>;
  error: boolean;
  seterror: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [listproductfilter, setlistprodfil] = useState<Listproductfilter>({
    size: [],
    color: [],
  });
  const [listproductfilval, setproductfilval] = useState<Listproductfilter>({
    size: [],
    color: [],
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

export const SpecificAccess = (obj: Object): boolean => {
  return Object.values(obj).some((value) => value === true);
};
