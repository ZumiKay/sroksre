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
} from "@fortawesome/free-solid-svg-icons";
import Logo from "../../../public/Image/Logo.svg";
import Menu from "../../../public/Image/Menu.svg";
import Search from "../../../public/Image/Search.svg";
import Cart from "../../../public/Image/cart.svg";
import Profile from "../../../public/Image/profile.svg";
import DefaultImage from "../../../public/Image/default.png";
import ActiveBell from "../../../public/Image/blackbell.svg";
import Bell from "../../../public/Image/whitebell.svg";
import {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { errorToast } from "./Loading";
import { useDataRefresh } from "@/src/hooks/useDataRefresh";
import { CheckedNotification } from "../severactions/notification_action";
import { Box, CircularProgress } from "@mui/material";
import CookieConsent from "react-cookie-consent";
import Homecontainermodal from "./HomePage/Modals";
import { AnimatePresence } from "framer-motion";
import SearchContainer from "./Modals/Search";
import { CloseVector } from "./Asset";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
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
  const { cart, setcart, carttotal, setcarttotal, setopenmodal, openmodal } =
    useGlobalContext();
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

  // Expose getCartTotal for external components via context
  useEffect(() => {
    if (session && session.role !== "ADMIN") {
      // Store refresh function in global context if needed
      (window as any).__refreshCart = refreshCart;
    }
  }, [session, refreshCart]);

  // useEffect(() => {
  //   if (session?.role === "ADMIN") {
  //     if (!socket) return;

  //     const handleNotification = (data: NotificationType) => {
  //       infoToast("New Notification");
  //       setchecknotify(1);
  //       // Handle the notification (e.g., update state, show a toast, etc.)
  //     };

  //     socket.on("receiveNotification", handleNotification);
  //     return () => {
  //       socket.off("receiveNotification", handleNotification);
  //     };
  //   }
  // }, [socket, session]);

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
      <nav className="navbar__container sticky top-0 z-50 w-full h-15 bg-[#F3F3F3] flex flex-row justify-between item-center">
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
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, searchcon: true }))
            }
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
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, searchcon: true }))
            }
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
            onClick={() =>
              !session && router.push("/account", { scroll: false })
            }
          />
        </div>

        <AnimatePresence>
          {profile && <AccountMenu setProfile={setprofile} />}
        </AnimatePresence>

        {openmodal?.homecontainer && (
          <Homecontainermodal
            setprofile={setprofile}
            isTablet={isTablet}
            isPhone={isMobile}
          />
        )}

        <AnimatePresence>
          {openmodal?.searchcon && <SearchContainer isMobile={isMobile} />}
        </AnimatePresence>

        {cart && (
          <CartMenu
            img={DefaultImage}
            setcart={setcart}
            setcarttotal={setcarttotal}
          />
        )}
        {opennotification && (
          <NotificationMenu
            close={() => setnotification(false)}
            ref={notiref}
          />
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
        <Link
          href={"/privacyandpolicy"}
          style={{ fontSize: "10px", textDecoration: "underline" }}
        >
          See Privacy And Policy Page
        </Link>
      </CookieConsent>
    </>
  );
}
const CategoriesContainer = (props: {
  setopen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [allcate, setallcate] = useState<Array<CateogoryState>>();
  const [loading, setloading] = useState(false);
  const { isMobile } = useScreenSize();
  const router = useRouter();

  const fetchcate = useCallback(async () => {
    setloading(true);
    const request = await ApiRequest("/api/categories", undefined, "GET");
    console.log({ request });
    if (request.success) {
      setallcate(request.data);
    }
    setloading(false);
  }, []);

  useEffect(() => {
    fetchcate();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [fetchcate]);
  return (
    <div
      onMouseLeave={() => props.setopen(false)}
      className="categories__container w-full max-h-screen min-h-[50vh] h-full 
      absolute top-14.25 z-99 bg-linear-to-b from-white to-gray-50 
      shadow-xl border-t border-gray-200 flex flex-row gap-8 justify-start 
      max-large_phone:justify-center items-start flex-wrap overflow-x-hidden 
      max-small_phone:h-screen max-small_phone:pb-20 p-6 overflow-y-auto"
    >
      {loading ? (
        <>
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="category flex flex-col w-55 max-small_phone:w-[90%] 
              bg-white rounded-lg shadow-md p-5 border border-gray-100 animate-pulse"
            >
              <div className="w-full h-13 bg-gray-300 rounded-lg mb-4"></div>
              <div className="flex flex-col gap-y-3">
                <div className="w-full h-6 bg-gray-200 rounded-md"></div>
                <div className="w-4/5 h-6 bg-gray-200 rounded-md"></div>
                <div className="w-3/4 h-6 bg-gray-200 rounded-md"></div>
                <div className="w-full h-6 bg-gray-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </>
      ) : !allcate || allcate.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 py-20">
          <svg
            className="w-24 h-24 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600">
            No Categories Available
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            There are currently no categories to display. Please check back
            later.
          </p>
        </div>
      ) : (
        <>
          {allcate
            ?.filter((i) => i.type !== "latest")
            .map((i) => (
              <div
                key={i.id}
                className="category flex flex-col w-55 max-small_phone:w-[90%] 
                bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
                p-5 border border-gray-100"
              >
                <h3
                  onClick={() => {
                    router.push(
                      `/product?${
                        i.type === "normal" ? `pid=${i.id}` : `ppid=${i.id}`
                      }`,
                    );
                    router.refresh();
                    isMobile && props.setopen(false);
                  }}
                  className="category_header w-full bg-linear-to-r from-incart to-[#5a6575] 
                  text-white font-semibold text-base transition-all duration-300 cursor-pointer 
                  hover:scale-105 hover:shadow-lg active:scale-95 rounded-lg p-3.5 
                  wrap-break-word text-center"
                >
                  {i.name}
                </h3>
                <div className="category_subheader w-full h-fit flex flex-col gap-y-3 pt-4 font-normal text-center">
                  {i.subcategories
                    .filter((i) => (i.isExpired ? !i.isExpired : true))
                    .map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => {
                          router.push(
                            `/product?pid=${i.id}${
                              sub.type === "normal"
                                ? `&cid=${sub.id}`
                                : `&promoid=${sub.pid}`
                            }`,
                          );
                          router.refresh();
                          isMobile && props.setopen(false);
                        }}
                        className="subcategory cursor-pointer px-2 py-1.5 rounded-md 
                        hover:bg-gray-100 transition-colors duration-200 text-gray-700 
                        hover:text-incart text-sm"
                      >
                        <h4>{sub.name}</h4>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          <div
            className="category flex flex-col w-55 max-small_phone:w-[90%] 
          bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 
          p-5 border border-gray-100 gap-y-4"
          >
            {allcate
              ?.filter((i) => i.type === "latest" || i.type === "popular")
              .map((item, idx) => (
                <h3
                  key={idx}
                  onClick={() => router.push(`/product?pid=${item.id}`)}
                  className="category_header bg-linear-to-r from-incart to-[#5a6575] 
                  text-white font-semibold text-base transition-all duration-300 cursor-pointer 
                  hover:scale-105 hover:shadow-lg active:scale-95 rounded-lg p-3.5 
                  wrap-break-word text-center"
                >
                  {item.name}
                </h3>
              ))}
          </div>
        </>
      )}
    </div>
  );
};
export function DashboordNavBar({ session }: { session?: Sessiontype }) {
  const route = usePathname();

  return (
    <nav className="dashboardNav__container flex flex-row w-full items-center justify-evenly bg-[#F3F3F3] h-17.5">
      <Link href={"/dashboard"}>
        <h1
          className={`navlink ${
            route === "/dashboard" ? "activelink" : ""
          } text-lg font-bold bg-white w-37.5 p-2 transition text-center rounded-md`}
        >
          My Profile
        </h1>
      </Link>{" "}
      <Link href={"/dashboard/order"}>
        <h1
          className={`navlink ${
            route === "/dashboard/order" ? "activelink" : ""
          } text-lg font-bold bg-white w-fit p-2 transition text-center rounded-md`}
        >
          {session?.role === "ADMIN" ? "Order Mangement" : "My Order"}
        </h1>
      </Link>
      <Link hidden={session?.role !== "ADMIN"} href={"/dashboard/inventory"}>
        <h1
          className={`navlink ${
            route === "/dashboard/inventory" ? "activelink" : ""
          } text-lg font-bold bg-white w-37.5 p-2 transition text-center rounded-md`}
        >
          Inventory
        </h1>
      </Link>
      <Link
        hidden={session?.role !== "ADMIN"}
        href={"/dashboard/usermanagement"}
      >
        <h1
          className={`navlink ${
            route === "/dashboard/usermanagement" ? "activelink" : ""
          } text-lg font-bold bg-white w-50 p-2 transition text-center rounded-md`}
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

export const SubInventoryMenu = (props: Subinventorymenuprops) => {
  const {
    openmodal,
    setopenmodal,
    setglobalindex,
    setproduct,
    setbanner,
    setpromotion,
  } = useGlobalContext();

  const handleClick = (obj: { value: string; opencon: string }) => {
    const index = props.index as number;

    if (
      props.type === "product" ||
      props.type === "banner" ||
      props.type === "promotion"
    ) {
      if (obj.value === actiontype.EDIT) {
        setglobalindex((previndex) => ({
          ...previndex,
          [props.type === "product"
            ? "producteditindex"
            : props.type === "banner"
              ? "bannereditindex"
              : "promotioneditindex"]: index,
        }));
        setopenmodal({ ...openmodal, [obj.opencon as string]: true });
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
      setopenmodal({ ...openmodal, [obj.opencon as string]: true });
    }
  };
  return (
    <Dropdown
      classNames={{
        base: "before:bg-white/10",
        content:
          "p-1.5 border border-gray-200 bg-white/95 backdrop-blur-xl shadow-xl rounded-xl",
      }}
    >
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
          style={props.type ? { minWidth: "20px" } : {}}
          className={`group relative overflow-hidden font-bold transition-all duration-300 ${
            props.type
              ? "bg-linear-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 text-gray-700 border-2 border-gray-300 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-100 min-w-9 md:min-w-11 h-9 md:h-11 px-1.5 md:px-2.5 shadow-md hover:scale-105 active:scale-95"
              : "bg-linear-to-br from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 min-w-27.5 md:min-w-35 h-9 md:h-11 text-xs md:text-sm"
          } rounded-xl md:rounded-2xl before:absolute before:inset-0 before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700`}
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
              <span className="md:hidden font-extrabold tracking-wide uppercase text-xs">
                New
              </span>
            </div>
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Dynamic Actions"
        items={props.data}
        className="min-w-40 md:min-w-50"
        itemClasses={{
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
        }}
      >
        {(item) => (
          <DropdownItem
            key={item.opencon}
            onClick={() => handleClick(item)}
            textValue={item.value}
            startContent={
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br transition-all duration-200">
                <FontAwesomeIcon
                  icon={
                    item.value === "Product"
                      ? faBox
                      : item.value === "Category"
                        ? faFolder
                        : item.value === "Banner"
                          ? faImage
                          : item.value === "Promotion"
                            ? faTags
                            : item.value === "Edit"
                              ? faPenToSquare
                              : item.value === "Stock"
                                ? faBoxesStacked
                                : item.value === "DELETE"
                                  ? faTrashCan
                                  : faCircle
                  }
                  className={`text-sm md:text-base ${
                    item.value === "Product"
                      ? "text-blue-600"
                      : item.value === "Category"
                        ? "text-purple-600"
                        : item.value === "Banner"
                          ? "text-green-600"
                          : item.value === "Promotion"
                            ? "text-orange-600"
                            : item.value === "Edit"
                              ? "text-blue-600"
                              : item.value === "Stock"
                                ? "text-emerald-600"
                                : item.value === "DELETE"
                                  ? "text-red-600"
                                  : "text-gray-500"
                  }`}
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
};

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
    const [notifydata, setnotifydata] = useState<
      NotificationType[] | undefined
    >(undefined);

    const [loading, setloading] = useState(false);
    const [page, setPage] = useState(1);
    const [loadmore, setloadmore] = useState(true);
    const router = useRouter();
    const notioffset = 3;

    useEffect(() => {
      const getAllNotification = async () => {
        setloading(true);
        const result = await ApiRequest(
          `/api/users/notification?ty=detail&p=${page}&lt=${notioffset}`,
          undefined,
          "GET",
        );
        if (result.success) {
          if (notification) {
            setnotifydata([...result.data, ...notification]);
          }

          if (result.data?.length === 0) {
            setloadmore(false);
          }

          if (notifydata) {
            setnotifydata((prev) => [
              ...(prev as any),
              ...(result.data as any),
            ]);
          } else {
            setnotifydata(result.data as any);
          }
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
      const checkednotify = CheckedNotification.bind(null, id);
      await checkednotify();
      router.refresh();
    };

    const handleDelete = async (id: number) => {
      const makereq = await ApiRequest(
        "/api/users/notification",
        undefined,
        "DELETE",
        "JSON",
        { id },
      );
      if (makereq.success) {
        setnotifydata((prev) => prev?.filter((i) => i.id === id));
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
        className="notification absolute w-87.5 h-100 z-150 right-2 top-14 flex flex-col gap-x-5 bg-white rounded-lg overflow-x-hidden overflow-y-auto max-smallest_tablet:right-0 max-smallest_tablet:top-0 max-smallest_tablet:w-screen max-smallest_tablet:h-screen"
      >
        <div
          onClick={() => close()}
          className="w-fit h-fit hidden max-smallest_tablet:block absolute top-1 right-2 z-50"
        >
          <CloseVector width="30px" height="30px" />
        </div>
        <h3
          className="font-bold bg-white text-lg w-full sticky top-0 z-10 text-left p-2 border-b-2 border-b-gray-300
      "
        >
          Notifications
        </h3>

        <div className="w-full h-full flex flex-col gap-y-5 relative">
          {!notifydata?.length
            ? !loading && (
                <h3 className="font-normal text-sm w-full h-fit text-center pt-2">
                  No Notification
                </h3>
              )
            : notifydata.map((n) => (
                <div key={n.id} className="w-full h-full relative">
                  <Link href={n.link ?? ""}>
                    <div
                      onTouchStart={() => handleChecked(n.id as number)}
                      onMouseEnter={() => handleChecked(n.id as number)}
                      className="notification_item relative w-full h-fit flex flex-col gap-y-5 p-3 transition cursor-pointer hover:bg-gray-300"
                    >
                      {!n.checked && (
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-xl absolute right-2"></span>
                      )}
                      <h3 className="font-bold text-lg">{n.type} </h3>
                      <p>{n.content}</p>
                      <p className="text-[12px]">{n.createdAt}</p>
                    </div>
                  </Link>
                  <FontAwesomeIcon
                    icon={faTrash}
                    onClick={() => handleDelete(n.id as number)}
                    className={`relative w-full left-[90%] transition duration-300 active:text-white cursor-pointer ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                </div>
              ))}

          {loading && (
            <Box
              sx={{ display: "flex", justifyContent: "center", height: "50px" }}
            >
              <CircularProgress />
            </Box>
          )}
        </div>
      </aside>
    );
  },
);
