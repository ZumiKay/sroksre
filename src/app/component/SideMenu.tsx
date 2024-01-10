"use client";
import Image, { StaticImageData } from "next/image";
import DefaultProfile from "../Asset/Image/profile.svg";
import PrimaryButton, { Selection } from "./Button";
import {
  ChangeEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { SecondayCard } from "./Card";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Modal from "./Modals";
import {
  BannerInitialize,
  FilterValue,
  FiltervalueInitialize,
  Productinitailizestate,
  PromotionInitialize,
  PromotionProductInitialize,
  SpecificAccess,
  SubcategoriesState,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ApiRequest } from "@/src/context/CustomHook";
import { errorToast, successToast } from "./Loading";
import { removeSpaceAndToLowerCase } from "@/src/lib/utilities";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
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
          { names: images },
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
          { name: image },
        );
        if (!deleteImage.success) {
          errorToast("Error Occured Reload Required");
          return;
        }
        setbanner(BannerInitialize);
      }
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
          : "/api/promotion";

    if (confirm) {
      if (type === "promotioncancel") {
        setpromotion(PromotionInitialize);
        globalindex.promotioneditindex === -1 && setinventoryfilter("product");
        setopenmodal((prev) => ({ ...prev, createPromotion: false }));
      } else {
        const id = itemlist[index as number]?.id ?? 0;
        const deleteRequest = await ApiRequest(
          URL,
          setisLoading,
          "DELETE",
          "JSON",
          { id },
        );

        if (!deleteRequest.success) {
          errorToast("Failed To Delete");
          return;
        }

        itemlist.splice(index as number, 1);
        setalldata((prev) => ({ ...prev, [type as string]: itemlist }));
        if (type === "promotion") {
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
            status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
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
            disable={SpecificAccess(isLoading)}
            color="#F08080"
          />
        </div>
      </div>
    </Modal>
  );
};

const statusFilter = ["Low"];
export const FilterMenu = () => {
  const {
    isLoading,
    setisLoading,
    allData,
    setalldata,
    subcate,
    setsubcate,
    setopenmodal,
    allfiltervalue,
    setallfilterval,
    inventoryfilter,
    promotion,
  } = useGlobalContext();
  const isFilter = allfiltervalue.find((i) => i.page === inventoryfilter);
  const [selectdate, setselectdate] = useState(false);
  const [filtervalue, setfilter] = useState<FilterValue>(FiltervalueInitialize);

  const fetchcate = async () => {
    const categories = await ApiRequest("/api/categories", setisLoading, "GET");
    if (!categories.success) {
      errorToast("Error Connection");
      return;
    }
    setalldata((prev) => ({ ...prev, category: categories.data }));
  };
  useEffect(() => {
    setfilter(isFilter?.filter ?? FiltervalueInitialize);
    inventoryfilter === "product" && fetchcate();
  }, []);
  const handleFilter = () => {
    const Allfilterdata = [...allfiltervalue];
    if (!isFilter) {
      Allfilterdata.push({
        page: inventoryfilter,
        filter: filtervalue,
      });
    } else {
      const idx = Allfilterdata.findIndex((i) => i.page === inventoryfilter);
      Allfilterdata[idx] = {
        page: inventoryfilter,
        filter: filtervalue,
      };
    }
    setallfilterval(Allfilterdata);

    setopenmodal((prev) => ({ ...prev, filteroption: false }));
  };
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    let filterdata: FilterValue = FiltervalueInitialize;

    if (name === "parent_cateogory") {
      const findsubcate = allData.category.find(
        (i) => i.id === parseInt(value),
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
    const Allfilterdata = [...allfiltervalue];
    const idx = Allfilterdata.findIndex((i) => i.page === inventoryfilter);
    Allfilterdata[idx].filter = FiltervalueInitialize;
    setallfilterval(Allfilterdata);
    setfilter({
      ...FiltervalueInitialize,
      status: "",
    });
  };
  return (
    <Modal
      customwidth="fit-content"
      customheight="fit-content"
      closestate={selectdate ? "discount" : "filteroption"}
    >
      <div className="filtermenu w-[50vw] h-fit bg-white p-5 rounded-md flex flex-col justify-center gap-y-5">
        <input
          type="text"
          name="name"
          placeholder="Search Name"
          value={filtervalue.name}
          onChange={(e) =>
            setfilter((prev) => ({ ...prev, name: e.target.value }))
          }
          className="search w-full pl-2 h-[50px] rounded-md border border-gray-300"
        />
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
                  filtervalue.expiredate ? dayjs(filtervalue.expiredate) : null
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
        {inventoryfilter === "product" && (
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
        )}
        <PrimaryButton
          type="button"
          onClick={() => handleFilter()}
          text="Filter"
          status={SpecificAccess(isLoading) ? "loading" : "authenticated"}
          radius="10px"
          width="100%"
        />
        <PrimaryButton
          type="button"
          onClick={() => handleClear()}
          text="Clear"
          color="lightcoral"
          disable={!isFilter ? true : false}
          radius="10px"
          width="100%"
        />
      </div>
    </Modal>
  );
};
