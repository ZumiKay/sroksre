"use client";
import Image from "next/image";
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
  MutableRefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import AccountMenu, { CartMenu } from "./SideMenu";
import "../globals.css";
import Link from "next/link";
import {
  BannerInitialize,
  CateogoryState,
  NotificationType,
  Productinitailizestate,
  PromotionInitialize,
  Sessiontype,
  useGlobalContext,
  Usersessiontype,
} from "@/src/context/GlobalContext";
import { ApiRequest, useEffectOnce } from "@/src/context/CustomHook";
import { errorToast, infoToast, LoadingText } from "./Loading";
import { Role } from "@prisma/client";
import {
  CheckedNotification,
  CheckNotification,
  DeleteNotification,
  GetNotification,
} from "../severactions/notification_action";
import { Box, CircularProgress } from "@mui/material";

import { signOut } from "next-auth/react";
import { checkloggedsession } from "../dashboard/action";
import Homecontainermodal from "./HomePage/Modals";
import { AnimatePresence } from "framer-motion";

export default function Navbar({ session }: { session?: Usersessiontype }) {
  const { cart, setcart, carttotal, setcarttotal } = useGlobalContext();
  const [categories, setcategories] = useState(false);

  const [profile, setprofile] = useState(false);
  const [opennotification, setnotification] = useState(false);
  const [checkNotification, setchecknotify] = useState<number | undefined>(0);
  const [notification, setnotificationdata] = useState<
    Array<NotificationType> | undefined
  >(undefined);
  const { openmodal } = useGlobalContext();

  const router = useRouter();
  const navref = useRef<any>(null);
  const notiref = useRef<any>(null);
  //checkout loggedin session
  useEffectOnce(() => {
    InitialMethod();
  });

  const InitialMethod = async () => {
    if (session) {
      const checksession = async () => {
        const checked = checkloggedsession.bind(null, session.session_id);
        const makereq = await checked();
        if (!makereq.success) {
          infoToast("Session expired please login again");

          setTimeout(() => {
            signOut();
          }, 2000);
        }
      };
      await checksession();
    }
    await getCartTotal();
  };

  const getCartTotal = async () => {
    const request = await ApiRequest(
      "/api/order/cart?count=1",
      undefined,
      "GET"
    );
    if (!request.success) {
      return;
    }
    setcarttotal(request.data);
  };

  useEffect(() => {
    if (session?.role === "ADMIN") {
      const handleCheckNotification = async () => {
        const makereq = await CheckNotification();

        if (makereq.success) {
          setchecknotify(makereq.isNotCheck?.length);
        }
      };
      handleCheckNotification();
    }
  }, []);

  useEffect(() => {
    // session &&
    //   socket.on("getnotify", (data) => {
    //     setnotificationdata(data);
    //   });

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
      // session ? socket.off("getnotify") : socket.disconnect();
    };
  }, []);

  return (
    <nav className="navbar__container sticky top-0 z-[99] w-full h-[60px] bg-[#F3F3F3] flex flex-row justify-between item-center">
      {categories && <CategoriesContainer setopen={setcategories} />}
      <div className="first_section  w-1/2 h-fit pl-3">
        <Image
          className="menu_icon w-[50px] h-[50px] object-fill transition rounded-md"
          onClick={() => setcategories(!categories)}
          src={Menu}
          alt="menu"
          style={categories ? { backgroundColor: "lightgray" } : {}}
        />
      </div>
      <div className="second_section  w-full h-fit relative top-2 flex justify-center">
        <Image
          src={Logo}
          alt="logo"
          className="Logo w-[100px] h-[50px] object-contain grayscale"
          onClick={() => router.push("/")}
        />
      </div>
      <div className="third_section  w-1/2 h-full flex flex-row gap-x-10 items-center justify-end pr-10">
        <Image
          src={Search}
          alt="search"
          className="search w-[50px] h-[50px] max-large_tablet:hidden object-contain transition hover:-translate-y-2"
        />

        {session?.role !== Role.ADMIN && (
          <div className="cart_container relative max-large_tablet:hidden">
            <Image
              src={Cart}
              alt="cart"
              className="cart w-[30px] h-[30px] object-contain transition hover:-translate-y-2"
              onMouseEnter={() => setcart(true)}
            />
            <span className="text-[13px] w-[20px] h-[20px] grid place-content-center absolute -bottom-6 top-0 -right-3 bg-gray-500 text-white rounded-[50%]">
              {carttotal}
            </span>
          </div>
        )}

        {session?.role === Role.ADMIN && (
          <>
            <div className="w-[30px] h-[30px] relative max-large_tablet:hidden">
              <Image
                ref={navref}
                src={!opennotification ? Bell : ActiveBell}
                alt="notification"
                onClick={() => setnotification(!opennotification)}
                width={30}
                height={30}
                className="bell min-w-[30px] min-h-[30px] object-fill transition-all active:bg-gray-200 active:shadow-xl rounded-xl"
              />

              {checkNotification !== 0 && (
                <span className="absolute top-0 -right-1 w-[10px] h-[10px] rounded-2xl bg-red-500"></span>
              )}
              {opennotification && (
                <NotificationMenu notification={notification} ref={notiref} />
              )}
            </div>
          </>
        )}

        <Image
          src={Profile}
          alt="profile"
          className="cart w-[40px] h-[40px] max-large_tablet:w-[50px] max-large_tablet:h-[50px]  object-contain transition hover:-translate-y-2"
          onMouseEnter={() => session && setprofile(true)}
          onClick={() => !session && router.push("/account")}
        />
      </div>

      <AnimatePresence>
        {profile && <AccountMenu session={session} setProfile={setprofile} />}
      </AnimatePresence>

      {openmodal?.homecontainer && (
        <Homecontainermodal setprofile={setprofile} />
      )}

      {cart && (
        <CartMenu
          img={DefaultImage}
          setcart={setcart}
          setcarttotal={setcarttotal}
        />
      )}
    </nav>
  );
}
const CategoriesContainer = (props: { setopen: any }) => {
  const [allcate, setallcate] = useState<Array<CateogoryState>>();
  const [loading, setloading] = useState(true);
  const router = useRouter();
  const fetchcate = async () => {
    const request = await ApiRequest("/api/categories", undefined, "GET");
    if (request.success) {
      setallcate(request.data);
    }
    setloading(false);
  };
  useEffect(() => {
    fetchcate();
  }, []);
  return (
    <div
      onMouseLeave={() => props.setopen(false)}
      className="categories__container grid md:grid-cols-6 sm:grid-cols-4  place-items-start w-full min-h-[50vh] absolute top-[57px] z-[99] bg-[#F3F3F3] "
    >
      {loading ? (
        <LoadingText />
      ) : (
        <div className="category flex flex-col w-[15vw] min-w-[10vw] pt-10  items-center justify-start p-1 gap-y-5">
          <h3
            onClick={() => router.push("/product?all=1")}
            className="category_header  bg-[#495464] transition cursor-pointer hover:bg-white hover:text-black active:bg-white active:text-black rounded-md p-3 min-w-[150px] h-fit  break-words  text-center text-white font-medium"
          >
            All
          </h3>
          {allcate
            ?.filter((i) => i.type === "latest" || i.type === "popular")
            .map((item, idx) => (
              <h3
                key={idx}
                onClick={() => router.push(`/product?pid=${item.id}`)}
                className="category_header bg-[#495464] transition cursor-pointer hover:bg-white hover:text-black active:bg-white active:text-black rounded-md p-3 min-w-[150px] h-fit  break-words  text-center text-white font-medium"
              >
                {" "}
                {item.name}
              </h3>
            ))}
        </div>
      )}

      {allcate
        ?.filter((i) => i.type !== "latest")
        .map((i) => (
          <div
            key={i.id}
            className="category flex flex-col w-[15vw] min-w-[10vw] pt-10  items-center justify-start p-1"
          >
            <h3
              onClick={() =>
                router.push(
                  `/product?${
                    i.type === "normal" ? `pid=${i.id}` : `ppid=${i.id}`
                  }`
                )
              }
              className="category_header bg-[#495464] transition cursor-pointer hover:bg-white hover:text-black active:bg-white active:text-black rounded-md p-3 min-w-[150px] h-fit  break-words  text-center text-white font-medium"
            >
              {" "}
              {i.name}
            </h3>
            <div className="category_subheader h-full grid row-span-3 gap-y-5 pt-7 font-normal text-center">
              {i.subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/product?pid=${i.id}${
                    sub.type === "normal"
                      ? `&cid=${sub.id}`
                      : `&promoid=${sub.pid}`
                  }`}
                  scroll={true}
                >
                  <h4 className="subcategory"> {sub.name} </h4>
                </Link>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};
export function DashboordNavBar({ session }: { session?: Sessiontype }) {
  const route = usePathname();

  return (
    <nav className="dashboardNav__container flex flex-row w-full items-center justify-evenly bg-[#F3F3F3] h-[70px]">
      <Link href={"/dashboard"}>
        <h1
          className={`navlink ${
            route === "/dashboard" ? "activelink" : ""
          } text-lg font-bold bg-white w-[150px] p-2 transition text-center rounded-md`}
        >
          My Profile{" "}
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
          } text-lg font-bold bg-white w-[150px] p-2 transition text-center rounded-md`}
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
          } text-lg font-bold bg-white w-[200px] p-2 transition text-center rounded-md`}
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
  ref?: MutableRefObject<HTMLDivElement | null>;
  stock?: number;
  stocktype?: string;
  stockaction?: () => void;
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
          setproduct((prev) => ({ ...prev, stock: props.stock }));
        props.stockaction();
      } else {
        setopenmodal((prev) => ({
          ...prev,
          confirmmodal: {
            ...prev.confirmmodal,
            index: index,
            type: props.type,
            open: true,
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
    <div
      style={props.style}
      className="subinventorymenu flex flex-col w-[149px] rounded-b-xl absolute h-fit p-1 bg-white"
    >
      {props.data.map((obj, index) => (
        <h3
          key={index}
          onClick={() => handleClick(obj)}
          className="font-bold cursor-pointer text-[17px] w-full p-2 transition text-black hover:bg-black hover:text-white"
        >
          {obj.value}
        </h3>
      ))}
    </div>
  );
};

export const NotificationMenu = forwardRef(
  (
    {
      notification,
    }: {
      notification?: NotificationType[];
    },
    ref
  ) => {
    const [notifydata, setnotifydata] = useState<
      NotificationType[] | undefined
    >(undefined);

    const [loading, setloading] = useState(false);
    const [page, setPage] = useState(1);
    const [loadmore, setloadmore] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const getAllNotification = async () => {
        setloading(true);
        const makereq = GetNotification.bind(null, page, 3);
        const result = await makereq();
        if (result.success) {
          if (notification) {
            setnotifydata([...(result.data as any), ...notification]);
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
      const deleteNotify = DeleteNotification.bind(null, id);
      const makereq = await deleteNotify();
      if (makereq.success) {
        setnotifydata((prev) => prev?.filter((i) => i.id === id));
      } else {
        errorToast(makereq.message as string);
      }
    };

    return (
      <div
        ref={ref as any}
        onScroll={() => {
          handleScroll();
        }}
        className="notification absolute w-[350px] h-[400px] z-[150] right-2 top-14 flex flex-col gap-x-5 bg-white rounded-lg overflow-x-hidden overflow-y-auto"
      >
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
                        <span className="w-[10px] h-[10px] bg-red-500 rounded-xl absolute right-2"></span>
                      )}
                      <h3 className="font-bold text-lg">{n.type} </h3>
                      <p>{n.content}</p>
                      <p className="text-[12px]">{n.createdAt}</p>
                    </div>
                  </Link>
                  <i
                    onClick={() => handleDelete(n.id as number)}
                    className={`fa-solid fa-trash relative w-full left-[90%] transition duration-300 active:text-white ${
                      loading ? "animate-spin" : ""
                    }`}
                  ></i>
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
      </div>
    );
  }
);
