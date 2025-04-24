"use client";
import Image, { StaticImageData } from "next/image";
import PrimaryButton from "./Button";
import "../globals.css";
import { memo, useCallback, useRef, useState } from "react";
import { PrimaryPhoto } from "./PhotoComponent";
import { errorToast } from "./Loading";
import { useRouter } from "next/navigation";
import { Orderpricetype, totalpricetype } from "@/src/context/OrderContext";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { SelectionCustom } from "./Pagination_Component";
import {
  ImageDatatype,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Chip, Skeleton } from "@heroui/react";

interface cardprops {
  name: string;
  price: string;
  img: ImageDatatype[];
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
  width?: string;
  height?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  reloaddata?: () => void;
}

const Card = memo(
  ({
    id,
    index,
    name,
    price,
    discount,
    img,
    width = "500px",
    height = "fit-content",
    button = false,
    isAdmin = false,
  }: cardprops) => {
    const { promotion } = useGlobalContext();
    const router = useRouter();
    const { isMobile, isTablet } = useScreenSize();
    const ref = useRef<HTMLDivElement | null>(null);

    // State management
    const [previewPhoto, setPreviewPhoto] = useState(false);
    const [hover, setHover] = useState(false);

    // Check if this product is in promotion
    const isPromotedProduct = promotion.products?.some(
      (product) => product.id === id
    );

    // Event handlers - simplified
    const handleMouseEnter = () => {
      setHover(true);
    };

    const handleMouseLeave = () => {
      setHover(false);
    };

    const handleCardClick = () => {
      if (!isAdmin && !previewPhoto) {
        router.push(`/product/detail/${id}`);
      }
    };

    // Price components
    const formattedPrice = parseFloat(price).toFixed(2);

    const OriginalPriceDisplay = () => (
      <h4 className="text-sm font-semibold">${formattedPrice}</h4>
    );

    const DiscountPriceDisplay = () => (
      <div className="price_con flex flex-row flex-wrap items-center gap-x-5 w-full h-fit">
        <p className="text-sm font-light line-through decoration-red-300 decoration-2">
          ${formattedPrice}
        </p>
        <p className="text-lg font-semibold text-red-500">
          -{discount?.percent ?? 0}%
        </p>
        {discount?.newprice && (
          <p className="text-sm font-medium">${discount.newprice}</p>
        )}
      </div>
    );

    return (
      <div
        key={index}
        ref={ref}
        style={{ width, height }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchCancel={handleMouseLeave}
        className={`card__container w-[500px] h-fit flex flex-col
        hover:border-[2px] hover:border-gray-300 
        ${isPromotedProduct ? "border border-gray-300" : ""} 
        max-smaller_screen:w-[350px] 
        max-large_tablet:w-[280px]
        animate-fade-in`}
      >
        <div
          onClick={handleCardClick}
          className="cardimage__container flex flex-col justify-center items-center relative w-full h-full bg-gray-50"
        >
          <PrimaryPhoto
            showcount={false}
            data={img}
            hover={hover}
            setclick={setPreviewPhoto}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </div>

        <div className="card_detail w-full h-fit font-semibold flex flex-col justify-center gap-y-3 pl-2 rounded-b-md text-sm">
          <p className="card_info w-full max-w-[400px] h-fit text-lg">
            {name || "No Product Created"}
          </p>

          {discount ? <DiscountPriceDisplay /> : <OriginalPriceDisplay />}
        </div>

        {button && (
          <PrimaryButton type="button" text="Add To Cart" width="100%" />
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

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

  const handleEditQty = async (value: string) => {
    //update cartitem
    const val = parseInt(`${value}`);
    setloading(true);
    const updatereq = await ApiRequest({
      url: "/api/order/cart",
      method: "PUT",
      data: { id: props.id, qty: val },
    });
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

interface BannerCardProps {
  data: {
    url: string;
    name: string;
  };
  index: number;
  id: number | undefined;
  isExpired?: boolean;
}

export const BannerCard = memo(
  ({ data, index, id, isExpired = false }: BannerCardProps) => {
    const { promotion, setpromotion } = useGlobalContext();
    const isBanner = promotion.banner_id === id;

    const handleSelectBanner = useCallback(() => {
      if (!promotion.selectbanner) return;

      setpromotion((prev) => ({
        ...prev,
        banner_id: isBanner ? undefined : id,
      }));
    }, [id, isBanner, promotion.selectbanner, setpromotion]);

    return (
      <div
        key={index}
        onClick={handleSelectBanner}
        className={`
        Banner__container 
        relative w-full h-full 
        transition-all duration-300 
        rounded-t-lg 
        border-t border-l border-r border-gray-300 
        hover:-translate-y-3
      `}
      >
        {isExpired && (
          <p className="status w-full h-fit p-2 bg-red-300 font-bold text-lg text-white">
            Expired
          </p>
        )}

        <div className="relative w-full h-full">
          <Image
            src={data.url || ""}
            alt={`Banner ${data.name || "image"}`}
            className="banner w-full h-full object-cover"
            loading="lazy"
            width={600}
            height={600}
          />
        </div>

        <p className="Banner text-xl w-full h-fit break-words p-1 bg-[#495464] rounded-b-lg font-bold text-white">
          {data.name || "No name"}
        </p>
      </div>
    );
  }
);

BannerCard.displayName = "BannerCard";
