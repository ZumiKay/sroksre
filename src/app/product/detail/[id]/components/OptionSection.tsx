"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import PrimaryButton from "@/src/app/component/Button";
import {
  Productdetailinitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ProductState } from "@/src/types/product.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import {
  addToWishlistService,
  addToCartService,
} from "../services/productService";
import { ShowVariantSections, ShowOptionandStock } from "./VariantSections";
import { ErrorMessageType } from "./StockSelector";

interface OptionSectionProps {
  data: Pick<
    ProductState,
    "id" | "stocktype" | "stock" | "Variant" | "Stock" | "Variantsection"
  >;
  isAdmin: boolean;
  isInWishlist: boolean;
  isInCart: boolean;
}

export const OptionSection = ({
  data,
  isAdmin,
  isInWishlist,
  isInCart,
}: OptionSectionProps) => {
  const { productorderdetail, setproductorderdetail, setcarttotal } =
    useGlobalContext();
  const [loading, setloading] = useState(false);
  const [errormess, seterrormess] = useState<ErrorMessageType>({
    option: "",
    qty: "",
  });
  const [qty, setqty] = useState(0);
  const [incart, setincart] = useState(isInCart);

  // Initialize product detail options
  useEffect(() => {
    setproductorderdetail((prev) => ({
      ...prev,
      id: data.id as number,
    }));
    seterrormess({
      option: "",
      qty: "",
    });
  }, [data.id, data.stocktype, data.Variant]);

  const handleWishlist = useCallback(async () => {
    setloading(true);
    try {
      await addToWishlistService(data.id ?? 0);
    } finally {
      setloading(false);
    }
  }, [data.id]);

  const checkallrequireddetail = useCallback(() => {
    const { stocktype } = data;
    const { details, quantity } = productorderdetail ?? {};

    const ishaveQty = quantity !== 0;
    if (stocktype === "stock") {
      if (!ishaveQty) {
        seterrormess({ qty: "Please select the quantity", option: "" });
        return false;
      }
    } else {
      const validDetails = details?.filter((i) => i) ?? [];
      const isSelectedDetails =
        validDetails.length > 0 &&
        validDetails.some((i) => i.value.length !== 0);

      const isValid = isSelectedDetails && ishaveQty;

      if (!isValid) {
        seterrormess(
          !isSelectedDetails
            ? { option: "Please select one of the options", qty: "" }
            : { qty: "Please select the quantity", option: "" },
        );
        return false;
      }
    }
    return true;
  }, [data, productorderdetail]);

  const handleCart = useCallback(async () => {
    const checked = checkallrequireddetail();

    if (!checked || !productorderdetail) {
      return;
    }

    setloading(true);
    try {
      const result = await addToCartService(productorderdetail);

      if (result.success) {
        setproductorderdetail((prev) => ({
          ...Productdetailinitialize,
          id: prev.id,
        }));
        setincart(true);
        setcarttotal((prev) => prev + 1);
      }
    } finally {
      setloading(false);
    }
  }, [
    checkallrequireddetail,
    productorderdetail,
    setproductorderdetail,
    setcarttotal,
  ]);

  const handleClearAllSelections = useCallback(() => {
    // Initialize empty details based on variants
    const emptyDetails =
      data.Variant?.map(() => ({
        variant_id: 0,
        value: "",
      })) || [];

    setproductorderdetail((prev) => ({
      id: prev.id,
      details: emptyDetails,
      quantity: 0,
      price: { price: 0 },
    }));
    setqty(0);
    setincart(false);
    seterrormess({
      option: "",
      qty: "",
    });
  }, [data.stocktype, data.Variant, setproductorderdetail]);

  const hasSelections = useMemo(() => {
    const hasQty =
      productorderdetail?.quantity && productorderdetail.quantity > 0;
    const hasDetails = productorderdetail?.details?.some(
      (detail) => detail && detail.value && detail.value.length > 0,
    );
    return hasQty || hasDetails;
  }, [productorderdetail]);

  const currentErrorMessage = useMemo(() => {
    if (errormess?.qty || errormess?.option) {
      return errormess.qty || errormess.option || "";
    }

    const { stocktype } = data;
    const { details, quantity } = productorderdetail ?? {};
    const hasQty = quantity && quantity > 0;

    if (stocktype === "stock") {
      return !hasQty ? "Please select quantity" : "";
    } else {
      // For variant/size products
      const validDetails = details?.filter((i) => i) ?? [];
      const hasSelectedOptions = validDetails.some((i) => i.value.length !== 0);

      if (!hasSelectedOptions) {
        return "Please select an option";
      } else if (!hasQty) {
        return "Please select quantity";
      }
    }

    return "";
  }, [data.stocktype, productorderdetail, errormess]);

  return (
    <div className="w-full h-fit flex flex-col gap-y-5">
      {loading && (
        <div className="w-full h-1 bg-blue-500 animate-pulse rounded-full"></div>
      )}
      <div className="w-full flex flex-row items-center justify-between gap-x-3">
        <h3 className="error_mess text-lg text-red-500 font-bold flex-1 transition-opacity duration-200">
          {currentErrorMessage}
        </h3>
        {hasSelections && (
          <button
            onClick={handleClearAllSelections}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-300 hover:border-red-400"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="w-full h-fit overflow-x-hidden overflow-y-auto flex flex-col gap-y-5 pl-2 pb-5">
        {data.Variantsection && data.Variantsection.length > 0 ? (
          <ShowVariantSections
            prob={data}
            qty={qty}
            setqty={setqty}
            errormess={errormess}
            setmess={seterrormess}
            setloading={setloading}
            setincart={setincart}
            isloading={loading}
          />
        ) : (
          <ShowOptionandStock
            prob={data}
            qty={qty}
            setqty={setqty}
            errormess={errormess}
            setmess={seterrormess}
            setloading={setloading}
            setincart={setincart}
            isloading={loading}
          />
        )}
      </div>

      <div className="product_action w-full pt-2 flex flex-col items-center gap-y-2">
        <PrimaryButton
          type="submit"
          text={incart ? "In Cart" : "Add To Cart"}
          disable={
            productorderdetail?.quantity === 0 || incart || isAdmin || loading
          }
          onClick={handleCart}
          status={loading ? "loading" : "authenticated"}
          color="white"
          textcolor="black"
          border="1px solid black"
          radius="10px"
          width="99%"
        />
        <PrimaryButton
          type="button"
          text={isInWishlist ? "In Wishlist" : "Add To Wishlist"}
          color="black"
          radius="10px"
          width="100%"
          disable={loading}
          Icon={<FontAwesomeIcon icon={faHeart} />}
          onClick={() => !isInWishlist && handleWishlist()}
        />
      </div>
    </div>
  );
};
