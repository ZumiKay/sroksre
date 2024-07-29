"use client";
import Image, { StaticImageData } from "next/image";
import PrimaryButton, { Selection } from "./Button";
import "../globals.css";
import { ChangeEvent, useRef, useState } from "react";

import { PrimaryPhoto } from "./PhotoComponent";
import {
  PromotionState,
  productcoverstype,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import Checkmark from "../../../public/Image/Checkmark.svg";
import { SubInventoryMenu } from "./Navbar";
import LoadingIcon, { errorToast } from "./Loading";
import { useRouter } from "next/navigation";

import {
  Orderpricetype,
  Productorderdetailtype,
  totalpricetype,
} from "@/src/context/OrderContext";
import { Editcart } from "../product/detail/[id]/action";
import { Variantcontainer } from "./Modals/VariantModal";
import { Sizecontainer } from "./Modals/Product";
import { UpdateStockModal } from "./Modals/Stock";

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
    percent: number;
    newprice: string;
  };
  stock?: number;
  lowstock?: boolean;
  stocktype?: string;
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
    openmodal,
    setopenmodal,
    globalindex,
    allData,
    setalldata,
  } = useGlobalContext();
  const route = useRouter();
  const isProduct = promotion.Products.find((i) => i.id === props.id);
  const [previewphoto, setpreviewphoto] = useState(false);

  const [state, setstate] = useState({
    detail: false,
    editaction: false,
    hover: false,
    editvariantstock: false,
  });

  const handeMouseEvent = (type: "enter" | "leave") =>
    setstate({
      ...state,
      hover: type === "enter" ? true : false,
      editaction: type === "leave" && false,
    });
  const ref = useRef<HTMLDivElement | null>(null);

  const handleSelectDiscount = async (id: number, type: "create" | "edit") => {
    const promo = [...promotion.Products];
    let temp: Array<number> = [];

    const index = promo.findIndex((i) => i.id === id);

    if (type == "create") {
      if (!props.discount) {
        if (!isProduct) {
          const option = {
            id: id,
            discount: {
              percent: 0,
              newprice: "",
              oldprice: parseFloat(props.price),
            },
          };
          promo.push(option);
        } else {
          promo.splice(index, 1);
        }
      } else {
        if (isProduct) {
          const isExist = promotion.tempproduct?.includes(id);
          !isExist && temp.push(id);
          let allproduct = [...(allData.product ?? [])];
          allproduct = allproduct.map((i) => {
            if (i.id === id) {
              return { ...i, discount: undefined };
            }
            return i;
          });

          promo.splice(index, 1);
          setalldata((prev) => ({ ...prev, product: allproduct }));
        } else {
          promo.push({
            id: id,
            discount: {
              percent: 0,
              newprice: "",
              oldprice: parseFloat(props.price),
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

  ///JSX CONDITIONS
  ///
  ///

  const shouldShowCheckmark =
    promotion.selectproduct &&
    (globalindex.promotioneditindex === -1
      ? isProduct?.discount
      : isProduct?.discount);

  const showCheckmark = (
    <Image
      src={Checkmark}
      alt="checkmark"
      width={1000}
      height={1000}
      className="w-[30px] h-[30px] object-contain"
    />
  );

  const showEllipsis = (
    <i
      onClick={() => setstate({ ...state, editaction: true })}
      className="fa-solid fa-ellipsis-vertical text-xl transition rounded-lg p-2 hover:bg-gray-300"
    ></i>
  );

  const showHeart = <i className="fa-solid fa-heart "></i>;

  //Price Condition

  const hasDiscount = props.discount;
  const showOriginalPrice = (
    <h4 className="text-sm font-semibold">
      ${parseFloat(props.price).toFixed(2)}
    </h4>
  );
  const showDiscountPrice = (
    <div className="price_con flex flex-row flex-wrap items-center gap-x-5 w-full h-fit">
      <h4 className="text-lg font-light line-through decoration-red-300 decoration-2">
        ${parseFloat(props.price).toFixed(2)}
      </h4>

      <h4 className="text-lg font-semibold text-red-500">
        -{hasDiscount?.percent ?? 0}%
      </h4>

      <h4 className="text-lg font-medium">{`${
        hasDiscount?.newprice ? `$${hasDiscount?.newprice}` : ""
      }`}</h4>
    </div>
  );

  const showLowStock = () => {
    return !promotion.selectproduct && props.lowstock && props.isAdmin ? (
      <PrimaryButton
        type="button"
        text="Low Stock"
        onClick={() => {
          setopenmodal((prev) => ({
            ...prev,
            [`${props.stocktype}${props.id}`]: true,
          }));
        }}
        width="100%"
        color="lightcoral"
      />
    ) : (
      <></>
    );
  };

  const closename: string = (props.stocktype &&
    props.id &&
    props.stocktype + props.id) as string;
  //
  ///end

  return (
    <>
      <div
        key={props.index}
        ref={ref}
        onMouseEnter={() => handeMouseEvent("enter")}
        onMouseLeave={() => handeMouseEvent("leave")}
        className={`card__container w-[500px] h-[500px]
       hover:border-[2px] hover:border-gray-300 ${
         isProduct ? "border border-gray-300" : ""
       } max-smaller_screen:w-[350px] max-smaller_screen:h-[350px] max-small_phone:w-[300px] max-small_phone:h-[300px]`}
      >
        <div
          onClick={() => {
            if (promotion.selectproduct) {
              handleSelectDiscount(props.id as number, "create");
            } else if (!props.isAdmin) {
              !previewphoto && route.push(`/product/detail/${props.id}`);
            }
          }}
          className="cardimage__container flex flex-col justify-center items-center relative w-full h-full border border-gray-300"
        >
          <PrimaryPhoto
            showcount={false}
            data={props.img}
            hover={false}
            setclick={setpreviewphoto}
          />

          <span className="absolute top-3 right-3">
            {shouldShowCheckmark
              ? showCheckmark
              : state.hover && props.isAdmin
              ? showEllipsis
              : showHeart}
          </span>
          {state.editaction && (
            <SubInventoryMenu
              ref={ref}
              data={editactionMenu}
              index={props.id}
              type="product"
              style={{ right: "0", top: 0 }}
              open="createProduct"
              stock={props.stock}
              stocktype={props.stocktype}
              stockaction={() => {
                setopenmodal((prev) => ({
                  ...prev,
                  [closename]: true,
                }));
              }}
            />
          )}
        </div>
        <section className="card_detail w-full h-[90px] font-semibold bg-white flex flex-col justify-center gap-y-3 border-[0.5px] border-t-0 border-solid border-gray-400 pl-2 rounded-b-md text-sm">
          <h4 className="card_info w-full max-w-[400px] h-[50px] overflow-y-auto text-lg">
            {props.name.length > 0 ? props.name : "No Product Created"}
          </h4>

          {hasDiscount ? showDiscountPrice : showOriginalPrice}
        </section>
        {props.button && (
          <PrimaryButton type="button" text="Add To Cart" width={"100%"} />
        )}
        {promotion.selectproduct && isProduct?.discount && (
          <PrimaryButton
            onClick={() => handleSelectDiscount(isProduct.id ?? 0, "edit")}
            type="button"
            text={isProduct?.discount?.percent === 0 ? "Set Discount" : "Edit"}
            width="50%"
            radius="10px"
          />
        )}
        {showLowStock()}
      </div>
      {openmodal && (
        <>
          {openmodal[`variant${props.id}`] && (
            <Variantcontainer
              type="stock"
              editindex={props.id}
              closename={closename}
            />
          )}
          {props.id && openmodal[`size${props.id}`] && (
            <Sizecontainer index={props.id} type="edit" closename={closename} />
          )}
          {openmodal[`stock${props.id}`] && (
            <UpdateStockModal closename={closename} />
          )}
        </>
      )}
    </>
  );
}
interface SecondayCardprops {
  id: number;
  img: string | StaticImageData;
  name: string;
  price: Orderpricetype;
  selecteddetail: Array<Productorderdetailtype>;
  selectedqty: number;
  maxqty?: number;
  width?: string;
  action?: boolean;
  removecart: () => Promise<void>;
  settotal: (param?: totalpricetype) => void;
}
export function SecondayCard(props: SecondayCardprops) {
  const [editqty, seteditqty] = useState(props.selectedqty);
  const [loading, setloading] = useState(false);
  const price = parseFloat(props.price.price.toString()).toFixed(2);
  const showprice = () => {
    const hasdiscount = (
      <div className="w-fit h-full flex flex-row gap-x-5">
        <h3 className="text-lg font-medium"> ${price} </h3>
        <h3 className="text-lg font-bold text-red-500">
          {" "}
          {`- ${props.price.discount?.percent}%`}{" "}
        </h3>
        <h3 className="text-lg font-bold">
          {" "}
          {`$${parseFloat(
            props.price.discount?.newprice?.toString() ?? `0.00`
          ).toFixed(2)}`}{" "}
        </h3>
      </div>
    );

    return !props.price.discount ? (
      <h3 className="text-lg font-bold w-full h-full"> ${price} </h3>
    ) : (
      hasdiscount
    );
  };

  const handleEditQty = async ({ target }: ChangeEvent<HTMLSelectElement>) => {
    //update cartitem
    const value = parseInt(`${target.value}`);
    const updatereq = Editcart.bind(null, { id: props.id, qty: value });
    const update = await updatereq();

    if (!update.success) {
      errorToast("Can't update quantity");
      return;
    }
    seteditqty(target.value !== "" ? value : 0);
    props.settotal(update.total);
  };

  const selecteddetailcard = (text: string, key: string, type: string) => (
    <div
      key={key}
      style={
        type === "COLOR"
          ? { backgroundColor: text, width: "40px", height: "40px" }
          : {}
      }
      className={`max-w-[125px] break-words  h-fit p-1 bg-white outline-1 outline outline-gray-400 text-lg font-medium rounded-lg ${
        type === "COLOR" ? `bg-[${text}]` : ""
      }`}
    >
      {type !== "COLOR" ? text : ""}
    </div>
  );

  const handleDelete = async () => {
    setloading(true);
    await props.removecart();
    setloading(false);
  };
  return (
    <div className="w-full h-fit flex flex-col  items-end gap-y-5">
      <div
        style={{ width: props.width }}
        className="secondarycard__container flex flex-row items-start bg-[#F4FAFF] justify-between w-full gap-x-2"
      >
        <Image
          src={props.img}
          alt="cover"
          className="cardimage w-[250px] h-[350px] object-cover"
          width={600}
          height={600}
          quality={50}
          loading="lazy"
        />
        <div className="product_detail flex flex-col items-start gap-y-5 w-full">
          <div className="product_info flex flex-col gap-y-5 max-w-[250px] break-words">
            <h3 className="text-lg font-bold w-fit"> {props.name}</h3>
            {showprice()}
          </div>

          <div className="selecteddetails flex flex-row items-center gap-x-3 w-full h-fit max-h-[200px]">
            {props.selecteddetail.map((detail) =>
              selecteddetailcard(
                detail.option_value,
                detail.option_title,
                detail.option_type
              )
            )}
          </div>
          <div className="qty flex flex-col gap-y-1 w-full h-fit">
            <label className="text-lg font-bold">Quantity</label>
            <Selection
              value={editqty}
              onChange={handleEditQty}
              data={Array.from({ length: props.maxqty ?? 0 }).map(
                (_, idx) => idx + 1
              )}
              style={{ width: "90%", height: "fit-content" }}
            />
          </div>

          <i
            onClick={() => handleDelete()}
            className={`fa-solid fa-trash relative transition duration-300 active:text-white ${
              loading ? "animate-spin" : ""
            }`}
          ></i>
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
  bannersize?: "normal" | "small";
  isExpired?: boolean;
}
export const BannerCard = ({
  data,
  index,
  id,
  type,
  isExpired,
  bannersize,
}: Bannercardprops) => {
  const { promotion, setpromotion, openmodal, isLoading, setisLoading } =
    useGlobalContext();
  const ref = useRef<HTMLDivElement | null>(null);
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
  const handleSelectBanner = () => {
    if (promotion.selectbanner) {
      let ID = 0;
      isBanner ? (ID = 0) : (ID = id as number);
      setpromotion((prev) => ({
        ...prev,
        banner_id: ID === 0 ? undefined : ID,
      }));
    }
  };
  return (
    <div
      ref={ref}
      key={index}
      onMouseLeave={() => {
        setopen(false);
      }}
      onClick={() => handleSelectBanner()}
      className={`Banner__container relative w-full h-full transition-all rounded-t-lg border-t border-l border-r border-gray-300  duration-300 hover:-translate-y-3`}
    >
      {isExpired && (
        <h3
          className={
            "status w-full h-fit p-2 bg-red-300 font-bold text-lg text-white"
          }
        >
          Expired
        </h3>
      )}
      <div className="relative w-full h-full">
        <Image
          src={data.url ?? ""}
          alt={`Banner`}
          className="banner w-full h-full object-cover"
          loading="lazy"
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
          width={600}
          height={600}
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
        {type === "banner" && isBanner && promotion.selectbanner && (
          <Image
            src={Checkmark}
            alt="checkmark"
            width={1000}
            height={1000}
            className="w-[30px] h-[30px] object-contain"
          />
        )}
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
  uid: string;
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
