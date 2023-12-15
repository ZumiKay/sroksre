"use client";
import Image from "next/image";
import Logo from "../Asset/Image/Logo.svg";
import Menu from "../Asset/Image/Menu.svg";
import Search from "../Asset/Image/Search.svg";
import Cart from "../Asset/Image/cart.svg";
import Profile from "../Asset/Image/profile.svg";
import DefaultImage from "../Asset/Image/default.png";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccountMenu, { CartMenu } from "./SideMenu";
import { useSession } from "next-auth/react";
import "../globals.css";
import Link from "next/link";
import { useGlobalContext } from "@/src/context/GlobalContext";

export default function Navbar() {
  const [categories, setcategories] = useState(false);
  const [profile, setprofile] = useState(false);
  const [cart, setcart] = useState(false);
  const router = useRouter();
  const navref = useRef<HTMLDivElement>(null);
  const session = useSession();
  useEffect(() => {
    const handleEventClick = (e: MouseEvent) => {
      if (navref.current && !navref.current.contains(e.target as Node)) {
        setcategories(false);
      }
    };
    window.addEventListener("click", handleEventClick);
    return () => {
      window.removeEventListener("click", handleEventClick);
    };
  }, []);
  return (
    <nav className="navbar__container sticky top-0 z-[99] w-full h-[60px] bg-[#F3F3F3] flex flex-row justify-between item-center">
      <div ref={navref} className="first_section  w-1/2 h-fit p-1">
        <Image
          className="menu_icon w-[50px] h-[50px] object-contain transition rounded-md"
          onClick={() => setcategories(!categories)}
          src={Menu}
          alt="menu"
          style={categories ? { backgroundColor: "lightgray" } : {}}
        />
        {categories && <Categories_Container />}
      </div>
      <div className="second_section  w-full h-fit relative top-2 flex justify-center">
        <Image
          src={Logo}
          alt="logo"
          className="Logo w-[100px] h-[50px] object-contain"
          onClick={() => router.push("/")}
        />
      </div>
      <div className="third_section  w-1/2 h-fit flex flex-row justify-evenly items-center">
        <Image
          src={Search}
          alt="search"
          className="search w-[50px] h-[50px] object-contain transition hover:-translate-y-2"
        />

        <Image
          src={Cart}
          alt="cart"
          className="cart w-[30px] h-[30px] object-contain transition hover:-translate-y-2"
          onMouseEnter={() => setcart(true)}
        />

        <Image
          src={Profile}
          alt="profile"
          className="cart w-[40px] h-[40px] object-contain transition hover:-translate-y-2"
          onMouseEnter={() =>
            session.status === "authenticated" && setprofile(true)
          }
          onClick={() =>
            session.status === "unauthenticated" && router.push("/account")
          }
        />
      </div>
      {profile && <AccountMenu setProfile={setprofile} />}
      {cart && <CartMenu img={DefaultImage} setcart={setcart} />}
    </nav>
  );
}
const Categories_Container = () => {
  return (
    <div className="categories__container grid md:grid-cols-6 sm:grid-cols-4  place-items-start w-full h-fit absolute top-[57px] z-[99] bg-[#F3F3F3] ">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="category flex flex-col h-[50vh] w-[15vw] min-w-[10vw] items-center justify-start p-1"
        >
          <h3 className="category_header bg-[#495464] rounded-md p-1 w-[150px]  break-words h-fit text-center text-white font-bold">
            {" "}
            fdsfsfdsfj
          </h3>
          <div className="category_subheader h-full grid row-span-3 pt-7 font-medium text-center">
            <h4 className="subcategory"> Upperbody </h4>
            <h4 className="subcategory"> Lowerbody </h4>
            <h4 className="subcategory"> T-shirt </h4>
            <h4 className="subcategory"> Pants </h4>
          </div>
        </div>
      ))}
    </div>
  );
};
export function DashboordNavBar() {
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
          } text-lg font-bold bg-white w-[150px] p-2 transition text-center rounded-md`}
        >
          My Order
        </h1>
      </Link>
      <Link href={"/dashboard/products"}>
        <h1
          className={`navlink ${
            route === "/dashboard/products" ? "activelink" : ""
          } text-lg font-bold bg-white w-[150px] p-2 transition text-center rounded-md`}
        >
          My Products
        </h1>
      </Link>
    </nav>
  );
}

export const SubInventoryMenu = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  return (
    <div
      onMouseLeave={() =>
        setopenmodal({ ...openmodal, subcreatemenu_ivt: false })
      }
      className="subinventorymenu flex flex-col w-[149px] rounded-b-xl absolute top-[100%] h-fit p-1 bg-[#6FCF97]"
    >
      <h3
        onClick={() => setopenmodal({ ...openmodal, createProduct: true })}
        className="font-bold cursor-pointer text-[17px] w-full p-2 transition text-white hover:bg-black"
      >
        Product
      </h3>
      <h3
        onClick={() => {
          setopenmodal({ ...openmodal, createCategory: true });
        }}
        className="font-bold cursor-pointer text-[17px] w-full p-2 transition hover:bg-black text-white"
      >
        Category
      </h3>
    </div>
  );
};
