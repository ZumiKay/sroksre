"use client";
import dayjs, { Dayjs } from "dayjs";
import React, { useContext, useState } from "react";

export interface ProductInfo {
  id?: number;
  info_title: string;
  info_value: string[];
  info_type: string;
}

export const DefaultSize = ["S", "M", "L", "XL"];

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
  expiredate?: string;
}
export const FiltervalueInitialize: FilterValue = {
  page: 1,
  category: {
    parent_id: 0,
    child_id: 0,
  },
  status: "",
  name: "",
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
  products: Array<PromotionProductState>;
  expiredAt: Dayjs;
  banner_id?: number;

  banner?: BannerState;
  tempproduct?: number[];
}

export type filterinventorytype = "product" | "banner" | "promotion";

interface AllDataState {
  product: ProductState[] | [];
  banner: BannerState[] | [];
  promotion: PromotionState[] | [];
  category: CateogoryState[] | [];
  filteredData: ProductState[] | BannerState[] | PromotionState[] | [];
}

type confirmmodaltype = {
  open: boolean;
  confirm: boolean;
  closecon: string;
  index?: number;
  type?: "product" | "banner" | "promotion" | "promotioncancel";
};
interface OpenModalState {
  createProduct: boolean;
  createCategory: boolean;
  productdetail: boolean;
  createBanner: boolean;
  createPromotion: boolean;
  updatestock: boolean;
  addsubcategory: boolean;
  subcreatemenu_ivt: boolean;
  subeditmenu_ivt: boolean;
  subeditmenu_banner: boolean;
  imageupload: boolean;
  filteroption: boolean;
  confirmmodal: confirmmodaltype;
  discount: boolean;
  toasted: boolean;
  managebanner: boolean;
}

interface GlobalIndexState {
  productdetailindex: number;
  productcovereditindex: number;
  producteditindex: number;
  bannereditindex: number;
  categoryeditindex: number[];
  promotioneditindex: number;
  promotionproductedit: number;
}

export interface AllFilterValueState {
  page: "product" | "banner" | "promotion";
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

//Initail State
//

const OpenmodalinitialState: OpenModalState = {
  createProduct: false,
  createCategory: false,
  createBanner: false,
  createPromotion: false,
  productdetail: false,
  addsubcategory: false,
  subcreatemenu_ivt: false,
  subeditmenu_ivt: false,
  subeditmenu_banner: false,
  updatestock: false,
  imageupload: false,
  filteroption: false,
  discount: false,
  toasted: false,
  managebanner: false,
  confirmmodal: {
    open: false,
    confirm: true,
    closecon: "",
  },
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
  products: [PromotionProductInitialize],
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
};
const LoadingStateInitialized: LoadingState = {
  GET: false,
  POST: false,
  PUT: false,
  DELETE: false,
  IMAGE: {},
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
  inventoryfilter: filterinventorytype;
  setinventoryfilter: React.Dispatch<React.SetStateAction<filterinventorytype>>;
  allfiltervalue: Array<AllFilterValueState>;
  setallfilterval: React.Dispatch<
    React.SetStateAction<Array<AllFilterValueState>>
  >;
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
  const [inventoryfilter, setinventoryfilter] =
    useState<filterinventorytype>("product");
  const [allfiltervalue, setallfilterval] = useState<AllFilterValueState[]>([
    AllFilterValueInitialize,
  ]);

  return (
    <GlobalContext.Provider
      value={{
        promotion,
        setpromotion,
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
        inventoryfilter,
        setinventoryfilter,
        allfiltervalue,
        setallfilterval,
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
  | "addsubcategory";
export const SaveCheck = (
  confirm: boolean,
  closecon: closecontype,
  openmodal: OpenModalState,
  open?: boolean,
  deletecallback?: any,
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
