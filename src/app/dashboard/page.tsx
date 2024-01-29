"use client";

import { useSession } from "next-auth/react";

import { useEffect, useState } from "react";
import Default from "../Asset/Image/default.png";
import PrimaryButton from "../component/Button";
import { ToggleDownMenu } from "../component/ToggleMenu";
import Card from "../component/Card";
import { Userdatastate, useGlobalContext } from "@/src/context/GlobalContext";
import { EditProfile } from "../component/Modals";
import { ApiRequest } from "@/src/context/CustomHook";
import LoadingIcon, { BlurLoading, LoadingText } from "../component/Loading";
import { loadavg } from "os";

interface userdata extends Userdatastate {
  open: {
    whilist: boolean;
    rating: boolean;
    edit: boolean;
    edittype: "email" | "password" | "shipping" | "name" | "none";
  };
}
export default function UserDashboard() {
  const {
    openmodal,
    setopenmodal,
    setisLoading,
    isLoading,
    userinfo,
    setuserinfo,
  } = useGlobalContext();
  const [userdata, setdata] = useState<userdata>({
    open: {
      whilist: true,
      rating: true,
      edit: false,
      edittype: "none",
    },
  });
  const [loading, setloading] = useState(true);
  const fetchuser = async () => {
    const URL = `/api/auth/users/info?ty=userinfo`;
    const userreq = await ApiRequest(
      URL,
      setisLoading,
      "GET",
      undefined,
      undefined,
      "userinfo"
    );
    setloading(false);
    if (userreq.success) {
      setuserinfo(userreq.data);
    }
  };
  useEffect(() => {
    fetchuser();
  }, []);

  const handleEdit = (type: typeof userdata.open.edittype) => {
    setdata((prev) => ({ ...prev, open: { ...prev.open, edittype: type } }));
    setopenmodal((prev) => ({ ...prev, editprofile: true }));
  };
  return (
    <main className="user_dashboard__container flex flex-col items-center gap-y-28  w-full mt-20">
      <div className="profile__section w-[80%] flex flex-row items-center justify-evenly">
        <div className="profiledetail__section relative w-full min-h-[350px] flex flex-row items-start justify-evenly bg-gray-100 rounded-lg p-10">
          {loading ? (
            <LoadingIcon />
          ) : (
            <>
              <div className="profileheader grid gap-y-10">
                <h3 className="header font-bold text-lg">Fullname</h3>
                <h3 className="header font-bold text-lg">Email Address</h3>
                <h3 className="header font-bold text-lg">Shipping Address</h3>
                <h3 className="header font-bold text-lg">Password</h3>
              </div>
              <div className="profiledetail  grid gap-y-10">
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
          <PrimaryButton
            type="button"
            postion="absolute"
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
              <Card name="Products name" price="$20.00" img={[]} />
              <Card name="Products name" price="$20.00" img={[]} />
              <Card name="Products name" price="$20.00" img={[]} />
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
              <Card name="Products name" price="$20.00" img={[]} />
              <Card name="Products name" price="$20.00" img={[]} />
              <Card name="Products name" price="$20.00" img={[]} />
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
      {openmodal.editprofile && <EditProfile type={userdata.open.edittype} />}
    </main>
  );
}
