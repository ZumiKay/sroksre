"use client";
import Image, { StaticImageData } from "next/image";
import PrimaryButton from "./Button";
import "../globals.css";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { PrimaryPhoto } from "./PhotoComponent";
import { errorToast } from "./Loading";
import { useRouter } from "next/navigation";
import { totalpricetype } from "@/src/context/OrderContext";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import {
  ImageDatatype,
  ProductState,
  VariantColorValueType,
} from "@/src/context/GlobalType.type";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Chip, Skeleton } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { AsyncSelection } from "./AsynSelection";
import { IsNumber } from "@/src/lib/utilities";

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
    const isPromotedProduct = promotion.Products?.some(
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
  price: Pick<ProductState, "price" | "discount">;
  selecteddetail?: (string | VariantColorValueType)[];
  selectedqty: number;
  maxqty?: number;
  width?: string;
  action?: boolean;
  removecart: () => Promise<void>;
  settotal: (param?: totalpricetype) => void;
}
export const Selecteddetailcard = ({
  text,
}: {
  text: string | VariantColorValueType;
}) => (
  <Chip
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
  const { setreloadcart } = useGlobalContext();
  const [editqty, seteditqty] = useState(props.selectedqty);
  const [loading, setloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Memoize price calculations to prevent unnecessary re-renders
  const priceData = useMemo(() => {
    const basePrice = parseFloat(props.price.price.toString()).toFixed(2);
    const hasDiscount = !!props.price.discount;
    const discountPercent = props.price.discount?.percent;
    const newPrice = props.price.discount?.newprice
      ? parseFloat(props.price.discount.newprice.toString()).toFixed(2)
      : "0.00";

    return { basePrice, hasDiscount, discountPercent, newPrice };
  }, [props.price]);

  // Memoize quantity options to prevent recreation on every render
  const quantityOptions = useMemo(
    () =>
      Array.from({ length: props.maxqty ?? 0 }, (_, idx) => ({
        label: (idx + 1).toString(),
        value: (idx + 1).toString(),
      })),
    [props.maxqty]
  );

  // Optimized price display component
  const PriceDisplay = useMemo(() => {
    if (!priceData.hasDiscount) {
      return (
        <div className="price-container">
          <span className="text-xl font-bold text-gray-900">
            ${priceData.basePrice}
          </span>
        </div>
      );
    }

    return (
      <div className="price-container flex items-center gap-3 flex-wrap">
        <span className="text-lg font-medium text-gray-500 line-through">
          ${priceData.basePrice}
        </span>
        <div className="discount-badge bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-semibold">
          -{priceData.discountPercent}%
        </div>
        <span className="text-xl font-bold text-green-600">
          ${priceData.newPrice}
        </span>
      </div>
    );
  }, [priceData]);

  // Debounced quantity update
  const handleEditQty = useCallback(
    async (value: string) => {
      const val = parseInt(value);
      if (!IsNumber(value)) return;

      try {
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

        seteditqty(val);
        setreloadcart(true);
      } catch (error) {
        errorToast("Failed to update quantity");
        throw error;
      }
    },
    [props.id, setreloadcart]
  );

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await props.removecart();
    } catch (error) {
      errorToast("Failed to remove item");
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [props]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="product-card bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
          {/* Card Header with Delete Button */}
          <div className="relative p-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              disabled={isDeleting || loading}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="fa-solid fa-trash text-sm" />
              )}
            </motion.button>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="relative w-48 h-48 lg:w-56 lg:h-56">
                  <Image
                    src={props.img}
                    alt={props.name}
                    fill
                    className="object-contain rounded-lg"
                    quality={75}
                    loading="lazy"
                    sizes="(max-width: 768px) 192px, 224px"
                  />
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 space-y-4">
                {/* Product Name */}
                <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                  {props.name}
                </h3>

                {/* Price Display */}
                {PriceDisplay}

                {/* Selected Details */}
                {props.selecteddetail && props.selecteddetail.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Options:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {props.selecteddetail.map((selected, idx) =>
                        typeof selected === "string" ? (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 border border-blue-300`}
                          >
                            {selected}
                          </span>
                        ) : (
                          <div
                            className="w-fit max-w-[200px] flex flex-row gap-x-3 items-center p-2 border border-gray-200 rounded-md"
                            key={idx}
                          >
                            <span
                              style={{ backgroundColor: selected.val }}
                              className={`w-[17px] h-[17px] rounded-full`}
                            ></span>
                            <p>{selected.name}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <div className="relative w-32">
                    <AsyncSelection
                      type="normal"
                      data={() => quantityOptions}
                      option={{
                        size: "sm",
                        label: "QTY",
                        defaultSelectedKeys: [editqty.toString()],
                        selectedValue: [editqty.toString()],
                        onChange: (val) => handleEditQty(val.target.value),
                      }}
                    />
                    {loading && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {props.action && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-gray-100 p-4 bg-gray-50"
            >
              <div className="flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 border border-red-200 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <i className="fa-solid fa-trash mr-2" />
                  )}
                  Delete Item
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
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
