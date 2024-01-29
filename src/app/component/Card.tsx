"use client";
import Image, { StaticImageData } from "next/image";
import PrimaryButton, { Selection } from "./Button";
import "../globals.css";
import { useRef, useState } from "react";
import ToggleMenu from "./ToggleMenu";
import { PrimaryPhoto } from "./PhotoComponent";
import {
  PromotionState,
  productcoverstype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import Checkmark from "../Asset/Image/Checkmark.svg";
import { SubInventoryMenu } from "./Navbar";
import LoadingIcon from "./Loading";
import { useRouter } from "next/navigation";

interface cardprops {
  name: string;
  price: string;
  img: productcoverstype[];
  isAdmin?: boolean;
  button?: boolean;
  index?: number;
  hover?: boolean;
  id?: number;
  discount?: {
    percent: string;
    newPrice: string;
  };
  stock?: number;
}
const editactionMenu = [
  {
    value: "Edit",
    opencon: "createProduct",
  },
  { value: "Stock", opencon: "updatestock" },
  {
    value: "Delete",
    opencon: "",
  },
];
export default function Card(props: cardprops) {
  const {
    promotion,
    setpromotion,
    setglobalindex,
    setopenmodal,
    globalindex,
    openmodal,
    setalldata,
    allData,
  } = useGlobalContext();
  const route = useRouter();
  const isProduct = promotion.Products.find((i) => i.id === props.id);
  const [state, setstate] = useState({
    detail: false,
    editaction: false,
    hover: false,
  });

  const handeMouseEvent = (type: "enter" | "leave") =>
    setstate({
      ...state,
      hover: type === "enter" ? true : false,
      editaction: type === "leave" && false,
    });
  const ref = useRef<HTMLDivElement | null>(null);
  const handleSelectDiscount = (id: number, type: "create" | "edit") => {
    const promo = [...promotion.Products];
    let temp: Array<number> = [];

    const index = promo.findIndex((i) => i.id === id);

    if (type == "create") {
      if (!props.discount) {
        if (!isProduct) {
          const option = {
            id: id,
            discount: {
              percent: "",
              newPrice: "",
              oldPrice: parseFloat(props.price),
            },
          };
          promo.push(option);
        } else {
          promo.splice(index, 1);
        }
      } else if (props.discount) {
        if (isProduct) {
          const isExist = promotion.tempproduct?.includes(id);
          !isExist && temp.push(id);
          console.log(temp);

          promo.splice(index, 1);
        } else {
          promo.push({
            id: id,
            discount: {
              percent: "",
              newPrice: "",
              oldPrice: parseFloat(props.price),
            },
          });
        }
      }

      setpromotion((prev) => ({
        ...prev,
        Products: promo,
        tempproduct: temp,
      }));
    } else {
      setglobalindex((prev) => ({ ...prev, promotionproductedit: id }));
      setopenmodal((prev) => ({ ...prev, discount: true }));
    }
  };

  return (
    <div
      key={props.index}
      ref={ref}
      onMouseEnter={() => handeMouseEvent("enter")}
      onMouseLeave={() => handeMouseEvent("leave")}
      className={`card__container w-[550px] h-[550px]
       hover:border-[2px] hover:border-gray-300 ${
         isProduct ? "border border-gray-300" : ""
       }`}
    >
      <div
        onClick={() => {
          if (promotion.selectproduct) {
            handleSelectDiscount(props.id as number, "create");
          } else if (!props.isAdmin) {
            route.push(`/product/detail/${props.id}`);
          }
        }}
        className="cardimage__container flex flex-col justify-center items-center relative w-full h-full border border-gray-300"
      >
        <PrimaryPhoto showcount={false} data={props.img} />

        <span className="absolute top-3 right-3">
          {promotion.selectproduct &&
          (globalindex.promotioneditindex === -1
            ? isProduct?.discount
            : isProduct?.discount) ? (
            <Image
              src={Checkmark}
              alt="checkmark"
              width={1000}
              height={1000}
              className="w-[30px] h-[30px] object-contain"
            />
          ) : state.hover && props.isAdmin ? (
            <i
              onClick={() => setstate({ ...state, editaction: true })}
              className="fa-solid fa-ellipsis-vertical text-xl transition rounded-lg p-2 hover:bg-gray-300 "
            ></i>
          ) : (
            <i className="fa-solid fa-heart "></i>
          )}
        </span>
        {state.editaction && (
          <SubInventoryMenu
            ref={ref}
            data={editactionMenu}
            index={props.id}
            type="product"
            style={{ right: "0", top: 0 }}
            open="createProduct"
          />
        )}
      </div>
      <section className="card_detail w-full h-[90px] font-semibold bg-white flex flex-col justify-center gap-y-3 border-[0.5px] border-t-0 border-solid border-gray-400 pl-2 rounded-b-md text-sm">
        <h4 className="card_info w-[400px] h-[50px] overflow-y-auto text-lg">
          {" "}
          {props.name.length > 0 ? props.name : "No Product Created"}
        </h4>
        {props.discount ||
        promotion.selectproduct ||
        openmodal.createPromotion ? (
          <div className="price_con flex flex-row flex-wrap items-center gap-x-5 w-full h-fit">
            {props.discount || isProduct?.discount ? (
              <h4 className="text-sm font-semibold line-through decoration-red-300 decoration-2">
                ${props.price}
              </h4>
            ) : (
              <h4 className="text-sm font-semibold">${props.price}</h4>
            )}
            <h4 className="text-sm font-semibold text-red-500">
              {globalindex.promotioneditindex === -1
                ? (promotion.selectproduct || openmodal.createPromotion) &&
                  !props.discount
                  ? isProduct?.discount
                    ? `-${isProduct?.discount?.percent}%`
                    : ""
                  : `-${props.discount?.percent}%`
                : promotion.selectproduct || openmodal.createPromotion
                ? isProduct?.discount?.percent
                  ? `-${isProduct?.discount?.percent}%`
                  : ""
                : `-${props.discount?.percent}%`}{" "}
            </h4>

            <h4 className="text-sm font-semibold">
              {globalindex.promotioneditindex === -1
                ? promotion.selectproduct || openmodal.createPromotion
                  ? isProduct?.discount
                    ? `$${isProduct?.discount?.newPrice}`
                    : ""
                  : `$${props.discount?.newPrice}`
                : isProduct?.discount
                ? `$${isProduct?.discount?.newPrice}`
                : ""}
            </h4>
          </div>
        ) : (
          <h4 className="text-sm font-semibold">${props.price}</h4>
        )}
      </section>
      {props.button && (
        <PrimaryButton type="button" text="Add To Cart" width={"100%"} />
      )}
      {promotion.selectproduct && isProduct?.discount && (
        <PrimaryButton
          onClick={() => handleSelectDiscount(isProduct.id ?? 0, "edit")}
          type="button"
          text={
            isProduct?.discount?.percent?.length === 0 ? "Set Discount" : "Edit"
          }
          width="50%"
          radius="10px"
        />
      )}
      {!promotion.selectproduct &&
      props.stock &&
      props.stock <= 1 &&
      props.isAdmin ? (
        <PrimaryButton
          type="button"
          text="Low Stock"
          onClick={() => {
            setglobalindex((prev) => ({
              ...prev,
              producteditindex: props.index as number,
            }));
            setopenmodal((prev) => ({ ...prev, updatestock: true }));
          }}
          width="100%"
          color="lightcoral"
        />
      ) : (
        <></>
      )}
    </div>
  );
}
interface SecondayCardprops {
  img: string | StaticImageData;
  width?: string;
  name?: string;
  price?: string;
  action?: boolean;
}
export function SecondayCard(props: SecondayCardprops) {
  return (
    <div className="w-full h-fit flex flex-col  items-end gap-y-5">
      <div
        style={{ width: props.width }}
        className="secondarycard__container flex flex-row items-center bg-[#F4FAFF] justify-between w-full gap-x-2"
      >
        <Image
          src={props.img}
          alt="cover"
          className="cardimage w-[250px] h-[350px] object-cover"
        />
        <div className="product_detail flex flex-col items-start gap-y-5 w-full">
          <div className="product_info">
            <h2 className="text-md font-black"> Product Name </h2>
            <h4>Price</h4>
          </div>
          <Selection default="Select" label="Size" data={["S", "M"]} />
          <label className="w-fit flex flex-row justify-between items-center gap-x-5">
            {" "}
            Quantity{" "}
            <input
              className="w-full border border-black rounded-md text-center"
              type="number"
            />{" "}
          </label>
          <ToggleMenu name="Product Details" isAdmin={false} />
          <i className="fa-solid fa-trash relative -top-2"></i>
        </div>
      </div>
      {props.action && (
        <div className="actions w-[75%] flex flex-row items-center justify-start gap-x-5">
          <PrimaryButton
            type="button"
            text="Returns"
            width="20%"
            height="30px"
            radius="5px"
            color="#0097FA"
            textcolor="white"
            hoverColor="black"
          />
          <PrimaryButton
            type="button"
            text="Delete"
            width="20%"
            height="30px"
            radius="5px"
            color="#F08080"
            textcolor="white"
            hoverColor="black"
          />
        </div>
      )}
    </div>
  );
}

interface Bannercardprops {
  data: {
    url: string;
    name: string;
  };
  index: number;
  type: "banner" | "promotion";
  id?: number;
  promodata?: PromotionState;
}
export const BannerCard = ({ data, index, id, type }: Bannercardprops) => {
  const { promotion, setpromotion, allData, setalldata, openmodal } =
    useGlobalContext();

  const isBanner = promotion.banner_id === id;
  const [open, setopen] = useState(false);
  const actionMenu = [
    {
      value: "Edit",
      opencon: type === "promotion" ? "createPromotion" : "createBanner",
    },
    {
      value: "Delete",
      opencon: "",
    },
  ];
  type === "banner" && actionMenu.push({ value: "Show At Home", opencon: "" });

  const ref = useRef<HTMLDivElement | null>(null);
  const { isLoading, setisLoading } = useGlobalContext();

  return (
    <div
      ref={ref}
      key={index}
      onMouseLeave={() => {
        setopen(false);
      }}
      onClick={() => {
        if (promotion.selectbanner) {
          let ID = 0;
          isBanner ? (ID = 0) : (ID = id as number);
          setpromotion((prev) => ({
            ...prev,
            banner_id: ID === 0 ? undefined : ID,
          }));
        } else if (openmodal.managebanner) {
          //set banner as show

          let allbanner = [...allData.banner];
          let tempbanner = [...(allData.tempbanner ?? [])];
          const isTemp = tempbanner.findIndex((i) => i.id === id);
          if (isTemp === -1) {
            tempbanner.push({
              id: allbanner[index].id as number,
              show: allbanner[index].show as boolean,
            });
          } else {
            tempbanner.splice(isTemp, 1);
          }
          if (allbanner[index].show) {
            allbanner[index].show = false;
          } else {
            allbanner[index].show = true;
          }
          setalldata((prev) => ({
            ...prev,
            banner: allbanner,
            tempbanner: tempbanner,
          }));
        }
      }}
      className={`Banner__container relative w-full h-full flex flex-col justify-start transition rounded-t-lg border-t border-l border-r border-gray-300 `}
      style={isBanner ? { border: "5px solid lightgray" } : {}}
    >
      <div className="relative w-full h-full">
        <Image
          src={data.url ?? ""}
          alt={`Banner`}
          className="banner w-full h-full object-cover"
          loading="eager"
          onLoad={() =>
            setisLoading((prev) => ({
              ...prev,
              IMAGE: { ...prev.IMAGE, [`Banner${index}`]: true },
            }))
          }
          onLoadStart={() =>
            setisLoading((prev) => ({
              ...prev,
              IMAGE: { ...prev.IMAGE, [`Banner${index}`]: false },
            }))
          }
          width={1000}
          height={1000}
        />
        {`Banner${index}` in isLoading.IMAGE &&
          !isLoading.IMAGE[`Banner${index}`] && (
            <div className="absolute top-[35%] left-[30%] w-[10%] h-[10%]">
              {" "}
              <LoadingIcon />{" "}
            </div>
          )}
      </div>

      <h3 className="Banner text-xl w-full p-1 bg-[#495464] rounded-b-lg  font-bold text-white">
        {data.name.length === 0 ? "No name" : data.name}
      </h3>
      <span
        onClick={() =>
          (!promotion.selectbanner || !openmodal.managebanner) && setopen(true)
        }
        className="action_container absolute top-0 right-0"
      >
        {(type === "banner" && isBanner && promotion.selectbanner) ||
          (allData.banner[index]?.show && openmodal.managebanner && (
            <Image
              src={Checkmark}
              alt="checkmark"
              width={1000}
              height={1000}
              className="w-[30px] h-[30px] object-contain"
            />
          ))}{" "}
        {!promotion.selectbanner && !openmodal.managebanner && (
          <i className="fa-solid fa-ellipsis-vertical text-lg bg-white w-fit h-fit p-2 transition hover:bg-gray-300"></i>
        )}
      </span>
      {open && (
        <SubInventoryMenu
          ref={ref}
          data={actionMenu}
          type={type}
          style={{ top: "0", right: "0" }}
          index={id}
        />
      )}
    </div>
  );
};

export const UserCard = ({
  uid,
  firstname,
  lastname,
  email,
  index,
}: {
  index: number;
  uid: number;
  firstname: string;
  lastname?: string;
  email: string;
}) => {
  const { setopenmodal, setglobalindex } = useGlobalContext();
  const handleEdit = () => {
    setglobalindex((prev) => ({ ...prev, useredit: index }));
    setopenmodal((prev) => ({ ...prev, createUser: true }));
  };
  return (
    <div
      key={index}
      onClick={() => handleEdit()}
      className="usercard_container w-[330px] h-[100px] rounded-lg border-2 border-black flex flex-col justify-center items-center gap-y-5 p-2 transition hover:bg-black hover:text-white"
    >
      <h3 className="text-md font-bold w-full text-center break-words">
        {`${firstname} ${lastname}`} #{uid}
      </h3>
      <h3 className="text-md text-center font-bold w-full break-words">
        {email}
      </h3>
    </div>
  );
};
