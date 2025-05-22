import { BannerType } from "../app/severactions/actions";
import { InventoryInfoType } from "../app/dashboard/inventory/inventory.type";
import { RGBColor } from "react-color";
import { Dispatch, SetStateAction } from "react";
import { Address } from "@prisma/client";
import { Stepindicatortype } from "./Checkoutcontext";
import { StaticImageData } from "next/image";
import ProfileIcon from "@/public/Image/profile.png";
import WishListIcon from "@/public/Image/bookmark.png";
import LockIcon from "@/public/Image/lock.png";
import { Ordertype } from "./OrderContext";

type Role = "ADMIN" | "USER" | "EDITOR";
export type InventoryPage =
  | "product"
  | "banner"
  | "promotion"
  | "usermanagement"
  | "ordermanagement";
export type FiltermenuType =
  | "product"
  | "banner"
  | "promotion"
  | "usermanagement"
  | "listproduct";
export type ActionState = "edit" | "delete" | "stock";
export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";
export type RequetDatatype = "JSON" | "FILE";
export type Variantcontainertype =
  | "variant"
  | "stock"
  | "type"
  | "info"
  | "stockinfo"
  | "none";
export type Typeofpolicy = "policy" | "question" | "paragraph";

export type Aspect_Ratio_Type = "16";

export const categorytype = {
  normal: "normal",
  sale: "sale",
  popular: "popular",
  latest: "latest",
};

export const BannerTypeSelect = [
  { label: "Normal", value: "normal" },
  { label: "Product", value: "product" },
  { label: "Category", value: "category" },
];

export const BannerSize = [
  { label: "Small", value: "small" },
  { label: "Normal", value: "normal" },
];

export const containerTypeOptions = {
  slide: "slide",
  category: "category",
  scrollable: "scrollable",
  banner: "banner",
};

export interface ProfileSideBarItemsType extends SelectType {
  icon: StaticImageData;
}
export const ProfileSideBarItems: Readonly<Array<ProfileSideBarItemsType>> =
  Object.freeze([
    { label: "Profile", value: "profile", icon: ProfileIcon },
    { label: "Wishlist", value: "wishlist", icon: WishListIcon },
    { label: "Security", value: "security", icon: LockIcon },
  ]);

export type BannerSizeType = "small" | "normal";

export type Categorytype = keyof typeof categorytype;

export type ScrollableTypeValueType = "popular" | "new" | "sale" | "custom";

export interface ActionReturnType<t = string> {
  success: boolean;
  message?: string;
  data?: t;
  error?: string;
  [x: string]: boolean | string | number | t | undefined;
}

export interface SelectType<t = string> {
  label: string;
  value: number | t;
  color?: string;
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
  phonenumber?: string;
}
export interface infovaluetype {
  qty: number;
  val: string;
}
export interface ProductInfo {
  id?: number;
  info_title: string;
  info_value: Array<string> | Array<infovaluetype>;
  info_type: InventoryInfoType;
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
  [key: string]: unknown;
}

