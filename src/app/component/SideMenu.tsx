"use client";
import { StaticImageData } from "next/image";
import PrimaryButton from "./Button";
import React, { SetStateAction, useEffect, useState } from "react";
import { CardSkeleton, SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGlobalContext } from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useClickOutside,
  useScreenSize,
} from "@/src/context/CustomHook";
import { errorToast, successToast } from "./Loading";
import { motion } from "framer-motion";
import { Productordertype, totalpricetype } from "@/src/context/OrderContext";
import { Createorder } from "../checkout/action";
import {
  Bin_Icon,
  CloseVector,
  EditIcon,
  InventoryIcon,
  OrderIcon,
  PencilEditIcon,
  ProfileIcon,
  UserIcon,
} from "./Asset";
import { Homeeditmenu } from "./HomePage/EditMenu";
import { Addicon } from "./Icons/Homepage";
import { Homeitemtype } from "../severactions/containeraction";

import { Sessiontype } from "@/src/context/GlobalType.type";

interface accountmenuprops {
  setProfile: (value: SetStateAction<boolean>) => void;
  session?: Sessiontype;
}

const AccountMenuItems = [
  {
    name: "Profile",
    icon: <ProfileIcon />,
    link: "/dashboard",
    isAdmin: true,
    isUser: true,
  },
  {
    name: "My Order",
    icon: <OrderIcon />,
    link: "/dashboard/order",
    isAdmin: true,
    isUser: true,
  },
  {
    name: "Inventory",
    icon: <InventoryIcon />,
    link: "/dashboard/inventory",
    isAdmin: true,
    isUser: false,
  },
  {
    name: "Users",
    icon: <UserIcon />,
    link: "/dashboard/usermanagement",
    isAdmin: true,
    isUser: false,
  },
  {
    name: "Edit Home",
    icon: <EditIcon />,
    link: "",
    isAdmin: true,
    isUser: false,
  },
];

