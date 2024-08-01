"use client";
import { StaticImageData } from "next/image";
import PrimaryButton, { Selection } from "./Button";
import React, { ChangeEvent, SetStateAction, useEffect, useState } from "react";
import { SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal from "./Modals";
import {
  BannerInitialize,
  FilterValue,
  Productinitailizestate,
  PromotionInitialize,
  Sessiontype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useClickOutside,
  useEffectOnce,
} from "@/src/context/CustomHook";
import LoadingIcon, {
  ContainerLoading,
  LoadingText,
  errorToast,
  successToast,
} from "./Loading";
import { motion } from "framer-motion";

import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { ToggleSelect } from "./ToggleMenu";
import { Deletecart, Getcarts } from "../product/detail/[id]/action";
import { Productordertype, totalpricetype } from "@/src/context/OrderContext";
import { Createorder } from "../checkout/action";
import { formatDate } from "./EmailTemplate";
import {
  getSubCategories,
  InventoryParamType,
} from "../dashboard/inventory/varaint_action";
import { BannerSize, BannerType } from "./Modals/Banner";
import Link from "next/link";
import {
  Bin_Icon,
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

interface accountmenuprops {
  setProfile: (value: SetStateAction<boolean>) => void;
  session?: Sessiontype;
}

const AccountMenuItems = [
  {
    name: "Profile",
    icon: <ProfileIcon />,
    link: "/dashboard",
  },
  {
    name: "My Order",
    icon: <OrderIcon />,
    link: "/dashboard/order",
  },
  {
    name: "Inventory",
    icon: <InventoryIcon />,
    link: "/dashboard/inventory",
  },
  {
    name: "Users",
    icon: <UserIcon />,
    link: "/dashboard/usermanagement",
  },
  {
    name: "Edit Home",
    icon: <EditIcon />,
    link: "",
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

  const handleSignOut = async () => {
    setloading(true);

    const deleteSession = await ApiRequest(
      "/api/users/logout",
      undefined,
      "DELETE"
    );

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
      const updateidx = await ApiRequest(
        "/api/home",
        undefined,
        "PUT",
        "JSON",
        { ty: "idx", edititems: Homeitems.map((i, idx) => ({ id: i.id, idx })) }
      );

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
      const deletereq = await ApiRequest(
        "/api/home",
        undefined,
        "DELETE",
        "JSON",
        { id: homeitem_id }
      );

      if (!deletereq.success) {
        errorToast(deletereq.message ?? "Error Occurred");
        return;
      }

      const updatedItems = Homeitems.filter((i) => !homeitem_id.includes(i.id));
      sethomeitems(updatedItems);
      setselected(undefined);
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
      className="fixed right-0 top-0 w-[20vw] h-full z-40 bg-[#FFFFFF] flex flex-col items-center"
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
            ).map((item, idx) => (
              <li
                key={idx}
                className="side_link w-[80%] h-[50px] text-center font-bold text-lg rounded-md transition hover:bg-gray-200 active:bg-gray-200 "
              >
                {item.link === "" ? (
                  <div
                    onClick={() => {
                      setopenmodal((prev) => ({ ...prev, editHome: true }));
                      props.setProfile(false);
                    }}
                    className="w-full h-full flex flex-row items-center gap-x-5 pl-2 rounded-lg transition hover:bg-gray-200 active:bg-gray-200"
                  >
                    {item.icon}
                    <h3 className="text-lg font-bold cursor-pointer">
                      {item.name}
                    </h3>
                  </div>
                ) : (
                  <Link
                    href={item.link}
                    className="w-full h-full flex flex-row items-center gap-x-5 pl-2 rounded-lg transition hover:bg-gray-200 active:bg-gray-200"
                  >
                    {item.icon}
                    <h3 className="text-lg font-bold">{item.name}</h3>
                  </Link>
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
    </motion.aside>
  );
}
interface cardmenuprops {
  img: string | StaticImageData;
  setcart: (value: SetStateAction<boolean>) => void;
}

export function CartMenu(props: cardmenuprops) {
  const router = useRouter();
  const searchparams = useSearchParams();
  const [cartItem, setitem] = useState<Array<Productordertype> | []>([]);
  const [loading, setloading] = useState({
    fetch: true,
    checkout: false,
  });

  const [totalprice, settotal] = useState<totalpricetype | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchcart = async () => {
      const carts = await Getcarts();
      setloading((prev) => ({ ...prev, fetch: false }));

      settotal(carts.total);

      setitem(carts.data);
    };

    fetchcart();
  }, []);

  const removecart = async (id: number, idx: number) => {
    const deletereq = Deletecart.bind(null, id);
    const makereq = await deletereq();
    if (!makereq.success) {
      errorToast("Can't delete cart");
      return;
    }
    let updatecart = [...cartItem];

    updatecart.splice(idx, 1);
    settotal(makereq.total);
    setitem(updatecart);
    router.refresh();
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
      onMouseEnter={() => (document.body.style.overflow = "hidden")}
      onMouseLeave={() => {
        document.body.style.overflow = "auto";
        props.setcart(false);
      }}
      className="Cart__Sidemenu fixed h-full w-[700px] right-0 bg-white z-40 flex flex-col items-center gap-y-5 pb-2"
    >
      <h1 className="heading text-xl font-bold text-center w-full">
        Shopping Cart <span>( {cartItem?.length} item )</span>
      </h1>
      <div className="card_container flex flex-col w-[95%] gap-y-5 h-full max-h-[75vh] overflow-y-auto">
        {loading.fetch && <LoadingText style={{ left: "40%" }} />}
        {(!cartItem || cartItem.length === 0) && (
          <h3 className="text-xl font-bold text-red-500 w-full h-fit text-center">
            No items
          </h3>
        )}
        {cartItem?.map((i, idx) => {
          return (
            <SecondayCard
              key={i.id}
              id={i.id}
              img={
                i.product?.covers.length !== 0
                  ? (i.product?.covers[0].url as string)
                  : props.img
              }
              name={i.product?.name ?? ""}
              maxqty={i.maxqty}
              selectedqty={i.quantity}
              selecteddetail={i.details.filter((i) => i)}
              price={i.price}
              removecart={() => removecart(i.id, idx)}
              settotal={settotal}
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
export const ConfirmModal = () => {
  const {
    openmodal,
    setopenmodal,
    isLoading,
    setisLoading,
    allData,
    setalldata,
    product,
    setproduct,
    banner,
    setbanner,
    setpromotion,
    setinventoryfilter,
    globalindex,
    setglobalindex,
    setreloaddata,
  } = useGlobalContext();
  const handleConfirm = async (confirm: boolean) => {
    if (confirm) {
      const URL = "/api/image";
      if (
        openmodal.confirmmodal.closecon === "createProduct" &&
        globalindex.producteditindex === -1 &&
        product.covers.length > 0
      ) {
        const images = product.covers.map((i) => i.name);
        const deleteimage = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          { names: images }
        );
        if (!deleteimage.success) {
          errorToast("Error Occured Reload Required");
          return;
        }
        setproduct(Productinitailizestate);
      } else if (
        openmodal.confirmmodal.closecon === "createBanner" &&
        globalindex.bannereditindex === -1 &&
        banner.image.name.length > 0
      ) {
        const image = banner.image.name;
        const deleteImage = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          { name: image }
        );
        if (!deleteImage.success) {
          errorToast("Error Occured Reload Required");
          return;
        }
        setbanner(BannerInitialize);
      }
      setproduct(Productinitailizestate);
      setglobalindex({
        ...globalindex,
        producteditindex: -1,
        bannereditindex: -1,
      });

      setopenmodal({
        ...openmodal,
        [openmodal.confirmmodal.closecon]: false,
        confirmmodal: {
          open: false,
          confirm: true,
          closecon: "",
        },
      });
    } else {
      setopenmodal({
        ...openmodal,
        confirmmodal: {
          ...openmodal.confirmmodal,
          open: false,
          confirm: false,
          closecon: "",
        },
      });
    }
  };

  const handleConfirmDelete = async (confirm: boolean) => {
    const { type, index } = openmodal.confirmmodal;

    const itemlist = allData[type as keyof typeof allData] || [];
    const URL =
      type === "product"
        ? "/api/products/crud"
        : type === "banner"
        ? "/api/banner"
        : type === "promotion"
        ? "/api/promotion"
        : "/api/users";

    if (confirm) {
      if (type === "promotioncancel") {
        setpromotion(PromotionInitialize);
        setinventoryfilter("promotion");
        setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
        setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      } else {
        const idx = itemlist.find((i: any) => i.id === index);
        const deleteRequest = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          { id: index }
        );

        if (!deleteRequest.success) {
          errorToast("Failed To Delete");
          return;
        }

        if (type === "user") {
          setglobalindex((prev) => ({ ...prev, useredit: -1 }));
          setopenmodal((prev) => ({ ...prev, createUser: false }));
        }
        setreloaddata(true);
      }
    }

    // Reset confirm modal state
    setopenmodal((prev) => ({
      ...prev,
      [type === "promotion" ? "createPromotion" : ""]: false,
      confirmmodal: {
        ...prev.confirmmodal,
        open: false,
        confirm: false,
        closecon: "",
        index: -1,
        type: undefined,
      },
    }));
  };

  return (
    <Modal closestate={"confirmmodal"} customZIndex={200}>
      <div className="confirm_container flex flex-col justify-center items-center gap-y-5 bg-white w-[250px] h-[280px] rounded-md">
        <h3 className="question text-lg font-bold text-black">
          {" "}
          Are You Sure ?
        </h3>
        <div className="btn_container w-4/5 h-fit flex flex-col justify-center items-center gap-y-3">
          <PrimaryButton
            type="button"
            text="Yes"
            radius="10px"
            status={isLoading.DELETE ? "loading" : "authenticated"}
            onClick={() =>
              openmodal.confirmmodal.type
                ? handleConfirmDelete(true)
                : handleConfirm(true)
            }
            color="#35C191"
          />
          <PrimaryButton
            type="button"
            text="No"
            onClick={() =>
              openmodal.confirmmodal.type
                ? handleConfirmDelete(false)
                : handleConfirm(false)
            }
            radius="10px"
            disable={isLoading.DELETE}
            color="#F08080"
          />
        </div>
      </div>
    </Modal>
  );
};

const statusFilter = ["Low"];

interface filtercategorytype {
  id: number;
  name: string;
}
interface categoriestype {
  parentcates: Array<filtercategorytype>;
  childcate?: Array<filtercategorytype>;
}

const fetchsubcate = async (value: string) => {
  const getsub = getSubCategories.bind(null, parseInt(value));
  const getreq = await getsub();
  return getreq;
};
export const FilterMenu = ({
  type,
  totalproduct,
  categories,
  name,
  expiredAt,
  param,
  setisFilter,
}: {
  type?: string;
  totalproduct?: number;
  categories?: {
    parentid?: number;
    childid?: number;
  };
  expiredAt?: string;
  name?: string;
  stock?: string;
  param?: InventoryParamType;
  setisFilter?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { setopenmodal, promotion, listproductfilval } = useGlobalContext();

  const [loading, setloading] = useState(false);

  const [selectdate, setselectdate] = useState(false);
  const [category, setcategory] = useState<categoriestype | undefined>(
    undefined
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filtervalue, setfilter] = useState<FilterValue>({
    parentcate: categories?.parentid ?? undefined,
    childcate: categories?.childid ?? undefined,
    name: param?.name,
    expiredate: expiredAt ? dayjs(expiredAt).toISOString() : undefined,
    bannersize: param?.bannersize ?? undefined,
    bannertype: param?.bannertype ?? undefined,
    search: param?.search,
  });
  const [filterdata, setdata] = useState<{
    size?: Array<string>;
    color?: Array<string>;
    text?: Array<string>;
  }>({});

  const fetchcate = async () => {
    const asycnfetchdata = async () => {
      const categories = await ApiRequest("/api/categories", undefined, "GET");
      if (!categories.success) {
        errorToast("Error Connection");
        return;
      }
      setcategory({
        parentcates: categories.data,
      });
    };

    await Delayloading(asycnfetchdata, setloading, 1000);
  };

  useEffectOnce(() => {
    if (type === "listproduct") {
      setdata(listproductfilval);

      return;
    }

    type === "product" && fetchcate();
  });

  useEffect(() => {
    const getsub = async () => {
      if (filtervalue.parentcate) {
        const data = await fetchsubcate(filtervalue.parentcate.toString());
        setcategory((prev) => ({ ...prev, childcate: data.data } as any));
      }
    };
    getsub();
  }, [filtervalue.parentcate]);
  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    const filtervalues = Object.entries(filtervalue);

    filtervalues.map(([key, value]) => {
      if (key === "expiredate" && value) {
        const val = value as Dayjs;
        params.set(key, formatDate(val.toDate()));
      }
      if (key !== "p" && value && value !== "none") {
        params.set(key, value);
      }
    });
    params.set("p", "1");

    router.push(`?${params}`);

    setisFilter && setisFilter(true);

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  };
  const handleSelect = async (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    setfilter((prev) => ({ ...prev, [name]: value }));

    if (name === "parentcate") {
      const params = new URLSearchParams(searchParams);
      params.delete("childcate");
      router.push(`?${params}`);
    }
  };
  const handleClear = () => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filtervalue).map(([key, _]) => {
      if (key !== "p") {
        params.delete(key);
      }
    });

    params.set("p", "1");

    router.push(`?${params}`);

    router.refresh();

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  };
  return (
    <Modal
      customwidth="fit-content"
      customheight="fit-content"
      closestate={selectdate ? "discount" : "filteroption"}
      customZIndex={200}
    >
      {loading && <ContainerLoading />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="filtermenu w-[50vw] h-fit bg-white p-5 rounded-md flex flex-col justify-center gap-y-5"
      >
        {type !== "usermanagement" && (
          <input
            type="text"
            name="name"
            placeholder="Search Name"
            value={filtervalue.name}
            onChange={(e) =>
              setfilter((prev) => ({ ...prev, name: e.target.value }))
            }
            className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
            hidden={type === "listproduct"}
          />
        )}
        {type === "listproduct" &&
          (filterdata.color || filterdata.size || filterdata.text) && (
            <>
              {filterdata.size && filterdata.size.length !== 0 && (
                <ToggleSelect type="size" title="Size" data={filterdata.size} />
              )}
              {filterdata.color && filterdata.color.length > 0 && (
                <ToggleSelect
                  type="color"
                  title="Color"
                  data={
                    filterdata.color?.filter((i) => i.length > 0) as string[]
                  }
                />
              )}
              {filterdata.text && filterdata.text.length !== 0 && (
                <ToggleSelect
                  type="text"
                  title="Other"
                  data={filterdata.text}
                />
              )}
            </>
          )}
        {type === "usermanagement" && (
          <input
            type="text"
            name="search"
            placeholder="Search (ID , Email)"
            value={filtervalue.search}
            onChange={(e) =>
              setfilter((prev) => ({ ...prev, search: e.target.value }))
            }
            className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
          />
        )}
        {type === "banner" && (
          <>
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="w-full text-lg font-medium">Banner Type</label>
              <Selection
                name="bannertype"
                data={[{ label: "None", value: "none" }, ...BannerType]}
                value={filtervalue.bannertype}
                onChange={handleSelect}
              />
            </div>
            <div className="w-full h-fit flex flex-col gap-y-5">
              <label className="w-full text-lg font-medium">Banner Size</label>
              <Selection
                name="bannersize"
                data={[{ label: "None", value: "none" }, ...BannerSize]}
                onChange={handleSelect}
                value={filtervalue.bannersize}
              />
            </div>
          </>
        )}
        {type === "promotion" && (
          <>
            <div
              onMouseEnter={() => setselectdate(true)}
              onMouseLeave={() => setselectdate(false)}
              className="w-full h-[50px] relative z-[100]"
            >
              <DateTimePicker
                sx={{ width: "100%" }}
                value={
                  filtervalue.expiredate ? dayjs(filtervalue.expiredate) : null
                }
                onChange={(e) => {
                  if (e) {
                    setfilter((prev) => ({
                      ...prev,
                      expiredate: dayjs(e).toISOString(),
                    }));
                  }
                }}
              />{" "}
            </div>
          </>
        )}
        {type === "product" && (
          <>
            <Selection
              name="parentcate"
              data={category?.parentcates?.map((i) => ({
                label: i.name,
                value: i.id,
              }))}
              default="Parent Category"
              value={filtervalue.parentcate}
              onChange={handleSelect}
            />
            {filtervalue.parentcate !== 0 && (
              <Selection
                type="subcategory"
                subcategory={category?.childcate}
                name="childcate"
                default="Sub Category"
                value={filtervalue.childcate}
                onChange={handleSelect}
              />
            )}
            <Selection
              default="Stock"
              onChange={handleSelect}
              name="status"
              value={filtervalue.status}
              data={statusFilter}
            />
            {promotion.selectproduct && (
              <Selection default="Discount" name="discount" />
            )}
          </>
        )}{" "}
        {type !== "listproduct" ? (
          <PrimaryButton
            type="button"
            onClick={() => handleFilter()}
            text="Filter"
            disable={Object.entries(filtervalue).every(
              ([i, j]) => !j || j === "none"
            )}
            radius="10px"
            width="100%"
          />
        ) : (
          <PrimaryButton
            type="button"
            text={`Show Product ${totalproduct === 0 ? "" : totalproduct}`}
            onClick={() =>
              setopenmodal((prev) => ({ ...prev, filteroption: false }))
            }
            radius="10px"
            width="100%"
          />
        )}
        <PrimaryButton
          type="button"
          onClick={() => handleClear()}
          text="Clear"
          color="lightcoral"
          radius="10px"
          width="100%"
        />
      </motion.div>
    </Modal>
  );
};

export const Alertmodal = () => {
  const { openmodal, setopenmodal } = useGlobalContext();
  const handleClose = async () => {
    openmodal.alert.action && (await openmodal.alert.action());
    setopenmodal((prev) => ({
      ...prev,
      alert: { ...prev.alert, open: false },
    }));
  };
  return (
    <Modal closestate="discount">
      <div className="alertmodal_container flex flex-col items-center  gap-y-10 w-fit h-fit min-w-[300px] p-5 bg-white rounded-lg">
        <h1 className="text-xl font-bold text-center w-full break-all">
          {openmodal.alert.text}
        </h1>

        <div className="flex flex-row w-full h-[50px] justify-between">
          <PrimaryButton
            type="button"
            text="Close"
            color="lightcoral"
            radius="10px"
            width="100%"
            height="50px"
            onClick={() => handleClose()}
          />
        </div>
      </div>
    </Modal>
  );
};

interface ConfirmModal {
  actions: {
    yes: (...arg: any) => Promise<void>;
    no: (...arg: any) => void;
  };
  loading: boolean;
}

export const PrimaryConfirmModal = ({ actions, loading }: ConfirmModal) => {
  const handleConfirm = async () => {
    await actions.yes();
  };

  const handleReject = () => actions.no();

  return (
    <Modal closestate={"confirmmodal"} customZIndex={200}>
      <div className="confirm_container flex flex-col justify-center items-center gap-y-5 bg-white w-[250px] h-[280px] rounded-md">
        <h3 className="question text-lg font-bold text-black">
          {" "}
          Are You Sure ?
        </h3>
        <div className="btn_container w-4/5 h-fit flex flex-col justify-center items-center gap-y-3">
          <PrimaryButton
            type="button"
            text="Yes"
            radius="10px"
            status={loading ? "loading" : "authenticated"}
            onClick={handleConfirm}
            color="#35C191"
          />
          <PrimaryButton
            type="button"
            text="No"
            onClick={handleReject}
            radius="10px"
            disable={loading}
            color="#F08080"
          />
        </div>
      </div>
    </Modal>
  );
};
