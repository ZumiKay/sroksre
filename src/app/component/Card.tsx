"use client";
import Image, { StaticImageData } from "next/image";
import PrimaryButton from "./Button";
import "../globals.css";
import { useRef, useState, useCallback, useMemo, memo } from "react";
import { ImageWithLoader } from "./ImageWithLoader";
import { PrimaryPhoto } from "./PhotoComponent";
import { useGlobalContext } from "@/src/context/GlobalContext";
import Checkmark from "../../../public/Image/Checkmark.svg";
import { SubInventoryMenu } from "./Navbar";
import { errorToast } from "./Loading";
import { useRouter } from "next/navigation";
import { Orderpricetype, totalpricetype } from "@/src/types/order.type";
import { Variantcontainer } from "./Modals/VariantModal";
import { UpdateStockModal } from "./Modals/Stock";
import { Chip, Skeleton } from "@nextui-org/react";
import {
  ApiRequest,
  useClickOutside,
  useScreenSize,
} from "@/src/context/CustomHook";
import { SelectionCustom } from "./Pagination_Component";
import {
  productcoverstype,
  StockTypeEnum,
  VariantColorValueType,
} from "@/src/types/product.type";
import { PromotionState } from "@/src/types/productAction.type";

interface cardprops {
  name: string;
  price: string;
  img: productcoverstype[];
  isAdmin?: boolean;
  button?: boolean;
  index?: number;
  hover?: boolean;
  id?: number;
  discount?: Orderpricetype;
  stock?: number;
  lowstock?: boolean;
  stocktype?: string;
  width?: string;
  height?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  reloaddata?: () => void;
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

const Card = memo(function Card(props: cardprops) {
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
  const isProduct = useMemo(
    () => promotion.Products.find((i) => i.id === props.id),
    [promotion.Products, props.id],
  );
  const [previewphoto, setpreviewphoto] = useState(false);
  const [hover, sethover] = useState(false);
  const { isMobile, isTablet } = useScreenSize();

  const [showEditMenu, setShowEditMenu] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = useCallback(() => {
    sethover(true);
    setShowEditMenu(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    sethover(false);
    setShowEditMenu(false);
  }, []);

  const handleSelectDiscount = useCallback(
    async (id: number, type: "create" | "edit") => {
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
            let allproduct = [...(allData?.product ?? [])];
            allproduct = allproduct.map((i) => {
              if (i.id === id) {
                return { ...i, discount: undefined };
              }
              return i;
            });

            promo.splice(index, 1);
            setalldata({ product: allproduct });
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
    },
    [
      promotion.Products,
      props.discount,
      isProduct,
      promotion.tempproduct,
      allData?.product,
      setpromotion,
      setalldata,
      setglobalindex,
      setopenmodal,
    ],
  );

  ///JSX CONDITIONS - Memoized for performance
  const shouldShowCheckmark = useMemo(
    () => promotion.selectproduct && isProduct?.discount,
    [promotion.selectproduct, isProduct?.discount],
  );

  const showCheckmark = useMemo(
    () => (
      <Image
        src={Checkmark}
        alt="checkmark"
        width={50}
        height={50}
        className="w-[30px] h-[30px] object-contain"
      />
    ),
    [],
  );

  const hasDiscount = useMemo(
    () => props.discount?.discount,
    [props.discount?.discount],
  );
  const showOriginalPrice = useMemo(
    () => (
      <h4 className="text-sm font-semibold">
        ${parseFloat(props.price).toFixed(2)}
      </h4>
    ),
    [props.price],
  );

  const showDiscountPrice = useMemo(
    () => (
      <div className="price_con flex flex-row flex-wrap items-center gap-x-5 w-full h-fit">
        <p className="text-sm font-light line-through decoration-red-300 decoration-2">
          ${parseFloat(props.price).toFixed(2)}
        </p>
        <p className="text-lg font-semibold text-red-500">
          -{hasDiscount?.percent ?? 0}%
        </p>
        <p className="text-sm font-medium">
          {hasDiscount?.newprice ? `$${hasDiscount?.newprice}` : ""}
        </p>
      </div>
    ),
    [props.price, hasDiscount],
  );

  const closename = useMemo(
    () => (props.stocktype && props.id ? props.stocktype + props.id : ""),
    [props.stocktype, props.id],
  );

  const handleLowStockClick = useCallback(() => {
    setopenmodal((prev) => ({
      ...prev,
      [closename]: true,
    }));
  }, [closename, setopenmodal]);

  const showLowStock = useMemo(
    () =>
      !promotion.selectproduct && props.lowstock && props.isAdmin ? (
        <PrimaryButton
          type="button"
          text="Low Stock"
          onClick={handleLowStockClick}
          width="100%"
          color="lightcoral"
        />
      ) : null,
    [
      promotion.selectproduct,
      props.lowstock,
      props.isAdmin,
      handleLowStockClick,
    ],
  );
  //
  ///end

  return (
    <>
      <div
        key={props.index}
        ref={ref}
        style={{ width: props.width, height: props.height }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchCancel={handleMouseLeave}
        className={`card__container w-[500px] h-fit flex flex-col
       hover:border-[2px] hover:border-gray-300 ${
         isProduct ? "border border-gray-300" : ""
       } 
        max-smaller_screen:w-[350px] 
        max-large_tablet:w-[280px]
        animate-fade-in
        `}
      >
        <div
          onClick={() => {
            if (promotion.selectproduct) {
              handleSelectDiscount(props.id as number, "create");
            } else if (!props.isAdmin) {
              !previewphoto && route.push(`/product/detail/${props.id}`);
            }
          }}
          className="cardimage__container flex flex-col justify-center items-center relative w-full h-full bg-gray-50"
        >
          <PrimaryPhoto
            showcount={false}
            data={props.img}
            hover={hover}
            setclick={setpreviewphoto}
            isMobile={isMobile}
            isTablet={isTablet}
          />

          <span className="absolute top-3 right-3">
            {shouldShowCheckmark ? (
              showCheckmark
            ) : showEditMenu && props.isAdmin ? (
              <SubInventoryMenu
                data={editactionMenu}
                index={props.id}
                type="product"
                style={{ right: "0", top: 0 }}
                open="createProduct"
                stock={props.stock}
                stocktype={props.stocktype}
                reloaddata={props.reloaddata}
                stockaction={() => {
                  setopenmodal((prev) => ({
                    ...prev,
                    [closename]: true,
                  }));
                }}
              />
            ) : (
              ""
            )}
          </span>
        </div>
        <div className="card_detail w-full h-fit font-semibold flex flex-col justify-center gap-y-3  pl-2 rounded-b-md text-sm">
          <p className="card_info w-full max-w-[400px] h-fit text-lg">
            {props.name.length > 0 ? props.name : "No Product Created"}
          </p>

          {hasDiscount ? showDiscountPrice : showOriginalPrice}
        </div>
        {props.button && (
          <PrimaryButton type="button" text="Add To Cart" width={"100%"} />
        )}
        {promotion.selectproduct && isProduct?.discount && (
          <PrimaryButton
            onClick={() => handleSelectDiscount(isProduct.id ?? 0, "edit")}
            type="button"
            text={isProduct?.discount?.percent === 0 ? "Set Discount" : "Edit"}
            width="150px"
            radius="10px"
          />
        )}
        {showLowStock}
      </div>
      {openmodal?.[closename] && props.stocktype === StockTypeEnum.variants ? (
        <Variantcontainer
          type="stock"
          editindex={props.id}
          closename={closename}
        />
      ) : openmodal?.[closename] && props.stocktype === StockTypeEnum.normal ? (
        <UpdateStockModal closename={closename} action={props.reloaddata} />
      ) : (
        <> </>
      )}
    </>
  );
});

export default Card;
interface SecondayCardprops {
  id: number;
  img: string | StaticImageData;
  name: string;
  price: Orderpricetype;
  selecteddetail?: (string | VariantColorValueType)[];
  selectedqty: number;
  maxqty?: number;
  width?: string;
  action?: boolean;
  removecart: () => Promise<void>;
  settotal: (param?: totalpricetype) => void;
  setreloadcart: (value: boolean) => void;
}
export const Selecteddetailcard = ({
  text,
  key,
}: {
  text: string | VariantColorValueType;
  key: number;
}) => (
  <Chip
    key={key}
    variant="bordered"
    size="lg"
    startContent={
      typeof text !== "string" && (
        <div
          style={{ backgroundColor: text.val }}
          className="w-[25px] h-[25px] rounded-full"
        ></div>
      )
    }
  >
    {typeof text === "string" ? text : text.name}
  </Chip>
);

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
            props.price.discount?.newprice?.toString() ?? `0.00`,
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

  const handleEditQty = async (value: string) => {
    //update cartitem
    const val = parseInt(`${value}`);
    setloading(true);
    const updatereq = await ApiRequest(
      "/api/order/cart",
      undefined,
      "PUT",
      "JSON",
      { id: props.id, qty: val },
    );
    setloading(false);

    if (!updatereq.success) {
      errorToast("Can't update quantity");
      return;
    }
    seteditqty(value !== "" ? val : 0);
    props.setreloadcart(true);
  };

  const handleDelete = async () => {
    setloading(true);
    await props.removecart();
    setloading(false);
  };
  return (
    <div className="w-full h-full flex flex-col items-end gap-y-5 p-2">
      <div
        style={{ width: props.width }}
        className="secondarycard__container flex flex-row items-center bg-[#F4FAFF] justify-between w-full gap-x-2 gap-y-3 relative max-small_phone:flex-col "
      >
        <Image
          src={props.img}
          alt="cover"
          className="cardimage w-[250px] max-large_phone:w-[200px] h-auto object-contain rounded-lg"
          width={600}
          height={600}
          quality={50}
          loading="lazy"
        />
        <div className="product_detail flex flex-col items-start gap-y-5 w-full">
          <div className="product_info flex flex-col gap-y-5 w-[90%] break-words">
            <h3 className="text-lg font-bold w-fit"> {props.name}</h3>
            {showprice()}
          </div>

          <div className="selecteddetails flex flex-row items-center flex-wrap gap-3 w-full h-fit max-h-[200px]">
            {props.selecteddetail?.map((selected, idx) => (
              <Selecteddetailcard key={idx} text={selected} />
            ))}
          </div>
          <div className="qty flex flex-col gap-y-1 w-[200px] max-large_phone:[10%] h-fit">
            <label className="text-lg font-bold">Quantity</label>
            <SelectionCustom
              label="QTY"
              placeholder="Select"
              size="sm"
              style={{ width: "150px" }}
              value={editqty.toString()}
              isLoading={loading}
              onChange={(value) => handleEditQty(value as string)}
              data={Array.from({ length: props.maxqty ?? 0 }).map((_, idx) => ({
                label: (idx + 1).toString(),
                value: (idx + 1).toString(),
              }))}
            />
          </div>
        </div>
        <i
          onClick={() => handleDelete()}
          className={`fa-solid fa-trash absolute bottom-2 right-1 transition duration-300 active:text-white ${
            loading ? "animate-spin" : ""
          }`}
        ></i>
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

export const CardSkeleton = () => {
  return (
    <div className=" w-full flex items-start gap-3 h-fit">
      <Skeleton className="flex rounded-lg w-[250px] h-[150px]" />
      <Skeleton className="h-[150px] w-[100%] rounded-lg" />
    </div>
  );
};

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
  reloaddata?: () => void;
}
export const BannerCard = memo(function BannerCard({
  data,
  index,
  id,
  type,
  isExpired,
  reloaddata,
}: Bannercardprops) {
  const { promotion, setpromotion, openmodal } = useGlobalContext();

  const [hover, sethover] = useState(false);
  const isBanner = useMemo(
    () => promotion.banner_id === id,
    [promotion.banner_id, id],
  );

  const ref = useClickOutside(() => sethover(false));

  const actionMenu = useMemo(
    () => [
      {
        value: "Edit",
        opencon: type === "promotion" ? "createPromotion" : "createBanner",
      },
      {
        value: "Delete",
        opencon: "",
      },
    ],
    [type],
  );

  const handleSelectBanner = useCallback(() => {
    sethover(true);
    if (promotion.selectbanner) {
      const ID = isBanner ? 0 : (id as number);
      setpromotion((prev) => ({
        ...prev,
        banner_id: ID === 0 ? undefined : ID,
      }));
    }
  }, [promotion.selectbanner, isBanner, id, setpromotion]);
  return (
    <div
      ref={ref}
      key={index}
      onClick={handleSelectBanner}
      className={`Banner__container group relative w-full h-full transition-all duration-300 ease-in-out
        rounded-lg overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 
        border border-gray-200 hover:border-gray-400 cursor-pointer
        ${
          isBanner && promotion.selectbanner
            ? "ring-4 ring-blue-500 ring-offset-2"
            : ""
        }`}
    >
      {isExpired && (
        <div
          className="status absolute top-0 left-0 right-0 z-10 px-3 py-2 sm:px-4 sm:py-2.5 
          bg-gradient-to-r from-red-500 to-red-600 backdrop-blur-sm"
        >
          <p className="font-bold text-sm sm:text-base md:text-lg text-white text-center flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Expired
          </p>
        </div>
      )}

      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[21/9] overflow-hidden bg-gray-100">
        <ImageWithLoader
          src={data.url ?? ""}
          alt={data.name || "Banner"}
          className="banner w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          containerClassName="w-full h-full"
          loading="lazy"
          width={600}
          height={600}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-3 sm:p-4 bg-gradient-to-br from-[#495464] to-[#3a4350]">
        <p className="text-base sm:text-lg md:text-xl font-bold text-white break-words line-clamp-2 group-hover:text-blue-200 transition-colors duration-200">
          {data.name.length === 0 ? "No name" : data.name}
        </p>
      </div>

      <span className="action_container absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
        {type === "banner" && isBanner && promotion.selectbanner && (
          <div className="bg-white rounded-full p-1 sm:p-1.5 shadow-lg">
            <Image
              src={Checkmark}
              alt="checkmark"
              width={100}
              height={100}
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
            />
          </div>
        )}
        {hover && !promotion.selectbanner && !openmodal.managebanner && (
          <div className="bg-white rounded-lg shadow-xl">
            <SubInventoryMenu
              data={actionMenu}
              type={type}
              style={{ top: "0", right: "0" }}
              index={id}
              reloaddata={reloaddata}
            />
          </div>
        )}
      </span>
    </div>
  );
});

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
      className="usercard_container max-smallest_phone:w-[275px] w-[330px] h-[100px] rounded-lg border-2 border-black flex flex-col justify-center items-center gap-y-5 p-2 transition hover:bg-black hover:text-white"
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
