"use client";
import { StaticImageData } from "next/image";
import PrimaryButton, { Selection } from "./Button";
import React, { ChangeEvent, SetStateAction, useEffect, useState } from "react";
import { CardSkeleton, SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Modal, { SecondaryModal } from "./Modals";
import {
  BannerInitialize,
  FilterValue,
  Productinitailizestate,
  PromotionInitialize,
  SelectType,
  Sessiontype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  ApiRequest,
  Delayloading,
  useClickOutside,
  useEffectOnce,
  useScreenSize,
} from "@/src/context/CustomHook";
import { ContainerLoading, errorToast, successToast } from "./Loading";
import { motion } from "framer-motion";

import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { ToggleSelect } from "./ToggleMenu";
import { Productordertype, totalpricetype } from "@/src/context/OrderContext";
import { Createorder } from "../checkout/action";
import { formatDate } from "./EmailTemplate";
import {
  getSubCategories,
  InventoryParamType,
} from "../dashboard/inventory/varaint_action";
import { BannerSize, BannerType } from "./Modals/Banner";
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
import { SelectionCustom } from "./Pagination_Component";
import { SelectAndSearchProduct } from "./Banner";
import { GetPromotionSelection } from "./Modals/Category";
import { Checkbox } from "@nextui-org/react";

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
                        isMobile && props.setProfile(false);
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
      const response = await ApiRequest("/api/order/cart", undefined, "GET");

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
    const deletereq = await ApiRequest(
      "/api/order/cart",
      undefined,
      "DELETE",
      "JSON",
      { id }
    );
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
        {loading.fetch && Array.from({ length: 3 }).map(() => <CardSkeleton />)}

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
    product,
    setproduct,
    banner,
    setbanner,
    setpromotion,
    setinventoryfilter,
    globalindex,
    setglobalindex,
  } = useGlobalContext();
  const router = useRouter();
  const searchParam = useSearchParams();
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
    const param = new URLSearchParams(searchParam);

    const URL =
      type === "product"
        ? "/api/products/crud"
        : type === "banner"
        ? "/api/banner"
        : type === "promotion"
        ? "/api/promotion"
        : type === "user"
        ? "/api/users"
        : "/api/users/info";

    if (confirm) {
      if (type === "promotioncancel") {
        setpromotion(PromotionInitialize);
        setinventoryfilter("promotion");
        setglobalindex((prev) => ({ ...prev, promotioneditindex: -1 }));
        setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      } else {
        const deleteRequest = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          type !== "userinfo" ? { id: index } : {}
        );

        if (!deleteRequest.success) {
          errorToast("Failed To Delete");
          return;
        }

        if (type === "user") {
          setglobalindex((prev) => ({ ...prev, useredit: -1 }));
          setopenmodal((prev) => ({ ...prev, createUser: false }));
        }

        if (type === "user") {
          param.set("p", "1");
          router.push(`?${param}`, { scroll: false });
        }
        openmodal.confirmmodal.onAsyncDelete &&
          (await openmodal.confirmmodal.onAsyncDelete());
        openmodal.confirmmodal.onDelete && openmodal.confirmmodal.onDelete();

        router.refresh();
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
        <h3 className="question w-full text-center text-lg font-bold text-black">
          {" "}
          {openmodal.confirmmodal.Warn ?? "Are you sure ?"}
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
  expired,
  reloadData,
  setfilterdata,
  isSetPromotion,
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
  expired?: string;
  param?: InventoryParamType;
  setisFilter?: React.Dispatch<React.SetStateAction<boolean>>;
  reloadData?: () => void;
  isSetPromotion?: boolean;
  setfilterdata?: React.Dispatch<
    React.SetStateAction<InventoryParamType | undefined>
  >;
}) => {
  const { openmodal, setopenmodal, promotion, listproductfilval, globalindex } =
    useGlobalContext();

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
    status: param?.status,
    expired: expired,
    promoids: param?.promoids?.split(",").map((i) => parseInt(i, 10)),
  });
  const [filterdata, setdata] = useState<{
    size?: Array<string>;
    color?: Array<string>;
    text?: Array<string>;
  }>({});
  const [promoval, setpromoval] = useState<SelectType[] | undefined>(undefined);

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

    await Delayloading(asycnfetchdata, setloading, 500);
  };

  useEffectOnce(() => {
    if (type === "listproduct") {
      setdata(listproductfilval);

      return;
    }

    type === "product" && fetchcate();
  });

  useEffect(() => {
    const fetchpromo = async () => {
      if (!param?.promoids) {
        return;
      }
      const data = await ApiRequest(
        `/api/promotion?ty=byid&ids=${param.promoids}`,
        undefined,
        "GET"
      );
      if (data.success) {
        setpromoval(data.data);
      }
    };
    fetchpromo();
  }, [filtervalue.promoids]);

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
        const val = dayjs(value);
        params.set(key, formatDate(val.toDate()));
        setfilterdata &&
          setfilterdata((prev) => ({
            ...prev,
            [key]: formatDate(val.toDate()),
          }));
      }
      if (key === "promoids" && value) {
        const val = value as number[];
        params.set("promoids", val.join(","));
        setfilterdata && setfilterdata((prev) => ({ ...prev, [key]: value }));
      }

      if (key !== "p" && value && value !== "none") {
        params.set(key, value);
        setfilterdata && setfilterdata((prev) => ({ ...prev, [key]: value }));
      }
    });

    params.set("p", "1");

    router.push(`?${params}`);

    setisFilter && setisFilter(true);

    reloadData && reloadData();

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  };
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
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

    setfilterdata && setfilterdata({});

    router.push(`?${params}`);

    reloadData ? reloadData() : router.refresh();

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  };
  return (
    <SecondaryModal
      open={openmodal.filteroption}
      size="5xl"
      onPageChange={(val) =>
        setopenmodal((prev) => ({ ...prev, filteroption: val }))
      }
      placement="top"
      closebtn
      footer={() => (
        <>
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
        </>
      )}
    >
      {loading && <ContainerLoading />}
      <div className="filtermenu w-full relative  h-fit bg-white p-5 max-small_phone:max-h-[50vh] rounded-md flex flex-col justify-center gap-y-5">
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

            <SelectionCustom
              data={[{ label: "Expired", value: "1" }]}
              label="status"
              value={filtervalue.expired}
              placeholder="Status"
              onChange={(value) =>
                setfilter((prev) => ({ ...prev, expired: value as string }))
              }
            />
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
            {type === "product" &&
              (globalindex.promotioneditindex !== -1 && isSetPromotion ? (
                <Checkbox
                  className="w-full h-[40px]"
                  isSelected={!!filtervalue.promoids}
                  onValueChange={(value) => {
                    setfilter((prev) => ({
                      ...prev,
                      promoids: value
                        ? [globalindex.promotioneditindex]
                        : undefined,
                    }));
                  }}
                >
                  {" "}
                  Show Only Discount{" "}
                </Checkbox>
              ) : (
                <SelectAndSearchProduct
                  getdata={(take, value) => GetPromotionSelection(value, take)}
                  placeholder="Select Promotion"
                  value={promoval}
                  onSelect={(value) => {
                    const val = value as SelectType[];
                    setfilter((prev) => ({
                      ...prev,
                      promoids: val.map((i) =>
                        parseInt(i.value.toString(), 10)
                      ),
                    }));
                  }}
                />
              ))}
          </>
        )}{" "}
      </div>
    </SecondaryModal>
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
