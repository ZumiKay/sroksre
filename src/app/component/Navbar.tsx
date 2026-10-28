"use client";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEllipsisVertical,
  faWandMagicSparkles,
  faTrash,
  faBox,
  faFolder,
  faImage,
  faTags,
  faPenToSquare,
  faBoxesStacked,
  faTrashCan,
  faCircle,
  faArrowRight,
  faClock,
  faFire,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Logo from "../../../public/Image/Logo.svg";
import Menu from "../../../public/Image/Menu.svg";
import Search from "../../../public/Image/Search.svg";
import Cart from "../../../public/Image/cart.svg";
import Profile from "../../../public/Image/profile.svg";
import DefaultImage from "../../../public/Image/default.png";
import ActiveBell from "../../../public/Image/blackbell.svg";
import Bell from "../../../public/Image/whitebell.svg";
import { CSSProperties, forwardRef, memo, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AccountMenu, CartMenu } from "./SideMenu";
import Link from "next/link";
import {
  BannerInitialize,
  CateogoryState,
  Productinitailizestate,
  PromotionInitialize,
  Sessiontype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { errorToast, infoToast } from "./Loading";
import { useDataRefresh } from "@/src/hooks/useDataRefresh";
import { CheckedNotification } from "../severactions/notification_action";
import { Box, CircularProgress } from "@mui/material";
import CookieConsent from "react-cookie-consent";
import Homecontainermodal from "./HomePage/Modals";
import { AnimatePresence } from "framer-motion";
import SearchContainer from "./Modals/Search";
import { CloseVector } from "./Asset";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { useSocket } from "@/src/context/SocketContext";
import React from "react";
import { NotificationType, Usersessiontype } from "@/src/types/user.type";

export default function Navbar({
  session,
  initialCartCount = 0,
  initialNotificationCount = 0,
  loading = false,
}: {
  initialCartCount?: number;
  initialNotificationCount?: number;
  session: Usersessiontype | null;
  loading?: boolean;
}) {
  const { cart, setcart, carttotal, setcarttotal, setopenmodal, openmodal } = useGlobalContext();
  const [categories, setcategories] = useState(false);
  const [profile, setprofile] = useState(false);
  const [opennotification, setnotification] = useState(false);
  const [checkNotification, setchecknotify] = useState<number | undefined>(
    initialNotificationCount,
  );

  const { isTablet, isMobile } = useScreenSize();
  const socket = useSocket();

  const router = useRouter();
  const navref = useRef<any>(null);
  const notiref = useRef<any>(null);

  // Initialize cart total from server-side data
  useEffect(() => {
    if (initialCartCount && !carttotal) {
      setcarttotal(initialCartCount);
    }
  }, [initialCartCount]);

  // Use optimized data refresh hook for cart
  const { refresh: refreshCart } = useDataRefresh({
    onRefresh: (data) => setcarttotal(data),
    enabled: !!session && session.role !== "ADMIN",
    endpoint: "/api/order/cart?count=1",
  });

  // Poll for new admin notifications every 30 seconds
  useDataRefresh({
    onRefresh: (data: { id: number; checked: boolean }[]) => setchecknotify(data?.length ?? 0),
    enabled: !!session && session.role === "ADMIN",
    endpoint: "/api/users/notification?ty=check",
    interval: 30000,
  });

  // Expose getCartTotal for external components via context
  useEffect(() => {
    if (session && session.role !== "ADMIN") {
      // Store refresh function in global context if needed
      (window as any).__refreshCart = refreshCart;
    }
  }, [session, refreshCart]);

  useEffect(() => {
    if (session?.role === "ADMIN") {
      if (!socket) return;

      const handleNotification = (data: NotificationType) => {
        infoToast("New Notification");
        setchecknotify((prev) => (prev ?? 0) + 1);
      };

      socket.on("receiveNotification", handleNotification);
      return () => {
        socket.off("receiveNotification", handleNotification);
      };
    }
  }, [socket, session]);

  useEffect(() => {
    const handleEventClick = (e: globalThis.MouseEvent) => {
      if (
        notiref.current &&
        !notiref.current.contains(e.target as Node) &&
        navref.current &&
        !navref.current.contains(e.target as Node)
      ) {
        setnotification(false);
      }
    };
    window.addEventListener("click", handleEventClick, { passive: false });

    return () => {
      window.removeEventListener("click", handleEventClick);
    };
  }, []);

  return (
    <>
      <nav className="navbar__container sticky top-0 z-50 w-full h-15 bg-[#F3F3F3] flex flex-row justify-between items-center">
        {categories && <CategoriesContainer setopen={setcategories} />}

        <div className="first_section  w-1/2 h-full flex items-center pl-3">
          <Image
            className="menu_icon w-7.5 h-7.5 object-fill transition rounded-md"
            onClick={() => setcategories(!categories)}
            src={Menu}
            alt="menu"
            width={100}
            height={100}
            priority={true}
            style={categories ? { backgroundColor: "lightgray" } : {}}
          />

          <Image
            src={Search}
            alt="search"
            className="search w-10 h-10 object-contain hidden max-smallest_tablet:block transition hover:-translate-y-2"
            width={50}
            height={50}
            quality={50}
            onClick={() => setopenmodal((prev) => ({ ...prev, searchcon: true }))}
          />
        </div>
        <div className="second_section  w-full h-fit relative top-2 flex justify-center">
          <Image
            src={Logo}
            alt="logo"
            className="Logo w-25 h-12.5 max-small_phone:w-17.5 max-small_phone:[30px] object-contain grayscale"
            priority={true}
            onClick={() => router.push("/")}
          />
        </div>
        <div className="third_section  w-1/2 h-full flex flex-row gap-x-10 max-small_phone:gap-x-3 items-center justify-end pr-5 max-small_phone:pr-2">
          <Image
            src={Search}
            alt="search"
            className="search w-12.5 h-12.5 object-contain transition hover:-translate-y-2 max-smallest_tablet:hidden"
            width={50}
            height={50}
            quality={50}
            onClick={() => setopenmodal((prev) => ({ ...prev, searchcon: true }))}
          />

          {session && session.role !== "ADMIN" && (
            <div className="cart_container relative">
              <Image
                src={Cart}
                alt="cart"
                className="cart min-w-7.5 min-h-7.5 max-w-7.5 max-h-7.5 w-full h-full object-contain transition hover:-translate-y-2 max-small_phone:w-7.5 max-small_phone:h-7.5"
                width={50}
                height={50}
                onMouseEnter={() => setcart(true)}
              />
              <span className="text-[13px] w-5 h-5 grid place-content-center absolute -bottom-6 top-0 -right-3 bg-gray-500 text-white rounded-[50%]">
                {loading ? (
                  <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                ) : (
                  (carttotal ?? 0)
                )}
              </span>
            </div>
          )}

          {session?.role === "ADMIN" && (
            <>
              <div className="w-7.5 h-7.5 max-smallest_tablet:w-6.25 max-smallest_tablet:h-6.25 max-small_phone:w-6.25 max-small_phone:h-6.25 relative">
                <Image
                  ref={navref}
                  src={!opennotification ? Bell : ActiveBell}
                  alt="notification"
                  onClick={() => setnotification(!opennotification)}
                  width={30}
                  height={30}
                  className="bell min-w-7.5 min-h-7.5 max-smallest_tablet:min-w-6.25 max-smallest_tablet:min-h-6.25 max-small_phone:min-w-6.25 max-small_phone:min-h-6.25 object-fill transition-all active:bg-gray-200 active:shadow-xl rounded-xl"
                />

                {loading ? (
                  <span className="absolute top-0 -right-1 w-2.5 h-2.5 rounded-full bg-gray-400 animate-pulse"></span>
                ) : (
                  checkNotification !== 0 && (
                    <span className="absolute top-0 -right-1 w-2.5 h-2.5 rounded-2xl bg-red-500"></span>
                  )
                )}
              </div>
            </>
          )}

          <Image
            src={Profile}
            alt="profile"
            className="cart w-10 h-10 max-small_phone:w-8.75 max-small_phone:h-8.75 object-contain transition hover:-translate-y-2"
            onMouseEnter={() => session && setprofile(true)}
            onClick={() => !session && router.push("/account", { scroll: false })}
          />
        </div>

        <AnimatePresence>{profile && <AccountMenu setProfile={setprofile} />}</AnimatePresence>

        {openmodal?.homecontainer && (
          <Homecontainermodal setprofile={setprofile} isPhone={isMobile} />
        )}

        <AnimatePresence>
          {openmodal?.searchcon && <SearchContainer isMobile={isMobile} />}
        </AnimatePresence>

        {cart && <CartMenu img={DefaultImage} setcart={setcart} setcarttotal={setcarttotal} />}
        {opennotification && (
          <NotificationMenu close={() => setnotification(false)} ref={notiref} />
        )}
      </nav>
      <CookieConsent
        location="bottom"
        buttonText="I Understand"
        cookieName="AllowCookie"
        style={{ background: "lightgray", color: "black" }}
        buttonStyle={{
          color: "white",
          fontSize: "13px",
          backgroundColor: "#495464",
          borderRadius: "10px",
        }}
        expires={150}
      >
        This website uses cookies to enhance the user experience.{" "}
        <Link href={"/privacyandpolicy"} style={{ fontSize: "10px", textDecoration: "underline" }}>
          See Privacy And Policy Page
        </Link>
      </CookieConsent>
    </>
  );
}
const CategoriesContainer = (props: { setopen: React.Dispatch<React.SetStateAction<boolean>> }) => {
  const [allcate, setallcate] = useState<Array<CateogoryState>>();
  const [loading, setloading] = useState(false);
  const { isMobile } = useScreenSize();
  const router = useRouter();
  const { setopen } = props;

  const fetchcate = useCallback(async () => {
    setloading(true);
    const request = await ApiRequest("/api/categories", undefined, "GET");
    if (request.success) {
      setallcate(request.data);
    }
    setloading(false);
  }, []);

  useEffect(() => {
    fetchcate();
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setopen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKey);
    };
  }, [fetchcate, setopen]);

  const go = (url: string) => {
    router.push(url);
    router.refresh();
    if (isMobile) setopen(false);
  };

  // Auto-filled lists (popular, latest) show as quick links; the rest as columns
  const quickLinks = allcate?.filter((i) => i.type === "latest" || i.type === "popular") ?? [];
  const columns = allcate?.filter((i) => i.type !== "latest" && i.type !== "popular") ?? [];

  return (
    <div
      onMouseLeave={() => props.setopen(false)}
      className="categories__container absolute top-full left-0 z-99 w-full max-h-[calc(100vh-3.75rem)] overflow-y-auto overflow-x-hidden bg-white border-t border-slate-200 shadow-xl"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Shop by category
          </h2>
          <button
            type="button"
            onClick={() => props.setopen(false)}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Close categories"
          >
            <CloseVector width="20px" height="20px" />
          </button>
        </div>

        {loading ? (
          <>
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="w-32 h-10 rounded-full bg-slate-100 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="flex flex-col gap-3 animate-pulse">
                  <div className="w-2/3 h-5 bg-slate-200 rounded-sm" />
                  <div className="w-full h-4 bg-slate-100 rounded-sm" />
                  <div className="w-4/5 h-4 bg-slate-100 rounded-sm" />
                  <div className="w-3/5 h-4 bg-slate-100 rounded-sm" />
                </div>
              ))}
            </div>
          </>
        ) : !allcate || allcate.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <FontAwesomeIcon icon={faLayerGroup} className="text-xl" />
            </span>
            <h3 className="text-base font-semibold text-slate-700">No categories yet</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Check back soon, or browse everything we have.
            </p>
            <button
              type="button"
              onClick={() => go("/product?all=1")}
              className="mt-1 h-10 px-5 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              Shop all products
            </button>
          </div>
        ) : (
          <>
            {/* Quick links */}
            <div className="flex flex-wrap gap-2">
              <QuickLink
                icon={faLayerGroup}
                label="All products"
                onClick={() => go("/product?all=1")}
                primary
              />
              {quickLinks.map((item) => (
                <QuickLink
                  key={item.id}
                  icon={item.type === "popular" ? faFire : faClock}
                  label={item.name}
                  onClick={() => go(`/product?pid=${item.id}`)}
                />
              ))}
            </div>

            {/* Category columns */}
            {columns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-8 max-small_phone:grid-cols-1">
                {columns.map((i) => {
                  const subs = i.subcategories.filter((s) => !s.isExpired);
                  return (
                    <div key={i.id} className="category flex flex-col gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          go(`/product?${i.type === "normal" ? `pid=${i.id}` : `ppid=${i.id}`}`)
                        }
                        className="category_header group flex items-center gap-2 text-left pb-2 border-b border-slate-200"
                      >
                        <span className="text-sm font-bold text-slate-900 group-hover:text-slate-600 wrap-break-word">
                          {i.name}
                        </span>
                        {i.type === "sale" && (
                          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm border border-red-200 text-red-600">
                            Sale
                          </span>
                        )}
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="ml-auto text-[10px] text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition"
                        />
                      </button>
                      {subs.length > 0 && (
                        <ul className="category_subheader flex flex-col">
                          {subs.map((sub) => (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  go(
                                    `/product?pid=${i.id}${
                                      sub.type === "normal"
                                        ? `&cid=${sub.id}`
                                        : `&promoid=${sub.pid}`
                                    }`,
                                  )
                                }
                                className="subcategory w-full text-left text-sm text-slate-600 py-1.5 hover:text-slate-900 hover:underline underline-offset-4 transition-colors wrap-break-word"
                              >
                                {sub.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function QuickLink({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold border transition-colors ${
        primary
          ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
          : "bg-white text-slate-700 border-slate-300 hover:border-slate-900 hover:text-slate-900"
      }`}
    >
      <FontAwesomeIcon icon={icon} className="text-xs" />
      {label}
    </button>
  );
}
export function DashboordNavBar({ session }: { session?: Sessiontype }) {
  const route = usePathname();

  return (
    <nav className="dashboardNav__container flex flex-row w-full items-center gap-2 sm:gap-4 overflow-x-auto px-3 sm:px-6 bg-[#F3F3F3] h-16 sm:h-17.5 sm:justify-evenly">
      <Link href={"/dashboard"} className="shrink-0">
        <h1
          className={`navlink ${
            route === "/dashboard" ? "activelink" : ""
          } text-sm sm:text-base font-bold bg-white px-4 py-2 transition text-center rounded-md whitespace-nowrap`}
        >
          My Profile
        </h1>
      </Link>
      <Link href={"/dashboard/order"} className="shrink-0">
        <h1
          className={`navlink ${
            route === "/dashboard/order" ? "activelink" : ""
          } text-sm sm:text-base font-bold bg-white px-4 py-2 transition text-center rounded-md whitespace-nowrap`}
        >
          {session?.role === "ADMIN" ? "Order Management" : "My Order"}
        </h1>
      </Link>
      <Link hidden={session?.role !== "ADMIN"} href={"/dashboard/inventory"} className="shrink-0">
        <h1
          className={`navlink ${
            route === "/dashboard/inventory" ? "activelink" : ""
          } text-sm sm:text-base font-bold bg-white px-4 py-2 transition text-center rounded-md whitespace-nowrap`}
        >
          Inventory
        </h1>
      </Link>
      <Link
        hidden={session?.role !== "ADMIN"}
        href={"/dashboard/usermanagement"}
        className="shrink-0"
      >
        <h1
          className={`navlink ${
            route === "/dashboard/usermanagement" ? "activelink" : ""
          } text-sm sm:text-base font-bold bg-white px-4 py-2 transition text-center rounded-md whitespace-nowrap`}
        >
          User Management
        </h1>
      </Link>
    </nav>
  );
}
interface Subinventorymenuprops {
  data: {
    value: string;
    opencon: string;
  }[];
  open?: string;
  type?: "product" | "banner" | "promotion";
  index?: number;
  style?: CSSProperties;
  stock?: number;
  stocktype?: string;
  stockaction?: () => void;
  reloaddata?: () => void;
}
enum actiontype {
  EDIT = "Edit",
  STOCK = "Stock",
  DELETE = "DELETE",
}

const DROPDOWN_CLASSNAMES = {
  base: "before:bg-white/10",
  content: "p-1.5 border border-gray-200 bg-white/95 backdrop-blur-xl shadow-xl rounded-xl",
};

const ITEM_CLASSES = {
  base: [
    "rounded-lg",
    "text-xs md:text-sm",
    "transition-all",
    "duration-200",
    "data-[hover=true]:bg-linear-to-r",
    "data-[hover=true]:from-indigo-50",
    "data-[hover=true]:via-purple-50",
    "data-[hover=true]:to-blue-50",
    "data-[hover=true]:text-indigo-700",
    "data-[hover=true]:scale-[1.02]",
    "data-[hover=true]:shadow-xs",
    "py-2.5 md:py-3",
    "px-3 md:px-4",
    "my-0.5",
    "cursor-pointer",
  ],
};

const TRIGGER_STYLE_TYPE: CSSProperties = { minWidth: "20px" };

const BUTTON_CLASS_TYPE =
  "group relative overflow-hidden font-bold transition-all duration-300 bg-linear-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-700 border-2 border-gray-300 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 min-w-9 md:min-w-11 h-9 md:h-11 px-1.5 md:px-2.5 shadow-md hover:scale-105 active:scale-95 rounded-xl md:rounded-2xl before:absolute before:inset-0 before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700";

const BUTTON_CLASS_CREATE =
  "group relative overflow-hidden font-bold transition-all duration-300 bg-linear-to-br from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 min-w-27.5 md:min-w-35 h-9 md:h-11 text-xs md:text-sm rounded-xl md:rounded-2xl before:absolute before:inset-0 before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700";

const ICON_MAP: Record<string, any> = {
  Product: faBox,
  Category: faFolder,
  Banner: faImage,
  Promotion: faTags,
  Edit: faPenToSquare,
  Stock: faBoxesStacked,
  DELETE: faTrashCan,
};

const COLOR_MAP: Record<string, string> = {
  Product: "text-blue-600",
  Category: "text-purple-600",
  Banner: "text-green-600",
  Promotion: "text-orange-600",
  Edit: "text-blue-600",
  Stock: "text-emerald-600",
  DELETE: "text-red-600",
};

export const SubInventoryMenu = memo((props: Subinventorymenuprops) => {
  const { setopenmodal, setglobalindex, setproduct, setbanner, setpromotion } = useGlobalContext();

  const handleClick = useCallback(
    (obj: { value: string; opencon: string }) => {
      const index = props.index as number;

      if (props.type === "product" || props.type === "banner" || props.type === "promotion") {
        if (obj.value === actiontype.EDIT) {
          setglobalindex((previndex) => ({
            ...previndex,
            [props.type === "product"
              ? "producteditindex"
              : props.type === "banner"
                ? "bannereditindex"
                : "promotioneditindex"]: index,
          }));
          setopenmodal((prev) => ({ ...prev, [obj.opencon]: true }));
        } else if (obj.value === actiontype.STOCK && props.stockaction) {
          props.stocktype?.includes("stock") &&
            setproduct((prev) => ({ ...prev, stock: props.stock, id: index }));
          props.stockaction();
        } else {
          setopenmodal((prev) => ({
            ...prev,
            confirmmodal: {
              ...prev.confirmmodal,
              index: index,
              type: props.type,
              open: true,
              onDelete: () => {
                props.reloaddata && props.reloaddata();
              },
            },
          }));
        }
      } else {
        if (obj.opencon === "createProduct") {
          setproduct(Productinitailizestate);
          setglobalindex((prev) => ({ ...prev, producteditindex: -1 }));
        } else if (obj.opencon === "createBanner") {
          setglobalindex((prev) => ({ ...prev, bannereditindex: -1 }));
          setbanner(BannerInitialize);
        } else if (obj.opencon === "createPromotion") {
          setpromotion(PromotionInitialize);
          setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
        }
        setopenmodal((prev) => ({ ...prev, [obj.opencon]: true }));
      }
    },
    [
      props.index,
      props.type,
      props.stock,
      props.stocktype,
      props.stockaction,
      props.reloaddata,
      setglobalindex,
      setopenmodal,
      setproduct,
      setbanner,
      setpromotion,
    ],
  );
  return (
    <Dropdown classNames={DROPDOWN_CLASSNAMES} disableAnimation>
      <DropdownTrigger>
        <Button
          color={props.type ? "default" : "success"}
          variant="solid"
          endContent={
            !props.type ? (
              <FontAwesomeIcon
                icon={faPlus}
                className="text-xs md:text-sm font-bold text-white drop-shadow-xs"
              />
            ) : undefined
          }
          style={props.type ? TRIGGER_STYLE_TYPE : undefined}
          className={props.type ? BUTTON_CLASS_TYPE : BUTTON_CLASS_CREATE}
        >
          {props.type ? (
            <FontAwesomeIcon
              icon={faEllipsisVertical}
              className="text-lg md:text-xl text-gray-600 group-hover:text-indigo-600 transition-all duration-200 group-hover:scale-110"
            />
          ) : (
            <div className="flex items-center gap-2 relative z-10">
              <FontAwesomeIcon
                icon={faWandMagicSparkles}
                className="text-[10px] md:text-xs animate-pulse"
              />
              <span className="hidden md:inline font-extrabold tracking-wide uppercase text-xs">
                Action
              </span>
              <span className="md:hidden font-extrabold tracking-wide uppercase text-xs">New</span>
            </div>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Dynamic Actions"
        items={props.data}
        className="min-w-40 md:min-w-50"
        itemClasses={ITEM_CLASSES}
      >
        {(item) => (
          <DropdownItem
            key={item.opencon}
            onClick={() => handleClick(item)}
            textValue={item.value}
            startContent={
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br transition-all duration-200">
                <FontAwesomeIcon
                  icon={ICON_MAP[item.value] ?? faCircle}
                  className={`text-sm md:text-base ${COLOR_MAP[item.value] ?? "text-gray-500"}`}
                />
              </div>
            }
            className={`${
              item.value === "DELETE"
                ? "text-red-600 data-[hover=true]:bg-linear-to-r data-[hover=true]:from-red-50 data-[hover=true]:via-rose-50 data-[hover=true]:to-pink-50 data-[hover=true]:text-red-700"
                : ""
            }`}
          >
            <span className="font-semibold tracking-wide">{item.value}</span>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
});

SubInventoryMenu.displayName = "SubInventoryMenu";

export const NotificationMenu = forwardRef(
  (
    {
      notification,
      close,
    }: {
      notification?: NotificationType[];
      close: () => void;
    },
    ref,
  ) => {
    const [notifydata, setnotifydata] = useState<NotificationType[] | undefined>(undefined);

    const [loading, setloading] = useState(false);
    const [page, setPage] = useState(1);
    const [loadmore, setloadmore] = useState(true);
    const router = useRouter();
    const notioffset = 3;
    const checkedIds = useRef<Set<number>>(new Set());

    useEffect(() => {
      const getAllNotification = async () => {
        setloading(true);
        const result = await ApiRequest(
          `/api/users/notification?ty=detail&p=${page}&lt=${notioffset}`,
          undefined,
          "GET",
        );
        if (result.success) {
          if (result.data?.length === 0) {
            setloadmore(false);
          }
          setnotifydata((prev) => {
            const incoming: NotificationType[] = result.data ?? [];
            if (page === 1) {
              return notification ? [...incoming, ...notification] : incoming;
            }
            return prev ? [...prev, ...incoming] : incoming;
          });
        }
        setloading(false);
      };
      getAllNotification();
    }, [page]);

    useEffect(() => {
      document.body.style.overflowY = "hidden";
      return () => {
        document.body.style.overflowY = "auto";
      };
    }, []);

    const handleScroll = () => {
      const containerRef = ref as any;

      if (!containerRef.current || loading || !loadmore) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setPage((prev) => prev + 1);
      }
    };

    const handleChecked = async (id: number) => {
      if (checkedIds.current.has(id)) return;
      checkedIds.current.add(id);
      setnotifydata((prev) => prev?.map((n) => (n.id === id ? { ...n, checked: true } : n)));
      const checkednotify = CheckedNotification.bind(null, id);
      await checkednotify();
      router.refresh();
    };

    const handleDelete = async (id: number) => {
      const makereq = await ApiRequest("/api/users/notification", undefined, "DELETE", "JSON", {
        id,
      });
      if (makereq.success) {
        checkedIds.current.delete(id);
        setnotifydata((prev) => prev?.filter((i) => i.id !== id));
      } else {
        errorToast(makereq.message as string);
      }
    };

    return (
      <aside
        ref={ref as any}
        onScroll={() => {
          handleScroll();
        }}
        className="notification fixed sm:absolute inset-x-2 top-16 sm:inset-auto sm:right-2 sm:top-14 sm:w-87.5 max-h-[85vh] sm:h-100 z-150 flex flex-col gap-y-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-x-hidden overflow-y-auto"
      >
        <div
          onClick={() => close()}
          className="w-fit h-fit sm:hidden absolute top-2.5 right-2.5 z-50 cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <CloseVector width="24px" height="24px" />
        </div>
        <h3 className="font-bold bg-white text-lg w-full sticky top-0 z-10 text-left p-3 border-b border-gray-200">
          Notifications
        </h3>

        <div className="w-full h-full flex flex-col gap-y-3 relative px-2 pb-3">
          {!notifydata?.length
            ? !loading && (
                <h3 className="font-normal text-sm w-full h-fit text-center py-6 text-gray-500">
                  No Notification
                </h3>
              )
            : notifydata.map((n) => (
                <div key={n.id} className="w-full relative group">
                  <Link href={n.link ?? ""}>
                    <div
                      onTouchStart={() => handleChecked(n.id as number)}
                      onMouseEnter={() => handleChecked(n.id as number)}
                      className="notification_item relative w-full h-fit flex flex-col gap-y-2 p-3 rounded-lg transition cursor-pointer hover:bg-gray-50 border border-gray-100 pr-9"
                    >
                      {!n.checked && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute top-3 right-8"></span>
                      )}
                      <h3 className="font-bold text-base text-gray-900">{n.type}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{n.content}</p>
                      <p className="text-xs text-gray-400">{n.createdAt}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id as number)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition duration-200 cursor-pointer p-1"
                    aria-label="Delete notification"
                  >
                    <FontAwesomeIcon icon={faTrash} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              ))}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", height: "50px" }}>
              <CircularProgress />
            </Box>
          )}
        </div>
      </aside>
    );
  },
);
NotificationMenu.displayName = "NotificationMenu";
