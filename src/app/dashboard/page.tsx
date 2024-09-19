"use client";

import { useEffect, useState } from "react";
import PrimaryButton from "../component/Button";
import { ToggleDownMenu } from "../component/ToggleMenu";
import Card from "../component/Card";
import {
  ProductState,
  Userdatastate,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
} from "@/src/context/CustomHook";
import { ContainerLoading } from "../component/Loading";
import { EditProfile } from "../component/Modals/User";
import { signOut } from "next-auth/react";

interface userdata extends Userdatastate {
  open: {
    whilist: boolean;

    edit: boolean;
    edittype: "email" | "password" | "shipping" | "name" | "none";
  };
}
export default function UserDashboard() {
  const { openmodal, setopenmodal, userinfo, setuserinfo } = useGlobalContext();
  const [userdata, setdata] = useState<userdata>({
    open: {
      whilist: false,
      edit: false,
      edittype: "none",
    },
  });
  const [wishlist, setwishlist] = useState<ProductState[] | null>(null);
  const [loading, setloading] = useState(false);
  const fetchuser = async (type: "userinfo" | "wishlist") => {
    const asyncfetch = async () => {
      const URL = `/api/users/info?ty=${type}`;
      const userreq = await ApiRequest(
        URL,
        undefined,
        "GET",
        undefined,
        undefined
      );

      if (userreq.success) {
        type === "userinfo"
          ? setuserinfo(userreq.data)
          : setwishlist(userreq.data);
      }
    };

    await Delayloading(asyncfetch, setloading, 1000);
  };

  useEffectOnce(() => {
    fetchuser("userinfo");
  });

  useEffect(() => {
    if (userdata.open.whilist) {
      fetchuser("wishlist");
    }
  }, [userdata.open.whilist]);

  const handleEdit = (type: typeof userdata.open.edittype) => {
    setdata((prev) => ({ ...prev, open: { ...prev.open, edittype: type } }));
    setopenmodal((prev) => ({ ...prev, editprofile: true }));
  };
  return (
    <main className="user_dashboard__container flex flex-col items-center gap-y-28  w-full mt-20">
      <div className="profile__section w-[80%] flex flex-row items-center justify-evenly max-large_phone:w-[95%] max-large_phone:overflow-x-auto max-smallest_phone:w-full">
        <div className="profiledetail__section relative w-full min-w-[550px] min-h-[350px] flex flex-row items-start justify-evenly max-smallest_phone:justify-between bg-gray-100 rounded-lg p-10">
          {loading ? (
            <ContainerLoading />
          ) : (
            <>
              <div className="profileheader grid gap-y-10">
                <PrimaryButton
                  type="button"
                  postion="relative"
                  top="10px"
                  right="2%"
                  disable={loading}
                  text={`${userdata.open.edit ? "Done" : "Edit"}`}
                  radius="10px"
                  color={userdata.open.edit ? "lightcoral" : "#495464"}
                  width="70px"
                  onClick={() =>
                    setdata((prev) => ({
                      ...prev,
                      open: { ...prev.open, edit: !prev.open.edit },
                    }))
                  }
                  height="41px"
                />
                <h3 className="header font-bold text-lg">Fullname</h3>
                <h3 className="header font-bold text-lg">Email Address</h3>
                <h3 className="header font-bold text-lg">Shipping Address</h3>
                <h3 className="header font-bold text-lg">Password</h3>
              </div>
              <div className="profiledetail  grid gap-y-10">
                <h3></h3>
                <h3></h3>

                <h3 className="detail font-normal text-lg">
                  {" "}
                  {userinfo.firstname} {userinfo.lastname}{" "}
                </h3>
                <h3 className="detail font-normal text-lg">
                  {" "}
                  {userinfo.email}{" "}
                </h3>
                <h3
                  onClick={() => handleEdit("shipping")}
                  className="detail font-bold bg-[#495464] text-white rounded-lg text-center transition hover:bg-black active:bg-black p-2 cursor-pointer"
                >
                  {" "}
                  View{" "}
                </h3>
                <h3 className="detail font-normal text-lg"> ******** </h3>
              </div>
              {userdata.open.edit && (
                <div className="profileedit_container w-fit grid gap-y-10">
                  <h3></h3>
                  <h3></h3>
                  <h3
                    onClick={() => handleEdit("name")}
                    className="edit text-lg text-red-400 font-bold cursor-pointer transition hover:text-black active:text-black"
                  >
                    Edit
                  </h3>
                  <h3
                    onClick={() => handleEdit("email")}
                    className="edit text-lg text-red-400 font-bold cursor-pointer transition hover:text-black active:text-black"
                  >
                    Edit
                  </h3>

                  <h3
                    onClick={() => handleEdit("shipping")}
                    className="edit text-lg text-red-400 font-bold cursor-pointer transition hover:text-black active:text-black"
                  >
                    Edit
                  </h3>
                  <h3
                    onClick={() => handleEdit("password")}
                    className="edit text-lg text-red-400 font-bold cursor-pointer transition hover:text-black active:text-black"
                  >
                    Edit
                  </h3>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="setting__section w-[80%] h-fit flex flex-col items-center gap-y-7">
        {userinfo.role === "USER" && (
          <>
            <PrimaryButton
              text="Whilist Products"
              type="button"
              width="100%"
              hoverTextColor="white"
              hoverColor="#2F4865"
              radius="10px"
              height="50px"
              border="2px solid black"
              color={userdata.open.whilist ? "#2F4865" : "white"}
              textalign="left"
              textcolor={userdata.open.whilist ? "white" : "black"}
              textsize="20px"
              postion={userdata.open.whilist ? "relative" : "sticky"}
              top="0"
              zI="20"
              onClick={() => {
                userdata.open.whilist && setwishlist(null);
                setdata({
                  ...userdata,
                  open: {
                    ...userdata.open,
                    whilist: !userdata.open.whilist,
                  },
                });
              }}
            />

            <ToggleDownMenu open={userdata.open.whilist}>
              <div className="products w-full h-full grid grid-cols-2 gap-x-5 place-items-center place-content-start">
                {wishlist?.map((prod) => (
                  <Card
                    key={prod.id}
                    id={prod.id}
                    name={prod.name}
                    price={prod.price.toFixed(2)}
                    discount={prod.discount}
                    img={prod.covers}
                  />
                ))}
              </div>
            </ToggleDownMenu>
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
              onClick={() =>
                setopenmodal((prev) => ({
                  ...prev,
                  confirmmodal: {
                    Warn: "Your Account Will Be Deleted ",
                    open: true,
                    confirm: false,
                    type: "userinfo",
                    closecon: "",
                    onAsyncDelete: async () => {
                      await signOut();
                    },
                  },
                }))
              }
            />
          </>
        )}
      </div>
      {openmodal.editprofile && <EditProfile type={userdata.open.edittype} />}
    </main>
  );
}
