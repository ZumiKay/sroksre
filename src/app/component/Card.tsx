"use client";

import Image, { StaticImageData } from "next/image";
import PrimaryButton from "./Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faImage,
  faPercent,
  faTag,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useRef, useState, useCallback, useMemo, memo } from "react";
import { ImageWithLoader } from "./ImageWithLoader";
import { PrimaryPhoto } from "./PhotoComponent";
import { useGlobalContext } from "@/src/context/GlobalContext";
import Checkmark from "../../../public/Image/Checkmark.svg";
import { SubInventoryMenu } from "./Navbar";
import { errorToast } from "./Loading";
import { useRouter } from "next/navigation";
import {
  Orderpricetype,
  totalpricetype,
  VariantOptionsType,
} from "@/src/types/order.type";
import { Variantcontainer } from "./Modals/VariantModal";
import { UpdateStockModal } from "./Modals/Stock";
import { Chip, Skeleton } from "@heroui/react";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import { SelectionCustom } from "./Pagination_Component";
import {
  productcoverstype,
  StockTypeEnum,
  VariantValueObjType,
} from "@/src/types/product.type";
import { PromotionState } from "@/src/types/productAction.type";
import dayjs from "dayjs";

interface cardprops {
  name: string;
  price: string;
  img: productcoverstype[];
  selectedVariantOptions?: VariantOptionsType[];
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
    allData,
    setalldata,
  } = useGlobalContext();
  const route = useRouter();
  const isProduct = useMemo(
    () => promotion.Products.find((i) => i.id === props.id),
    [promotion.Products, props.id],
  );
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
      const temp: Array<number> = [];

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
          // Accumulate: earlier removals must survive later toggles
          tempproduct: Array.from(
            new Set([...(prev.tempproduct ?? []), ...temp]),
          ),
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

  // Condition
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
        className="w-7.5 h-7.5 object-contain"
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
          {hasDiscount?.newprice
            ? `$${Number(hasDiscount.newprice).toFixed(2)}`
            : ""}
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
        className={`card__container ${props.width ? "" : "w-full max-w-sm"} h-fit flex flex-col mx-auto
       rounded-xl shadow-xs transition-all duration-300 overflow-hidden animate-fade-in
       ${
         promotion.selectproduct
           ? isProduct
             ? "border-2 border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-300 ring-offset-1 scale-[1.01]"
             : "border-2 border-orange-300 hover:border-orange-500 hover:shadow-md hover:shadow-orange-100 cursor-pointer"
           : "border border-gray-200 hover:border-gray-400 hover:shadow-md"
       }
        `}
      >
        <div
          onClick={() => {
            if (promotion.selectproduct) {
              handleSelectDiscount(props.id as number, "create");
            }
          }}
          className="cardimage__container flex flex-col justify-center items-center relative w-full h-full bg-gray-50 overflow-hidden"
        >
          <PrimaryPhoto
            showcount={false}
            data={props.img}
            hover={hover}
            isMobile={isMobile}
            isTablet={isTablet}
            disablePreview
          />

          {promotion.selectproduct && !isProduct && (
            <div className="absolute inset-0 bg-orange-400/0 hover:bg-orange-400/10 transition-colors duration-200 flex items-center justify-center pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                Click to select
              </span>
            </div>
          )}
          {promotion.selectproduct && isProduct && (
            <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
          )}
          <span className="absolute top-3 right-3">
            {shouldShowCheckmark ? (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-300">
                {showCheckmark}
              </div>
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
        <div
          onClick={() =>
            !promotion.selectproduct &&
            route.push(`/product/detail/${props.id}`)
          }
          className="card_detail w-full h-fit font-semibold flex flex-col justify-center gap-y-2 px-3 py-3 rounded-b-md text-sm"
        >
          <p className="card_info w-full max-w-100 h-fit text-lg">
            {props.name.length > 0 ? props.name : "No Product Created"}
          </p>

          {hasDiscount ? showDiscountPrice : showOriginalPrice}
        </div>
        {props.button && (
          <PrimaryButton type="button" text="Add To Cart" width={"100%"} />
        )}
        {promotion.selectproduct && isProduct?.discount && (
          <div className="px-3 pb-3">
            <button
              onClick={() => handleSelectDiscount(isProduct.id ?? 0, "edit")}
              type="button"
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] ${
                isProduct?.discount?.percent === 0
                  ? "bg-linear-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-200"
                  : "bg-linear-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-blue-200"
              }`}
            >
              <FontAwesomeIcon
                icon={isProduct?.discount?.percent === 0 ? faPercent : faTag}
                className="text-xs"
              />
              {isProduct?.discount?.percent === 0
                ? "Set Discount"
                : `Edit · ${isProduct.discount.percent}% off`}
            </button>
          </div>
        )}
        {showLowStock}
      </div>
      {openmodal?.[closename] && props.stocktype === StockTypeEnum.variants ? (
        <Variantcontainer
          type="stock"
          editindex={props.id}
          closename={closename}
        />
      ) : openmodal?.[closename] &&
        props.stocktype === StockTypeEnum.normal &&
        props.id ? (
        <UpdateStockModal closename={closename} productId={props.id} />
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
  selecteddetail?: (string | VariantValueObjType)[];
  selectedVariantOptions?: VariantOptionsType[];
  selectedqty: number;
  maxqty?: number;
  width?: string;
  action?: boolean;
  removecart: () => Promise<void>;
  settotal: (param?: totalpricetype) => void;
  setreloadcart: (value: boolean) => void;
}
type SelectedDetailItem = string | VariantValueObjType | VariantOptionsType;

export const Selecteddetailcard = ({ text }: { text: SelectedDetailItem }) => {
  const isVariantOption = (
    value: SelectedDetailItem,
  ): value is VariantOptionsType =>
    typeof value !== "string" &&
    typeof value.price === "number" &&
    typeof value.name === "object" &&
    value.name !== null;

  const variantValue =
    typeof text === "string"
      ? undefined
      : isVariantOption(text)
        ? text.name
        : text;
  const label =
    typeof text === "string"
      ? text
      : isVariantOption(text)
        ? (text.name.name ?? text.name.val)
        : (text.name ?? text.val);
  const price = (text as VariantValueObjType).price
    ? (text as VariantValueObjType).price
    : undefined;

  return (
    <Chip
      variant="bordered"
      size="lg"
      startContent={
        variantValue &&
        typeof variantValue !== "string" && (
          <div
            style={{ backgroundColor: variantValue.val }}
            className="w-6.25 h-6.25 rounded-full"
          ></div>
        )
      }
    >
      {label}
      {typeof price === "number" && (
        <span className="ml-1 font-semibold text-green-600">
          (${(price as number).toFixed(2)})
        </span>
      )}
    </Chip>
  );
};

export const SecondayCard = memo(function SecondayCard(
  props: SecondayCardprops,
) {
  const [editqty, seteditqty] = useState(props.selectedqty);
  const [loading, setloading] = useState(false);

  const selectedDetails = useMemo<SelectedDetailItem[]>(() => {
    if (props.selectedVariantOptions && props.selectedVariantOptions.length) {
      return props.selectedVariantOptions;
    }
    return props.selecteddetail ?? [];
  }, [props.selectedVariantOptions, props.selecteddetail]);

  const basePrice = useMemo(
    () => Number(props.price.price) || 0,
    [props.price.price],
  );
  const extraPrice = useMemo(
    () => Number(props.price.extra) || 0,
    [props.price.extra],
  );
  const totalBeforeDiscount = useMemo(
    () => basePrice + extraPrice,
    [basePrice, extraPrice],
  );

  const priceDisplay = useMemo(() => {
    const format = (value: number) => `$${value.toFixed(2)}`;
    const discountPercent = props.price.discount?.percent ?? 0;
    const discountedTotal =
      props.price.discount?.newprice ??
      (discountPercent > 0
        ? totalBeforeDiscount * (1 - discountPercent / 100)
        : totalBeforeDiscount);

    if (!props.price.discount) {
      return (
        <div className="flex flex-col gap-y-1">
          {extraPrice > 0 ? (
            <div className="text-sm text-gray-500">
              {format(basePrice)} + {format(extraPrice)}
              <span className="mx-1">=</span>
              <span className="font-semibold text-gray-700">
                {format(totalBeforeDiscount)}
              </span>
            </div>
          ) : null}
          <span className="text-xl font-bold text-gray-900">
            {format(totalBeforeDiscount)}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-1">
        {extraPrice > 0 ? (
          <div className="text-sm text-gray-500">
            {format(basePrice)} + {format(extraPrice)}
            <span className="mx-1">=</span>
            <span className="font-semibold text-gray-700">
              {format(totalBeforeDiscount)}
            </span>
          </div>
        ) : null}
        <div className="flex flex-row items-center gap-x-3">
          <span className="text-base font-medium text-gray-400 line-through">
            {format(totalBeforeDiscount)}
          </span>
          <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
            -{discountPercent}%
          </span>
          <span className="text-xl font-bold text-gray-900">
            {format(discountedTotal)}
          </span>
        </div>
      </div>
    );
  }, [basePrice, extraPrice, totalBeforeDiscount, props.price.discount]);

  const qtyOptions = useMemo(
    () =>
      Array.from({ length: props.maxqty ?? 0 }).map((_, idx) => ({
        label: (idx + 1).toString(),
        value: (idx + 1).toString(),
      })),
    [props.maxqty],
  );

  const handleEditQty = useCallback(
    async (value: string) => {
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
    },
    [props.id, props.setreloadcart],
  );

  const handleDelete = useCallback(async () => {
    setloading(true);
    await props.removecart();
    setloading(false);
  }, [props.removecart]);

  return (
    <div className="w-full flex flex-col gap-y-3 p-2">
      <div
        style={{ width: props.width }}
        className="secondarycard__container group flex flex-row items-stretch bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 w-full overflow-hidden max-small_phone:flex-col"
      >
        <div className="relative shrink-0 w-44 max-large_phone:w-32 max-small_phone:w-full max-small_phone:h-48 bg-gray-50">
          <Image
            src={props.img}
            alt={props.name}
            className="object-contain w-full h-full"
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 128px, 176px"
            quality={75}
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between gap-y-3 p-4 w-full min-w-0">
          {/* Product info */}
          <div className="flex flex-col gap-y-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {props.name}
            </h3>
            {priceDisplay}
          </div>

          {/* Selected Variants */}
          {selectedDetails.length > 0 && (
            <div className="flex flex-row flex-wrap gap-2 max-h-24 overflow-y-auto">
              {selectedDetails.map((selected, idx) => (
                <Selecteddetailcard key={idx} text={selected} />
              ))}
            </div>
          )}

          {/* Quantity + Delete row */}
          <div className="flex flex-row items-end justify-between gap-x-3 mt-auto">
            <div className="flex flex-col gap-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Quantity
              </label>
              <SelectionCustom
                label="QTY"
                placeholder="Select"
                size="sm"
                style={{ width: "130px" }}
                value={editqty.toString()}
                isLoading={loading}
                onChange={(value) => handleEditQty(value as string)}
                data={qtyOptions}
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={loading}
              aria-label="Remove item"
              className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <FontAwesomeIcon
                icon={faTrash}
                className={loading ? "animate-pulse" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {props.action && (
        <div className="flex flex-row items-center gap-x-3 px-2">
          <PrimaryButton
            type="button"
            text="Returns"
            width="110px"
            height="32px"
            radius="8px"
            color="#0097FA"
            textcolor="white"
            hoverColor="black"
          />
          <PrimaryButton
            type="button"
            text="Delete"
            width="110px"
            height="32px"
            radius="8px"
            color="#F08080"
            textcolor="white"
            hoverColor="black"
          />
        </div>
      )}
    </div>
  );
});

export const CardSkeleton = () => {
  return (
    <div className=" w-full flex items-start gap-3 h-fit">
      <Skeleton className="flex rounded-lg w-62.5 h-37.5" />
      <Skeleton className="h-37.5 w-full rounded-lg" />
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
  promodata,
  bannersize,
  isExpired,
  reloaddata,
}: Bannercardprops) {
  const { promotion, setpromotion, openmodal } = useGlobalContext();

  const isBanner = useMemo(
    () => promotion.banner_id === id,
    [promotion.banner_id, id],
  );
  const isSelecting = promotion.selectbanner;
  const isPicked = isSelecting && isBanner;
  const hasImage = !!data.url;

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
    if (promotion.selectbanner) {
      const ID = isBanner ? 0 : (id as number);
      setpromotion((prev) => ({
        ...prev,
        banner_id: ID === 0 ? undefined : ID,
      }));
    }
  }, [promotion.selectbanner, isBanner, id, setpromotion]);

  // Promotions show when they end; banners show their size
  const endDate = promodata?.expireAt ? dayjs(promodata.expireAt) : undefined;
  const meta =
    type === "promotion"
      ? endDate?.isValid()
        ? `${isExpired ? "Ended" : "Ends"} ${endDate.format("MMM D, YYYY")}`
        : "Promotion"
      : `Banner${bannersize ? ` · ${bannersize === "small" ? "Small" : "Normal"}` : ""}`;

  return (
    <div
      key={index}
      onClick={handleSelectBanner}
      aria-pressed={isSelecting ? isPicked : undefined}
      className={`Banner__container group relative w-full h-full flex flex-col bg-white rounded-xl overflow-hidden border transition-all duration-200 ${
        isPicked
          ? "border-slate-900 ring-2 ring-slate-900"
          : isSelecting
            ? "border-slate-200 hover:border-slate-400 cursor-pointer"
            : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="relative w-full flex-1 min-h-0 aspect-2/1 overflow-hidden bg-slate-100">
        {hasImage ? (
          <ImageWithLoader
            src={data.url}
            alt={data.name || "Banner"}
            className={`banner w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isExpired ? "grayscale opacity-60" : ""
            }`}
            containerClassName="w-full h-full"
            loading="lazy"
            width={600}
            height={600}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
            <FontAwesomeIcon icon={faImage} className="text-xl" />
            <span className="text-xs font-medium">No banner image</span>
          </div>
        )}

        {isExpired && (
          <span className="status absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Expired
          </span>
        )}

        {isSelecting && !isPicked && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
              Click to select
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col gap-0.5 px-4 py-3 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-900 line-clamp-1 wrap-break-word">
          {data.name.length === 0 ? "Untitled" : data.name}
        </p>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>

      <span className="action_container absolute top-2.5 right-2.5 z-20">
        {isPicked ? (
          <span
            aria-label="Selected"
            className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md"
          >
            <FontAwesomeIcon icon={faCheck} className="text-xs" />
          </span>
        ) : (
          !isSelecting &&
          !openmodal.managebanner && (
            // Always visible on touch screens; fades in on hover elsewhere
            <div className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <SubInventoryMenu
                data={actionMenu}
                type={type}
                style={{ top: "0", right: "0" }}
                index={id}
                reloaddata={reloaddata}
              />
            </div>
          )
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
      className="usercard_container max-smallest_phone:w-68.75 w-82.5 h-25 rounded-lg border-2 border-black flex flex-col justify-center items-center gap-y-5 p-2 transition hover:bg-black hover:text-white"
    >
      <h3 className="text-md font-bold w-full text-center wrap-break-word">
        {`${firstname} ${lastname}`} #{uid}
      </h3>
      <h3 className="text-md text-center font-bold w-full wrap-break-word">
        {email}
      </h3>
    </div>
  );
};