export default function AccountMenu(props: accountmenuprops) {
  const pathname = usePathname();

  const { openmodal, setopenmodal } = useGlobalContext();
  const [loading, setloading] = useState(false);
  const [Homeitems, sethomeitems] = useState<Homeitemtype[]>([]);
  const [isEdit, setisEdit] = useState(false);
  const [selected, setselected] = useState<number[] | undefined>([]);

  const router = useRouter();
  const ref = useClickOutside(() => props.setProfile(false));
  const { isMobile } = useScreenSize();

  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const handleSignOut = async () => {
    setloading(true);

    const deleteSession = await ApiRequest({
      url: "/api/users/logout",
      method: "DELETE",
    });

    if (!deleteSession.success) {
      errorToast(deleteSession.message ?? "Error occured");
    } else {
      await signOut();
    }

    setloading(false);
  };

  const handleEdit = async () => {
    if (!isEdit) {
      setisEdit(true);
    } else if (isEdit) {
      //edit index of home items

      setloading(true);
      const updateidx = await ApiRequest({
        url: "/api/home",
        method: "PUT",
        data: {
          ty: "idx",
          edititems: Homeitems.map((i, idx) => ({ id: i.id, idx })),
        },
      });

      setloading(false);
      if (!updateidx.success) {
        errorToast("Error Occurred");
        return;
      }

      setisEdit(false);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!selected?.length) {
      errorToast("No item selected");
      return;
    }
    const homeitem_id = selected.map((idx) => Homeitems[idx].id);

    const deleteItemsAsync = async () => {
      const deletereq = await ApiRequest({
        url: "/api/home",
        method: "DELETE",
        data: { id: homeitem_id },
      });

      if (!deletereq.success) {
        errorToast(deletereq.message ?? "Error Occurred");
        return;
      }

      const updatedItems = Homeitems.filter((i) => !homeitem_id.includes(i.id));
      sethomeitems(updatedItems);
      setselected(undefined);
      setisEdit(false);
      successToast("Deleted Successfully");
    };

    await Delayloading(deleteItemsAsync, setloading, 500);
  };

  const handleOnEdit = (idx: number) => {
    const updateselected = [...(selected ?? [])];
    const isExist = updateselected.findIndex((i) => i === idx);
    if (isExist !== -1) {
      updateselected.splice(isExist, 1);
    } else {
      updateselected.push(idx);
    }
    setselected(updateselected);
  };

  return (
    <motion.aside
      ref={ref}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => props.setProfile(true)}
      className="fixed right-0 top-0 w-[430px] max-small_phone:w-full h-full z-[99] bg-[#FFFFFF] flex flex-col items-center"
    >
      {openmodal?.editHome ? (
        <div className="w-[90%] h-full flex flex-col items-center gap-y-10">
          <h3
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, editHome: false }))
            }
            className="w-full h-fit text-left text-lg font-bold cursor-pointer  transition hover:text-white active:text-white pl-2"
          >
            {`< Back`}
          </h3>
          <Homeeditmenu
            isEdit={isEdit}
            onEdit={handleOnEdit}
            items={Homeitems}
            setItems={sethomeitems}
          />
          <div className="w-full h-[40px] flex flex-row gap-x-5 justify-start">
            <PrimaryButton
              type="button"
              text={isEdit ? "Delete" : "Add New"}
              color={isEdit ? "lightcoral" : "white"}
              height="50px"
              width="100%"
              hoverColor="lightgray"
              textcolor={isEdit ? "white" : "black"}
              status={loading ? "loading" : "authenticated"}
              disable={isEdit && selected?.length === 0}
              radius="10px"
              border="1px solid lightgray"
              onClick={() =>
                isEdit
                  ? handleDelete()
                  : setopenmodal((prev) => ({ ...prev, homecontainer: true }))
              }
              Icon={isEdit ? <Bin_Icon /> : <Addicon />}
            />

            <PrimaryButton
              type="button"
              onClick={() => handleEdit()}
              text={isEdit ? "Done" : "Edit"}
              radius="10px"
              height="50px"
              hoverColor="lightgray"
              width="100%"
              border="1px solid lightgray"
              color="white"
              textcolor="black"
              Icon={
                <div className="w-[30px] h-[30px] bg-white rounded-full">
                  <PencilEditIcon />
                </div>
              }
            />
          </div>
        </div>
      ) : (
        <>
          <ul className="menu_container flex flex-col items-center w-full gap-y-10 mt-[10vh] mb-[10vh]">
            {AccountMenuItems.filter((i) =>
              pathname !== "/" ? i.name !== AccountMenuItems[4].name : true
            )
              .filter((i) =>
                props.session?.role === "ADMIN" ? i.isAdmin : i.isUser
              )
              .map((item, idx) => (
                <li
                  key={idx}
                  className="side_link w-[80%] h-[50px] text-center font-bold text-lg rounded-md transition hover:bg-gray-200 active:bg-gray-200 "
                >
                  {item.link === "" ? (
                    <div
                      onClick={() => {
                        setopenmodal((prev) => ({ ...prev, editHome: true }));
                      }}
                      className="w-full h-full flex flex-row items-center cursor-pointer gap-x-5 pl-2 rounded-lg transition hover:bg-gray-200 active:bg-gray-200"
                    >
                      {item.icon}
                      <h3 className="text-lg font-bold">{item.name}</h3>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        router.push(item.link);
                        router.refresh();
                        if (isMobile) props.setProfile(false);
                      }}
                      className="w-full h-full flex flex-row items-center gap-x-5 pl-2 rounded-lg transition hover:bg-gray-200 active:bg-gray-200 cursor-pointer"
                    >
                      {item.icon}
                      <h3 className="text-lg font-bold">{item.name}</h3>
                    </div>
                  )}
                </li>
              ))}
          </ul>
          <PrimaryButton
            text="Logout"
            type="button"
            color="#F08080"
            width="80%"
            status={loading ? "loading" : "authenticated"}
            radius="10px"
            onClick={() => handleSignOut()}
          />
        </>
      )}
      {isMobile && (
        <div
          onClick={() => props.setProfile(false)}
          className="w-fit h-fit absolute top-1 right-1"
        >
          <CloseVector width="35px" height="35px" />
        </div>
      )}
    </motion.aside>
  );
}

interface cardmenuprops {
  img: string | StaticImageData;
  setcart: (value: SetStateAction<boolean>) => void;
  setcarttotal: React.Dispatch<React.SetStateAction<number>>;
}

