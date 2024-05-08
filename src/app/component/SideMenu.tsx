"use client";
import Image, { StaticImageData } from "next/image";
import DefaultProfile from "../../../public/Image/profile.svg";
import PrimaryButton, { Selection } from "./Button";
import { ChangeEvent, SetStateAction, useEffect, useState } from "react";
import { SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "./Modals";
import {
  BannerInitialize,
  FilterValue,
  FiltervalueInitialize,
  Productinitailizestate,
  PromotionInitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { LoadingText, errorToast, successToast } from "./Loading";
import { motion } from "framer-motion";

import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { ToggleSelect } from "./ToggleMenu";
import { Deletecart, Getcarts } from "../product/detail/[id]/action";
import { Productordertype, totalpricetype } from "@/src/context/OrderContext";
import { Createorder } from "../checkout/action";

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
          onClick={() => Router.push("/dashboard/products")}
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

      console.log(carts);
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
    let orderId = "";

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
      orderId = createOrder.data.orderId;

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

        itemlist.splice(idx as number, 1);

        setalldata((prev) => ({ ...prev, [type as string]: itemlist }));
        if (type === "user") {
          setglobalindex((prev) => ({ ...prev, useredit: -1 }));
          setopenmodal((prev) => ({ ...prev, createUser: false }));
        }
        successToast("Delete Successfully");
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
export const FilterMenu = ({
  type,
  totalproduct,
}: {
  type?: "usermanagement" | "listproduct";
  totalproduct?: number;
}) => {
  const {
    allData,
    setalldata,
    subcate,
    setsubcate,
    setopenmodal,
    allfiltervalue,
    setallfilterval,
    inventoryfilter,
    promotion,
    listproductfilter,
    setlistprodfil,
    listproductfilval,
  } = useGlobalContext();
  const isFilter = allfiltervalue.find((i) =>
    type ? i.page === type : i.page === inventoryfilter
  );
  const [selectdate, setselectdate] = useState(false);
  const [filtervalue, setfilter] = useState<FilterValue>(FiltervalueInitialize);
  const [filterdata, setdata] = useState<{
    size?: Array<String>;
    color?: Array<String>;
    text?: Array<String>;
  }>({});

  const fetchcate = async () => {
    const categories = await ApiRequest("/api/categories", undefined, "GET");
    if (!categories.success) {
      errorToast("Error Connection");
      return;
    }
    setalldata((prev) => ({ ...prev, category: categories.data }));
  };

  useEffect(() => {
    if (type === "listproduct") {
      setdata(listproductfilval);

      return;
    }
    setfilter(isFilter?.filter ?? FiltervalueInitialize);
    inventoryfilter === "product" && !type && fetchcate();
  }, []);
  const handleFilter = () => {
    if (type !== "listproduct") {
      const Allfilterdata = [...allfiltervalue];

      if (!isFilter) {
        Allfilterdata.push({
          page: inventoryfilter as any,
          filter: filtervalue,
        });
      } else {
        const idx = Allfilterdata.findIndex((i) =>
          type ? i.page === type : i.page === inventoryfilter
        );
        Allfilterdata[idx] = {
          page: type ? type : (inventoryfilter as any),
          filter: filtervalue,
        };
      }
      setallfilterval(Allfilterdata);
    }

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  };
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    let filterdata: FilterValue = FiltervalueInitialize;

    if (name === "parent_cateogory") {
      const findsubcate = allData.category.find(
        (i) => i.id === parseInt(value)
      );
      filterdata = {
        ...filtervalue,
        category: { ...filtervalue.category, parent_id: parseInt(value) },
      };
      setsubcate(findsubcate?.subcategories ?? []);
    } else if (name === "sub_category") {
      filterdata = {
        ...filtervalue,
        category: { ...filtervalue.category, child_id: parseInt(value) },
      };
    } else if (name === "status") {
      filterdata = { ...filtervalue, status: value };
    }
    setfilter(filterdata);
  };
  const handleClear = () => {
    if (type !== "listproduct") {
      const Allfilterdata = [...allfiltervalue];
      const idx = Allfilterdata.findIndex((i) =>
        type ? i.page === type : i.page === inventoryfilter
      );
      Allfilterdata[idx].filter = FiltervalueInitialize;
      setallfilterval(Allfilterdata);
      setfilter({
        ...FiltervalueInitialize,
        status: "",
      });
    } else {
      setlistprodfil({
        color: [],
        size: [],
        text: [],
      });
    }
  };
  return (
    <Modal
      customwidth="fit-content"
      customheight="fit-content"
      closestate={selectdate ? "discount" : "filteroption"}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="filtermenu w-[50vw] h-fit bg-white p-5 rounded-md flex flex-col justify-center gap-y-5"
      >
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
            name="email"
            placeholder="Email"
            value={filtervalue.email}
            onChange={(e) =>
              setfilter((prev) => ({ ...prev, email: e.target.value }))
            }
            className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
          />
        )}
        {type !== "usermanagement" && (
          <>
            {inventoryfilter === "promotion" && (
              <>
                <div
                  onMouseEnter={() => setselectdate(true)}
                  onMouseLeave={() => setselectdate(false)}
                  className="w-full h-[50px] relative z-[100]"
                >
                  <DateTimePicker
                    sx={{ width: "100%" }}
                    value={
                      filtervalue.expiredate
                        ? dayjs(filtervalue.expiredate)
                        : null
                    }
                    onChange={(e) => {
                      if (e) {
                        setfilter((prev) => ({
                          ...prev,
                          expiredate: dayjs(e),
                        }));
                      }
                    }}
                  />{" "}
                </div>
              </>
            )}
            {type !== "listproduct" && inventoryfilter === "product" && (
              <>
                <Selection
                  name="parent_cateogory"
                  type="category"
                  default="Parent Category"
                  value={filtervalue.category.parent_id}
                  onChange={handleSelect}
                />
                {filtervalue.category.parent_id !== 0 && (
                  <Selection
                    type="subcategory"
                    subcategory={subcate}
                    name="sub_category"
                    default="Sub Category"
                    value={filtervalue.category.child_id}
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
          </>
        )}
        {type !== "listproduct" ? (
          <PrimaryButton
            type="button"
            onClick={() => handleFilter()}
            text="Filter"
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
          disable={
            type !== "listproduct"
              ? !isFilter
                ? true
                : false
              : listproductfilter.color.length === 0 &&
                listproductfilter.size.length === 0
          }
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
