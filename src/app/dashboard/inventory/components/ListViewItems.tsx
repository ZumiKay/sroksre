"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Orderpricetype } from "@/src/types/order.type";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { SubInventoryMenu } from "@/src/app/component/Navbar";
import Checkmark from "../../../../../public/Image/Checkmark.svg";
import { ProductState } from "@/src/types/product.type";
import { errorToast } from "@/src/app/component/Loading";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faClock, faCheck } from "@fortawesome/free-solid-svg-icons";

interface SelectionProps {
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

interface ProductListItemProps extends SelectionProps {
  product: ProductState;
  index: number;
  reloaddata?: () => void;
}

interface BannerListItemProps extends SelectionProps {
  banner: any;
  index: number;
  reloaddata?: () => void;
}

interface PromotionListItemProps extends SelectionProps {
  promotion: any;
  index: number;
  reloaddata?: () => void;
}

const editActionMenu = [
  { value: "Edit", opencon: "createProduct" },
  { value: "Stock", opencon: "updatestock" },
  { value: "Delete", opencon: "" },
];

const SelectCheckbox = ({ checked }: { checked: boolean }) => (
  <div
    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
      checked ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-400"
    }`}
  >
    {checked && (
      <svg
        className="w-3 h-3 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
);

export const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  index,
  reloaddata,
  isSelectMode,
  isSelected = false,
  onToggleSelect,
}) => {
  const {
    promotion,
    setpromotion,
    setglobalindex,
    setopenmodal,
    allData,
    setalldata,
  } = useGlobalContext();

  const [hover, setHover] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const isProduct = useMemo(
    () => promotion.Products.find((i) => i.id === product.id),
    [promotion.Products, product.id],
  );

  const isDiscount = useMemo(
    () => product?.discount as Orderpricetype | undefined,
    [product.discount],
  );

  const handleSelectProduct = useCallback(async () => {
    if (!product.id) {
      errorToast("Sometime wrong with product");
      return;
    }
    if (promotion.selectproduct) {
      const promo = [...promotion.Products];
      let temp: Array<number> = [];
      const idx = promo.findIndex((i) => i.id === product.id);

      if (!product.discount) {
        if (!isProduct) {
          promo.push({
            id: product.id,
            discount: {
              percent: 0,
              newprice: "",
              oldprice: product.price,
            },
          });
        } else {
          promo.splice(idx, 1);
        }
      } else {
        if (isProduct) {
          const isExist = promotion.tempproduct?.includes(product.id);
          !isExist && temp.push(product.id);
          let allproduct = [...(allData?.product ?? [])];
          allproduct = allproduct.map((i) => {
            if (i.id === product.id) {
              return { ...i, discount: undefined };
            }
            return i;
          });
          promo.splice(idx, 1);
          setalldata({ product: allproduct });
        } else {
          promo.push({
            id: product.id,
            discount: {
              percent: 0,
              newprice: "",
              oldprice: product.price,
            },
          });
        }
      }

      setpromotion((prev) => ({
        ...prev,
        Products: promo,
        tempproduct: temp,
      }));
    }
  }, [promotion, product, isProduct, allData, setpromotion, setalldata]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={isSelectMode ? onToggleSelect : handleSelectProduct}
      className={`relative w-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 flex items-center gap-4 border-2 cursor-pointer ${
        isSelectMode && isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : isProduct && promotion.selectproduct
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200"
      }`}
    >
      {isSelectMode && (
        <div
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
        >
          <SelectCheckbox checked={isSelected} />
        </div>
      )}
      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
        {product.covers && product.covers[0] ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
              </div>
            )}
            <Image
              src={product.covers[0].url}
              alt={product.name}
              className="w-full h-full object-cover"
              width={400}
              height={400}
              loading="lazy"
              onLoadingComplete={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FontAwesomeIcon icon={faImage} className="text-3xl" />
          </div>
        )}
        {isProduct && promotion.selectproduct && (
          <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-lg">
            <Image
              src={Checkmark}
              alt="Selected"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-gray-800 truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-xl font-bold text-indigo-600">
            ${parseFloat(product.price.toString()).toFixed(2)}
          </span>
          {isDiscount?.discount && (
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
              {isDiscount.discount.percent
                ? `${isDiscount.discount.percent}% OFF`
                : "Discount Applied"}
            </span>
          )}
          {product.stock && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${
                !product.lowstock
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              Stock: {product.stock}
            </span>
          )}
        </div>
      </div>

      {hover && !promotion.selectproduct && !isSelectMode && (
        <div className="shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
          <SubInventoryMenu
            data={editActionMenu}
            type="product"
            index={product.id}
            stock={product.stock}
            stocktype={product.stocktype}
            stockaction={() => {
              setopenmodal((prev) => ({ ...prev, updatestock: true }));
            }}
            reloaddata={reloaddata}
          />
        </div>
      )}
    </motion.div>
  );
};

export const BannerListItem: React.FC<BannerListItemProps> = ({
  banner,
  index,
  reloaddata,
  isSelectMode,
  isSelected = false,
  onToggleSelect,
}) => {
  const { promotion, setpromotion, openmodal } = useGlobalContext();
  const [hover, setHover] = useState(false);

  const isBanner = useMemo(
    () => promotion.banner_id === banner.id,
    [promotion.banner_id, banner.id],
  );

  const actionMenu = useMemo(
    () => [
      { value: "Edit", opencon: "createBanner" },
      { value: "Delete", opencon: "" },
    ],
    [],
  );

  const handleSelectBanner = useCallback(() => {
    if (promotion.selectbanner) {
      const ID = isBanner ? 0 : (banner.id as number);
      setpromotion((prev) => ({
        ...prev,
        banner_id: ID === 0 ? undefined : ID,
      }));
    }
  }, [promotion.selectbanner, isBanner, banner.id, setpromotion]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={isSelectMode ? onToggleSelect : handleSelectBanner}
      className={`relative w-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 flex items-center gap-4 border-2 cursor-pointer ${
        isSelectMode && isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200"
          : isBanner && promotion.selectbanner
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200"
      }`}
    >
      {isSelectMode && (
        <div
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
        >
          <SelectCheckbox checked={isSelected} />
        </div>
      )}
      <div className="w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
        <Image
          src={banner.image.url}
          alt={banner.name}
          className="w-full h-full object-cover"
          width={400}
          height={400}
          loading="lazy"
        />
        {isBanner && promotion.selectbanner && (
          <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-lg">
            <Image
              src={Checkmark}
              alt="Selected"
              width={20}
              height={20}
              className="w-5 h-5"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-gray-800 truncate">
          {banner.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
            {banner.size}
          </span>
        </div>
      </div>

      {hover &&
        !promotion.selectbanner &&
        !openmodal.managebanner &&
        !isSelectMode && (
          <div className="shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
            <SubInventoryMenu
              data={actionMenu}
              type="banner"
              index={banner.id}
              reloaddata={reloaddata}
            />
          </div>
        )}
    </motion.div>
  );
};

export const PromotionListItem: React.FC<PromotionListItemProps> = ({
  promotion,
  index,
  reloaddata,
  isSelectMode,
  isSelected = false,
  onToggleSelect,
}) => {
  const { openmodal } = useGlobalContext();
  const [hover, setHover] = useState(false);

  const actionMenu = useMemo(
    () => [
      { value: "Edit", opencon: "createPromotion" },
      { value: "Delete", opencon: "" },
    ],
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={isSelectMode ? onToggleSelect : undefined}
      className={`relative w-full bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 flex items-center gap-4 border-2 ${
        isSelectMode && isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200 cursor-pointer"
          : isSelectMode
            ? "border-gray-200 cursor-pointer"
            : "border-gray-200"
      }`}
    >
      {isSelectMode && (
        <div
          className={`shrink-0 ${promotion.isExpired ? "mt-6" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
        >
          <SelectCheckbox checked={isSelected} />
        </div>
      )}
      {promotion.isExpired && (
        <div className="absolute top-0 left-0 right-0 bg-linear-to-r from-red-500 to-red-600 px-3 py-1 rounded-t-xl">
          <p className="font-bold text-xs text-white text-center flex items-center justify-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            Expired
          </p>
        </div>
      )}

      <div
        className={`w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 ${
          promotion.isExpired ? "mt-6" : ""
        }`}
      >
        {promotion.banner?.image.url ? (
          <Image
            src={promotion.banner.image.url}
            alt={promotion.name}
            className="w-full h-full object-cover"
            width={400}
            height={400}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <FontAwesomeIcon icon={faImage} className="text-3xl" />
          </div>
        )}
      </div>

      <div className={`flex-1 min-w-0 ${promotion.isExpired ? "mt-6" : ""}`}>
        <h3 className="text-lg font-bold text-gray-800 truncate">
          {promotion.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          {promotion.isExpired ? (
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
              <FontAwesomeIcon icon={faClock} className="mr-1" />
              Expired
            </span>
          ) : (
            <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold">
              <FontAwesomeIcon icon={faCheck} className="mr-1" />
              Active
            </span>
          )}
        </div>
      </div>

      {hover && !openmodal.managebanner && !isSelectMode && (
        <div
          className={`shrink-0 z-10 ${promotion.isExpired ? "mt-6" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <SubInventoryMenu
            data={actionMenu}
            type="promotion"
            index={promotion.id}
            reloaddata={reloaddata}
          />
        </div>
      )}
    </motion.div>
  );
};