export function CartMenu(props: cardmenuprops) {
  const { setreloadcart } = useGlobalContext();
  const router = useRouter();
  const searchparams = useSearchParams();
  const [cartItem, setitem] = useState<Array<Productordertype> | []>([]);
  const [reloaddata, setreloaddata] = useState(true);
  const ref = useClickOutside(() => props.setcart(false));

  const [loading, setloading] = useState({
    fetch: true,
    checkout: false,
  });

  const [totalprice, settotal] = useState<totalpricetype | undefined>(
    undefined
  );

  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const fetchcart = async () => {
    const asyncfetchcart = async () => {
      const response = await ApiRequest({
        url: "/api/order/cart",
        method: "GET",
      });

      if (response.success) {
        setitem(response.data);
        settotal({ subtotal: response.total ?? 0, total: response.total ?? 0 });
      }
    };

    await Delayloading(
      asyncfetchcart,
      (value) => setloading((prev) => ({ ...prev, fetch: value })),
      500
    );

    setreloaddata(false);
  };

  useEffect(() => {
    if (reloaddata) fetchcart();
  }, [reloaddata]);

  const removecart = async (id: number) => {
    const deletereq = await ApiRequest({
      url: "/api/order/cart",
      method: "DELETE",
      data: { id },
    });
    if (!deletereq.success) {
      errorToast("Can't Delete Cart");
      return;
    }
    props.setcarttotal((prev) => (prev !== 0 ? prev - 1 : prev));
    setreloadcart(true);
    setreloaddata(true);
  };

  const subprice = totalprice
    ? parseFloat(totalprice.subtotal.toString()).toFixed(2)
    : `0.00`;

  const handleCheckout = async () => {
    const params = new URLSearchParams(searchparams);

    if (!cartItem || cartItem.length === 0) {
      errorToast("No items in cart");
      return;
    }

    if (totalprice && cartItem.length !== 0) {
      const cartitem_id = cartItem.map((i) => i.id);
      const makereq = Createorder.bind(null, {
        price: totalprice,
        incartProduct: cartitem_id,
      });
      setloading((prev) => ({ ...prev, checkout: true }));
      const createOrder = await makereq();
      setloading((prev) => ({ ...prev, checkout: false }));
      if (!createOrder.success) {
        errorToast("Error Occured");
        return;
      }

      params.set("orderid", createOrder.data.encrypt ?? "");
      params.set("step", "1");
      router.push(`/checkout?${params.toString()}`);
    }
  };
  return (
    <aside
      ref={ref}
      onMouseEnter={() => (document.body.style.overflow = "hidden")}
      onMouseLeave={() => {
        document.body.style.overflow = "auto";
        props.setcart(false);
      }}
      className="Cart__Sidemenu fixed h-full w-[700px] max-large_tablet:w-[550px] max-large_phone:w-[100vw] right-0 bg-white z-40 flex flex-col items-center gap-y-5 transition-all"
    >
      <div
        onClick={() => props.setcart(false)}
        className="w-fit h-fit absolute top-1 right-1"
      >
        <CloseVector width="30px" height="30px" />
      </div>
      <h1 className="heading text-xl font-bold text-center w-full">
        Shopping Cart <span>( {cartItem?.length} item )</span>
      </h1>
      <div className="card_container flex flex-col w-[95%] gap-y-5 h-full max-h-[70vh] overflow-y-auto">
        {(!cartItem || cartItem.length === 0) && (
          <h3 className="text-xl font-bold text-red-500 w-full h-fit text-center">
            No items
          </h3>
        )}
        {loading.fetch &&
          Array.from({ length: 3 }).map((_, idx) => <CardSkeleton key={idx} />)}

        {cartItem?.map((i, idx) => {
          return (
            <SecondayCard
              key={idx}
              id={i.id}
              img={
                i.product?.covers.length !== 0
                  ? (i.product?.covers[0].url as string)
                  : props.img
              }
              name={i.product?.name ?? ""}
              maxqty={i.maxqty}
              selectedqty={i.quantity}
              selecteddetail={i.selectedvariant}
              price={i.price}
              removecart={() => removecart(i.id)}
              settotal={settotal}
              setreloadcart={setreloaddata}
            />
          );
        })}
      </div>
      <div className="totalprice w-[90%] text-left font-medium flex flex-col gap-y-3">
        <h5 className="text-lg text-[15px]">Subtotal: {`$${subprice}`} </h5>
        <h5 className="textprice text-[15px]">Shipping: </h5>
        <h3 className="text-xl font-bold">Total: </h3>
      </div>
      <PrimaryButton
        type="button"
        text="Check Out"
        onClick={() => handleCheckout()}
        disable={cartItem?.length === 0}
        width="90%"
        height="50px"
        radius="10px"
        status={loading.checkout ? "loading" : "authenticated"}
      />
    </aside>
  );
}
