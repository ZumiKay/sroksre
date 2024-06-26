"use client";
import Image from "next/image";
import Logo from "../../../public/Image/Logo.svg";
import Menu from "../../../public/Image/Menu.svg";
import Search from "../../../public/Image/Search.svg";
import Cart from "../../../public/Image/cart.svg";
import Profile from "../../../public/Image/profile.svg";
import DefaultImage from "../../../public/Image/default.png";
import {
  CSSProperties,
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
  Productinitailizestate,
  PromotionInitialize,
  Sessiontype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { LoadingText } from "./Loading";

export default function Navbar({
  children,
  session,
}: {
  children: ReactNode;
  session?: Sessiontype;
}) {
  const { cart, setcart } = useGlobalContext();
  const [categories, setcategories] = useState(false);
  const [profile, setprofile] = useState(false);

  const router = useRouter();
  const navref = useRef<HTMLDivElement>(null);

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
          className="menu_icon w-[50px] h-[50px] object-fill transition rounded-md"
          onClick={() => setcategories(!categories)}
          src={Menu}
          alt="menu"
          style={categories ? { backgroundColor: "lightgray" } : {}}
        />
        {categories && <Categories_Container setopen={setcategories} />}
      </div>
      <div className="second_section  w-full h-fit relative top-2 flex justify-center">
        <Image
          src={Logo}
          alt="logo"
          className="Logo w-[100px] h-[50px] object-contain grayscale"
          onClick={() => router.push("/")}
        />
      </div>
      <div className="third_section  w-1/2 h-fit flex flex-row justify-evenly items-center">
        <Image
          src={Search}
          alt="search"
          className="search w-[50px] h-[50px] object-contain transition hover:-translate-y-2"
        />

        <div className="cart_container relative">
          <Image
            src={Cart}
            alt="cart"
            className="cart w-[30px] h-[30px] object-contain transition hover:-translate-y-2"
            onMouseEnter={() => setcart(true)}
          />
          {children}
        </div>

        <Image
          src={Profile}
          alt="profile"
          className="cart w-[40px] h-[40px] object-contain transition hover:-translate-y-2"
          onMouseEnter={() => session && setprofile(true)}
          onClick={() => !session && router.push("/account")}
        />
      </div>
      {profile && <AccountMenu setProfile={setprofile} />}
      {cart && <CartMenu img={DefaultImage} setcart={setcart} />}
    </nav>
  );
}
const Categories_Container = (props: { setopen: any }) => {
  const [allcate, setallcate] = useState<Array<CateogoryState> | []>([]);
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
      {loading && <LoadingText />}
      {allcate.map((i) => (
        <div
          key={i.id}
          className="category flex flex-col w-[15vw] min-w-[10vw] pt-10  items-center justify-start p-1"
        >
          <h3
            onClick={() => router.push(`/product/${i.id}`)}
            className="category_header bg-[#495464] transition cursor-pointer hover:bg-white hover:text-black active:bg-white active:text-black rounded-md p-3 min-w-[150px] h-fit  break-words  text-center text-white font-medium"
          >
            {" "}
            {i.name}
          </h3>
          <div className="category_subheader h-full grid row-span-3 gap-y-5 pt-7 font-normal text-center">
            {i.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/product/${i.id}/${sub.id}`}
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
      <Link hidden={session?.role !== "ADMIN"} href={"/dashboard/products"}>
        <h1
          className={`navlink ${
            route === "/dashboard/products" ? "activelink" : ""
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
