"use client";
import {
  ApiRequest,
  useCheckSession,
  useScreenSize,
} from "@/src/context/CustomHook";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { useSocket } from "@/src/context/SocketContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { infoToast } from "../Loading";
import Image from "next/image";
import CookieConsent from "react-cookie-consent";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import AccountMenu, { CartMenu } from "../SideMenu";
import SearchContainer from "../Modals/Search";
import DefaultImage from "@/public/Image/default.png";
import Logo from "@/public/Image/Logo.svg";
import Menu from "@/public/Image/Menu.svg";
import Search from "@/public/Image/Search.svg";
import Cart from "@/public/Image/cart.svg";
import Bell from "@/public/Image/blackbell.svg";
import ActiveBell from "@/public/Image/whitebell.svg";
import Profile from "@/public/Image/profile.svg";
import { CategoriesContainer, NotificationMenu } from "./Component";
import CreateHomeItemModal from "../HomeItem/CreateModal";

export default function Navbar() {
  const { cart, setcart, carttotal, setcarttotal, setopenmodal, openmodal } =
    useGlobalContext();
  const { user } = useCheckSession();
  const { isMobile } = useScreenSize();
  const socket = useSocket();
  const router = useRouter();

  const [categories, setcategories] = useState(false);
  const [profile, setprofile] = useState(false);
  const [opennotification, setnotification] = useState(false);
  const [checkNotification, setchecknotify] = useState(0);

  const navref = useRef<HTMLImageElement>(null);
  const notiref = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "ADMIN";

  // Fetch cart total on component mount
  useEffect(() => {
    const getCartTotal = async () => {
      const request = await ApiRequest({
        url: "/api/order/cart?count=1",
        method: "GET",
      });

      if (request.success) {
        setcarttotal(request.data as number);
      }
    };

    if (user?.role === "USER") getCartTotal();
  }, [setcarttotal, user]);

  // Admin notification socket listener
  useEffect(() => {
    if (isAdmin && socket) {
      const handleNotification = () => {
        infoToast("New Notification");
        setchecknotify(1);
      };

      socket.on("receiveNotification", handleNotification);
      return () => {
        socket.off("receiveNotification", handleNotification);
      };
    }
  }, [socket, isAdmin]);

  // Click outside notification handler
  useEffect(() => {
    const handleEventClick = (e: MouseEvent) => {
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
    return () => window.removeEventListener("click", handleEventClick);
  }, []);

  const handleClickProfile = useCallback(() => {
    if (!user) {
      router.push("/account", { scroll: false });
    } else {
      setprofile(true);
    }
  }, [router, user]);

  const toggleCategories = () => setcategories(!categories);
  const toggleNotification = () => setnotification(!opennotification);
  const openSearch = () =>
    setopenmodal((prev) => ({ ...prev, searchcon: true }));
  const navigateHome = () => router.push("/");
  const closeNotification = () => setnotification(false);

  return (
    <>
      {openmodal.mangageHomeItem && <CreateHomeItemModal />}
      <nav className="navbar__container sticky top-0 z-50 w-full h-[60px] bg-[#F3F3F3] flex flex-row justify-between item-center">
        {categories && <CategoriesContainer setopen={setcategories} />}

        <div className="first_section w-1/2 h-full flex items-center pl-3">
          <Image
            className="menu_icon w-[30px] h-[30px] object-fill transition rounded-md"
            onClick={toggleCategories}
            src={Menu}
            alt="menu"
            style={categories ? { backgroundColor: "lightgray" } : {}}
          />

          <Image
            src={Search}
            alt="search"
            className="search w-[40px] h-[40px] object-contain hidden max-smallest_tablet:block transition hover:-translate-y-2"
            onClick={openSearch}
          />
        </div>

        <div className="second_section w-full h-fit relative top-2 flex justify-center">
          <Image
            src={Logo}
            alt="logo"
            className="Logo w-[100px] h-[50px] max-small_phone:w-[70px] max-small_phone:[30px] object-contain grayscale"
            onClick={navigateHome}
          />
        </div>

        <div className="third_section w-1/2 h-full flex flex-row gap-x-10 max-small_phone:gap-x-3 items-center justify-end pr-5 max-small_phone:pr-2">
          <Image
            src={Search}
            alt="search"
            className="search w-[50px] h-[50px] object-contain transition hover:-translate-y-2 max-smallest_tablet:hidden"
            onClick={openSearch}
          />

          {!isAdmin && (
            <div className="cart_container relative">
              <Image
                src={Cart}
                alt="cart"
                className="cart min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] w-full h-full object-contain transition hover:-translate-y-2 max-small_phone:w-[30px] max-small_phone:h-[30px]"
                onMouseEnter={() => setcart(true)}
              />
              <span className="text-[13px] w-[20px] h-[20px] grid place-content-center absolute -bottom-6 top-0 -right-3 bg-gray-500 text-white rounded-[50%]">
                {carttotal ?? 0}
              </span>
            </div>
          )}

          {isAdmin && (
            <div className="w-[30px] h-[30px] max-smallest_tablet:w-[25px] max-smallest_tablet:h-[25px] max-small_phone:w-[25px] max-small_phone:h-[25px] relative">
              <Image
                ref={navref}
                src={!opennotification ? ActiveBell : Bell}
                alt="notification"
                onClick={toggleNotification}
                width={30}
                height={30}
                className="bell min-w-[30px] min-h-[30px] max-smallest_tablet:min-w-[25px] max-smallest_tablet:min-h-[25px] max-small_phone:min-w-[25px] max-small_phone:min-h-[25px] object-fill transition-all active:bg-gray-200 active:shadow-xl rounded-xl"
              />

              {checkNotification !== 0 && (
                <span className="absolute top-0 -right-1 w-[10px] h-[10px] rounded-2xl bg-red-500"></span>
              )}
            </div>
          )}

          <Image
            src={Profile}
            alt="profile"
            className="cart w-[40px] h-[40px] max-small_phone:w-[35px] max-small_phone:h-[35px] object-contain transition hover:-translate-y-2"
            onClick={handleClickProfile}
          />
        </div>

        <AnimatePresence>
          {profile && <AccountMenu setProfile={setprofile} />}
        </AnimatePresence>

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

        {opennotification && <NotificationMenu close={closeNotification} />}
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
          href="/privacyandpolicy"
          style={{ fontSize: "10px", textDecoration: "underline" }}
        >
          See Privacy And Policy Page
        </Link>
      </CookieConsent>
    </>
  );
}