export interface SubStockType {
  id?: number;
  qty: number;
  variant_val: string[];
}
export interface Stocktype {
  id?: number;
  qty: number;
  Stockvalue: SubStockType[];
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

export interface ProductCategoriesType {
  id: number;
  name?: string;
}

export interface DiscountpriceType {
  percent: number;
  newprice: string;
}
export interface FullCategoryType {
  parent: ProductCategoriesType;
  child?: ProductCategoriesType;
}

export interface ProductState {
  id?: number;
  name: string;
  price: number;
  description: string;
  stocktype: string;
  covers: ImageDatatype[] | [];
  category: FullCategoryType;
  details: ProductInfo[] | [];
  stock?: number;
  variantcount?: number;
  variants?: Array<Varianttype>;
  varaintstock?: Array<Stocktype>;
  lowstock?: boolean;
  incart?: boolean;
  promotion_id?: number;
  discount?: DiscountpriceType;
  relatedproductid?: Array<number>;
  relatedproduct?: Array<Relatedproducttype>;
  amount_sold?: number;
  amount_incart?: number;
  amount_wishlist?: number;
  createdAt?: Date;
}
export interface FilterValueType {
  parentcate?: string;
  childcate?: string;
  categories?: {
    parentcate: ProductCategoriesType;
    childcate?: ProductCategoriesType;
  };
  status?: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  expiredate?: string;
  promotionid?: number;
  promotiononly?: boolean;
  bannertype?: string;
  bannersize?: string;
  search?: string;
  expired?: string;
  promoids?: string[];
}

export interface Listproductfilter {
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

export type ImageDatatype = {
  id?: number;
  url: string;
  name: string;
  type?: string;
  isSave?: boolean;
  temp?: boolean;
  productId?: number;
  bannerId?: number;
  userId?: number;
};

export interface BannerState {
  id?: number;
  name: string;
  type: BannerType;
  size: string;
  Image: ImageDatatype;
  linktype?: string;
  parentcate?: SelectType;
  childcate?: SelectType;
  selectedproduct?: SelectType[];
  selectedpromotion?: SelectType;
  link?: string;
}

export interface UserState {
  id?: number;
  username: string;
  firstname: string;
  lastname?: string;
  password?: string;
  confirmpassword?: string;
  newpassword?: string;
  phonenumber?: string;
  addresses?: Address[];
  role?: Role;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  code?: string;
  isVerified?: boolean;
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
  totalitems?: number;
}

export interface PromotionProductState {
  id: number;
  discount?: DiscountpriceType;
}
export interface PromotionState {
  id?: number;
  name: string;
  description: string;
  selectproduct: boolean;
  selectbanner: boolean;
  products?: Array<PromotionProductState>;
  expireAt?: string;
  banner_id?: number;
  banner?: BannerState;
  type?: string;
  isExpired?: boolean;
  autocate?: boolean;
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

export interface AllDataState {
  product?: ProductState[];
  banner?: BannerState[];
  promotion?: PromotionState[];
  category?: CateogoryState[];
  filteredData?: ProductState[] | BannerState[] | PromotionState[];
  user?: UserState[];
  orders?: Ordertype[];
  tempbanner?: {
    id: number;
    show: boolean;
  }[];
  [x: string]: unknown;
}

export interface Usersessiontype {
  sub: number;
  id: number;
  username: string;
  role: Role;
  session_id: string;
}

export type confirmmodaltype = {
  open: boolean;
  confirm?: boolean;
  closecon?: string;
  index?: number | string;
  Warn?: string;
  type?:
    | "product"
    | "banner"
    | "promotion"
    | "promotioncancel"
    | "user"
    | "userinfo"
    | "ordermanagement";
  onDelete?: () => void;
  onAsyncDelete?: () => Promise<void>;
};

type alerttype = {
  open: boolean;
  text: string;
  action?: () => Promise<void> | void;
};
export interface OpenModalState {
  createProduct?: boolean;
  createCategory?: boolean;
  productdetail?: boolean;
  createBanner?: boolean;
  createPromotion?: boolean;
  createUser?: boolean;
  updatestock?: boolean;
  addsubcategory?: boolean;
  subcreatemenu_ivt?: boolean;
  subeditmenu_ivt?: boolean;
  subeditmenu_banner?: boolean;
  imageupload?: boolean;
  filteroption?: boolean;
  addproductvariant?: boolean;
  confirmmodal?: confirmmodaltype;
  discount?: boolean;
  loaded?: boolean;
  managebanner?: boolean;
  editprofile?: boolean;
  editvariantstock?: boolean;
  editsize?: boolean;
  alert?: alerttype;
  orderdetail?: boolean;
  orderlaert?: boolean;
  orderactionmodal?: boolean;
  orderproductdetailmodal?: boolean;
  exportoption?: boolean;
  policymodal?: boolean;
  policyshowtype?: boolean;
  mangageHomeItem?: boolean;
  userdetail?: boolean;
  showproducts?: boolean;
  showbanner?: boolean;
  [key: string]: boolean | confirmmodaltype | alerttype | undefined;
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
  userId?: number;
  orderId?: string;
}

export type RangeType = {
  start: string;
  end: string;
};

export interface CateogoryState {
  id?: number;
  name: string;
  description?: string;
  childid?: number[];
  subcategories?: Array<SubcategoriesState>;
  type?: Categorytype;
  daterange?: RangeType;
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

  [x: string]: boolean;
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

export interface Colortype {
  hex: string;
  rgb: RGBColor;
}
export const colorPalette: Colortype = {
  hex: "#f5f5f5",
  rgb: {
    r: 245,
    g: 245,
    b: 245,
    a: 1,
  },
};

export interface ApiRequestHookProps {
  url: string;
  method: RequestMethod;
  setloading?: Dispatch<SetStateAction<LoadingState>>;
  data?: unknown;
  datatype?: RequetDatatype;
  revalidate?: string;
}

export interface InfiniteScrollReturnType {
  items: SelectType[];
  hasMore?: boolean;
}

export interface SearchAndSelectReturnType {
  items: SelectType[];
  hasMore?: boolean;
  search?: string;
}

//Checkout

export const STEPS_INITIAL: ReadonlyArray<Stepindicatortype> = [
  {
    step: 1,
    title: "Summary",
    active: false,
  },
  {
    step: 2,
    title: "Fill in info",
    active: false,
  },
  {
    step: 3,
    title: "Payment",
    active: false,
  },
  {
    step: 4,
    title: "Complete",
    noline: true,
    active: false,
  },
] as const;

export type ContainerType = keyof typeof containerTypeOptions;

export interface Homeitemtype {
  id?: number;
  idx: number;
  name: string;
  type: ContainerType;
  items?: Array<ContainerItemType>;
  scrollabletype?: ScrollableTypeValueType;
  amountofitem?: number;
  daterange?: RangeType;
  createAt?: Date;
  updateAt: Date;
}

export interface BannersType {
  id: number;
  name: string;
  type: "normal" | "small";
  image: ImageDatatype;
}

export interface ContainerItemCardType {
  id: number;
  name: string;
  img: string;
}

export interface ContainerItemType {
  id?: number;
  homecontainerId?: number;
  banner_id?: number;
  product_id?: number;
  item?: ContainerItemCardType;
}

export interface Daterangetype {
  start: string;
  end: string;
}

export interface Containertype {
  id?: number;
  perrow?: number;
  amountofitem?: number;
  scrollabletype?: ScrollableTypeValueType;
  daterange?: Daterangetype;
  idx: number;
  name: string;
  type: ContainerType | "";
  items: number[];
}

export interface HomeContainerItemType {
  id: number | string;
  name: string;
  img?: Array<ImageDatatype>;
}
