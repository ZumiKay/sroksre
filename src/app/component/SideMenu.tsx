"use client";
import Image, { StaticImageData } from "next/image";
import DefaultProfile from "../Asset/Image/profile.svg";
import PrimaryButton from "./Button";
import { SetStateAction } from "react";
import { SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
interface accountmenuprops {
  setProfile: (value: SetStateAction<boolean>) => void;
}
export default function AccountMenu(props: accountmenuprops) {
  const Router = useRouter();
  return (
    <aside
      onMouseEnter={() => props.setProfile(true)}
      onMouseLeave={() => props.setProfile(false)}
      className="Account__container fixed right-0 top-0 w-[20vw] h-full z-40 bg-[#FFFFFF] flex flex-col items-center"
    >
      <div className="profile_container flex flex-row items-center justify-center w-[90%]">
        <Image
          src={DefaultProfile}
          alt="profile"
          className="profile w-[100px] h-[100px] rounded-xl object-cover"
        />
        <div className="username flex flex-col w-full items-center">
          <h1 className="account_name font-bold text-xl  max-w-[200px] break-words">
            Account Name
          </h1>
          <h3 className="userid font-normal text-md"> useID </h3>
        </div>
      </div>

      <ul className="menu_container flex flex-col items-center w-full gap-y-10 mt-[10vh] mb-[10vh]">
        <li
          onClick={() => Router.push("/dashboard")}
          className="side_link w-[80%] p-2 text-white text-center bg-[#495464] font-bold text-lg rounded-md "
        >
          My Profile
        </li>
        <li
          onClick={() => Router.push("/dashboard/order")}
          className="side_link w-[80%] p-2 text-white text-center bg-[#495464] font-bold text-lg rounded-md "
        >
          {" "}
          My Order{" "}
        </li>
        <li
          onClick={() => Router.push("/dashboard/myproduct")}
          className="side_link w-[80%] p-2 text-white text-center bg-[#495464] font-bold text-lg rounded-md"
        >
          {" "}
          My Product{" "}
        </li>
      </ul>
      <PrimaryButton
        text="SignOut"
        type="button"
        color="#F08080"
        width="80%"
        radius="10px"
        onClick={() => signOut()}
      />
    </aside>
  );
}
interface cardmenuprops {
  img: string | StaticImageData;
  setcart: (value: SetStateAction<boolean>) => void;
}

export function CartMenu(props: cardmenuprops) {
  return (
    <aside
      onMouseEnter={() => (document.body.style.overflow = "hidden")}
      onMouseLeave={() => {
        document.body.style.overflow = "auto";
        props.setcart(false);
      }}
      className="Cart__Sidemenu fixed h-full w-[fit] right-0 bg-white z-40 flex flex-col items-center gap-y-5"
    >
      <h1 className="heading text-xl font-bold text-center w-full">
        Shopping Cart <span>( 2 items )</span>
      </h1>
      <div className="card_container flex flex-col w-[95%] gap-y-5 max-h-[75vh] overflow-y-auto">
        <SecondayCard img={props.img} />
        <SecondayCard img={props.img} />
        <SecondayCard img={props.img} />
      </div>
      <div className="totalprice w-[90%] text-left font-medium">
        <h5 className="text-lg">Subtotal: </h5>
        <h5
          className="textprice text-sm font-medium
      "
        >
          Shipping:{" "}
        </h5>
        <h3 className="text-xl font-bold">Total: </h3>
      </div>
      <PrimaryButton
        type="button"
        text="Check Out"
        width="80%"
        height="50px"
        radius="10px"
      />
    </aside>
  );
}
interface infocontainerprops {
  container?: string;
  title: string;
  content: string;
}
export const InfoContainer = (props: infocontainerprops) => {
  return (
    <div className="info__container w-[300px] max-w-[400px] h-fit flex flex-col items-start justify-start gap-y-5 p-2 bg-white rounded-lg">
      <div className="info__header text-lg font-bold">{props.title}</div>
      <p className="info__body text-md font-normal max-w-[350px] break-words text-left">
        {props.content}
      </p>
    </div>
  );
};
