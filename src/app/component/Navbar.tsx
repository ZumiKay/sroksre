"use client";
import Image from "next/image";
import Logo from "../Asset/Image/Logo.svg";
import Menu from "../Asset/Image/Menu.svg";
import Search from "../Asset/Image/Search.svg";
import Cart from "../Asset/Image/cart.svg";
import Profile from "../Asset/Image/profile.svg";
import DefaultImage from "../Asset/Image/default.png"
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AccountMenu, { CartMenu } from "./SideMenu";

export default function Navbar() {
  const [open, setopen] = useState({
    categories: false,
  });
  const [profile, setprofile] = useState(false);
  const [cart, setcart] = useState(false);
  const menuref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    window.addEventListener("click", (e) => handleOpen(e));

    return () => {
      window.removeEventListener("click", (e) => handleOpen(e));
    };
  }, []);
  const handleOpen = (e: globalThis.MouseEvent) => {
    e && e.preventDefault();
    if (menuref.current && !menuref.current?.contains(e.target as Node)) {
      setopen({ ...open, categories: false });
    } else {
      setopen({ ...open, categories: true });
    }
  };

  return (
    <nav className="navbar__container sticky top-0 z-30 w-full h-[60px] bg-[#F3F3F3] flex flex-row justify-between item-center">
      <div ref={menuref} className="first_section  w-1/2 h-fit p-1">
        <Image
          className="menu_icon w-[50px] h-[50px] object-contain transition rounded-md"
          src={Menu}
          alt="menu"
          style={open.categories ? { backgroundColor: "lightgray" } : {}}
        />
        {open.categories && <Categories_Container />}
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
          onMouseEnter={() => setprofile(true)}
        />
      </div>
      {profile && <AccountMenu setProfile={setprofile} />}
      {cart && <CartMenu img={DefaultImage} setcart={setcart} />}
    </nav>
  );
}
const Categories_Container = () => {
  return (
    <div className="categories__container grid md:grid-cols-6 sm:grid-cols-4  place-items-start w-full h-fit absolute top-[57px] z-30 bg-[#F3F3F3] ">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={[1, 2, 3, 4, 5, 6].indexOf(i)}
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
