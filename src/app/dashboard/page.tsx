"use client";

import { useEffect, useState } from "react";
import PrimaryButton from "../component/Button";
import { ToggleDownMenu } from "../component/ToggleMenu";
import Card from "../component/Card";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useEffectOnce,
} from "@/src/context/CustomHook";
import { ContainerLoading } from "../component/Loading";
import { EditProfile } from "../component/Modals/User";
import { signOut } from "next-auth/react";
import React from "react";
import { Userdatastate } from "@/src/types/user.type";
import { ProductState } from "@/src/types/product.type";
import { Orderpricetype } from "@/src/types/order.type";
import useCheckSession from "@/src/hooks/useCheckSession";

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
  const { handleCheckSession } = useCheckSession();
  const fetchuser = async (type: "userinfo" | "wishlist") => {
    const isValidSession = await handleCheckSession();
    if (!isValidSession) return;
    const asyncfetch = async () => {
      const URL = `/api/users/info?ty=${type}`;
      const userreq = await ApiRequest(
        URL,
        undefined,
        "GET",
        undefined,
        undefined,
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
    <main className="user_dashboard__container flex flex-col items-center gap-y-12 w-full mt-20 pb-16 px-4">
      {/* Profile Section Header */}
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 max-large_phone:text-2xl">
          My Profile
        </h1>
        <p className="text-gray-600 max-large_phone:text-sm">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="profile__section w-full max-w-5xl">
        <div className="profiledetail__section relative w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="min-h-100">
              <ContainerLoading />
            </div>
          ) : (
            <div className="p-8 max-large_phone:p-6">
              {/* Edit Button */}
              <div className="flex justify-end mb-6">
                <PrimaryButton
                  type="button"
                  postion="relative"
                  disable={loading}
                  text={`${userdata.open.edit ? "Done" : "Edit Profile"}`}
                  textsize="14px"
                  radius="10px"
                  color={userdata.open.edit ? "#10b981" : "#495464"}
                  width="auto"
                  onClick={() =>
                    setdata((prev) => ({
                      ...prev,
                      open: { ...prev.open, edit: !prev.open.edit },
                    }))
                  }
                  height="44px"
                />
              </div>

              {/* Profile Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Full Name
                      </p>
                      <h3 className="text-lg font-medium text-gray-800">
                        {userinfo.firstname} {userinfo.lastname}
                      </h3>
                    </div>
                    {userdata.open.edit && (
                      <button
                        type="button"
                        onClick={() => handleEdit("name")}
                        className="ml-3 text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Email Address
                      </p>
                      <h3 className="text-lg font-medium text-gray-800 break-all">
                        {userinfo.email}
                      </h3>
                    </div>
                    {userdata.open.edit && (
                      <button
                        type="button"
                        onClick={() => handleEdit("email")}
                        className="ml-3 text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Shipping Address
                      </p>
                      <button
                        type="button"
                        onClick={() => handleEdit("shipping")}
                        className="text-white bg-incart hover:bg-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95"
                      >
                        View Details
                      </button>
                    </div>
                    {userdata.open.edit && (
                      <button
                        type="button"
                        onClick={() => handleEdit("shipping")}
                        className="ml-3 text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Password
                      </p>
                      <h3 className="text-lg font-medium text-gray-800">
                        ••••••••
                      </h3>
                    </div>
                    {userdata.open.edit && (
                      <button
                        type="button"
                        onClick={() => handleEdit("password")}
                        className="ml-3 text-blue-600 hover:text-blue-800 font-semibold text-sm transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Account Actions Section */}
      <div className="setting__section w-full max-w-5xl flex flex-col gap-y-6">
        {/* Device Management Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <a
            href="/dashboard/devices"
            className="w-full px-8 py-6 flex items-center justify-between bg-white text-gray-800 hover:bg-gray-50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">🔐</span>
              <div className="text-left">
                <h3 className="text-xl font-bold max-large_phone:text-lg">
                  Device Management
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your active sessions and devices
                </p>
              </div>
            </div>
            <span className="text-gray-600 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
        </div>

        {userinfo.role === "USER" && (
          <>
            {/* Wishlist Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <button
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
                className={`w-full px-8 py-6 flex items-center justify-between transition-all ${
                  userdata.open.whilist
                    ? "bg-linear-to-r from-[#2F4865] to-[#1e3a52] text-white"
                    : "bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">❤️</span>
                  <div className="text-left">
                    <h3 className="text-xl font-bold max-large_phone:text-lg">
                      Wishlist Products
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        userdata.open.whilist
                          ? "text-gray-200"
                          : "text-gray-500"
                      }`}
                    >
                      View your saved items
                    </p>
                  </div>
                </div>
                <span
                  className={`transform transition-transform ${
                    userdata.open.whilist ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              <ToggleDownMenu open={userdata.open.whilist}>
                <div className="p-6 bg-gray-50">
                  {loading ? (
                    <div className="min-h-50">
                      <ContainerLoading />
                    </div>
                  ) : wishlist && wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {wishlist.map((prod) => (
                        <Card
                          key={prod.id}
                          id={prod.id}
                          name={prod.name}
                          price={prod.price.toFixed(2)}
                          discount={prod.discount as Orderpricetype}
                          img={prod.covers}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">
                        Your wishlist is empty
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Start adding products you love!
                      </p>
                    </div>
                  )}
                </div>
              </ToggleDownMenu>
            </div>

            {/* Delete Account Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
              <button
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
                className="w-full px-8 py-6 flex items-center justify-between bg-linear-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">⚠️</span>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-red-600 max-large_phone:text-lg">
                      Delete My Account
                    </h3>
                    <p className="text-sm text-red-500 mt-1">
                      Permanently remove your account and data
                    </p>
                  </div>
                </div>
                <span className="text-red-600 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>
            </div>
          </>
        )}
      </div>
      {openmodal.editprofile && <EditProfile type={userdata.open.edittype} />}
    </main>
  );
}
