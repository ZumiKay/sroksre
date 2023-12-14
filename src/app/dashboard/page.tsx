"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import Default from "../Asset/Image/default.png";
import PrimaryButton from "../component/Button";
import { ToggleDownMenu } from "../component/ToggleMenu";
import Card from "../component/Card";

function extractNames(fullName: string) {
  const nameParts = fullName.split(" ");

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" "); // Join the remaining parts to get the last name

  return {
    firstName,
    lastName,
  };
}
interface userdata {
  email?: string;
  firstname?: string;
  lastname?: string;
  picture?: any;
  open: {
    whilist: boolean;
    rating: boolean;
  };
}
export default function UserDashboard() {
  const session = useSession();
  const [userdata, setdata] = useState<userdata>({
    open: {
      whilist: true,
      rating: true,
    },
  });
  useEffect(() => {
    if (session.data?.user) {
      const name = extractNames(session.data?.user?.name as string);

      setdata({
        ...userdata,
        email: session.data.user.email as string,
        firstname: name.firstName,
        lastname: name.lastName,
        picture: session.data.user.image ?? Default,
      });
    }
  }, [session]);

  return (
    <main className="user_dashboard__container flex flex-col items-center gap-y-28  w-full mt-20">
      <div className="profile__section w-[80%] flex flex-row items-center justify-evenly">
        <Image
          src={Default}
          alt="profile"
          className="profile object-cover border-2 border-gray-400 w-[220px] h-[220px]"
        />
        <div className="profiledetail__section w-full flex flex-row items-start justify-evenly">
          <div className="profileheader grid gap-y-10">
            <h3 className="header font-bold text-lg">Fullname</h3>
            <h3 className="header font-bold text-lg">Email Address</h3>
            <h3 className="header font-bold text-lg">Shipping Address</h3>
            <h3 className="header font-bold text-lg">Password</h3>
          </div>
          <div className="profiledetail grid gap-y-10">
            <h3 className="detail font-normal text-lg">
              {" "}
              {userdata.firstname} {userdata.lastname}{" "}
            </h3>
            <h3 className="detail font-normal text-lg"> {userdata.email} </h3>
          </div>
          <PrimaryButton
            type="button"
            text="Edit"
            radius="10px"
            color="#495464"
            width="70px"
            height="41px"
          />
        </div>
      </div>
      <div className="setting__section w-[80%] flex flex-col items-center gap-y-7">
        <div className="whilist_container flex flex-col items-start gap-y-10 w-full max-h-[77vh] overflow-y-auto">
          <PrimaryButton
            text="Whilist Products"
            type="button"
            width="100%"
            hoverTextColor="white"
            hoverColor="#2F4865"
            radius="10px"
            height="50px"
            border="2px solid black"
            color="white"
            textalign="left"
            textcolor="black"
            textsize="20px"
            postion={userdata.open.whilist ? "relative" : "sticky"}
            top="0"
            zI="20"
            onClick={() =>
              setdata({
                ...userdata,
                open: {
                  ...userdata.open,
                  whilist: !userdata.open.whilist,
                },
              })
            }
          />
          <ToggleDownMenu open={userdata.open.whilist}>
            <div className="products grid grid-cols-2 gap-x-[80%]">
              <Card name="Products name" price="$20.00" img={Default} />
              <Card name="Products name" price="$20.00" img={Default} />
              <Card name="Products name" price="$20.00" img={Default} />
            </div>
          </ToggleDownMenu>
        </div>
        <div className="whilist_container flex flex-col items-start gap-y-10 w-full max-h-[77vh] overflow-y-auto">
          <PrimaryButton
            text="Rating Products"
            type="button"
            width="100%"
            hoverTextColor="white"
            hoverColor="#2F4865"
            radius="10px"
            height="50px"
            border="2px solid black"
            color="white"
            textalign="left"
            textcolor="black"
            textsize="20px"
            postion={userdata.open.rating ? "relative" : "sticky"}
            top="0"
            zI="20"
            onClick={() =>
              setdata({
                ...userdata,
                open: {
                  ...userdata.open,
                  rating: !userdata.open.rating,
                },
              })
            }
          />
          <ToggleDownMenu open={userdata.open.rating}>
            <div className="products grid grid-cols-2 gap-x-[80%]">
              <Card name="Products name" price="$20.00" img={Default} />
              <Card name="Products name" price="$20.00" img={Default} />
              <Card name="Products name" price="$20.00" img={Default} />
            </div>
          </ToggleDownMenu>
        </div>
        <PrimaryButton
          text="Delete My Account"
          type="button"
          width="100%"
          radius="10px"
          hoverTextColor="white"
          hoverColor="#2F4865"
          height="50px"
          color="#F08080"
          textalign="left"
          textcolor="white"
          textsize="20px"
        />
      </div>
    </main>
  );
}
