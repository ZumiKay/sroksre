"use client";

import React, { useContext, useState } from "react";

import { Ordertype, Productordertype } from "./OrderContext";
import {
  AllDataState,
  AllFilterValueState,
  Allrefstate,
  BannerState,
  CateogoryState,
  filterinventorytype,
  FiltervalueInitialize,
  GlobalIndexState,
  ItemLength,
  Listproductfilter,
  LoadingState,
  OpenModalState,
  ProductState,
  PromotionProductState,
  PromotionState,
  SubcategoriesState,
  userdata,
  Userdatastate,
} from "./GlobalType.type";

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
  category: {
    parent: { id: 0, name: "" },
  },
  stock: 0,
  variantcount: 0,
  covers: [],
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
};

export const Userinitialize: userdata = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmpassword: "",
  recapcha: null,
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
  productorderdetail: Productordertype;
  setproductorderdetail: React.Dispatch<React.SetStateAction<Productordertype>>;
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
  const [openmodal, setopenmodal] = useState<OpenModalState>({});
  const [category, setcategory] = useState(CateogoryInitailizestate);
  const [subcate, setsubcate] = useState<SubcategoriesState[]>([]);
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
        productorderdetail,
        setproductorderdetail,
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
