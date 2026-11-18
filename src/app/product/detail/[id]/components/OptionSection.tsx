"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Productdetailinitialize,
  useGlobalStore,
} from "@/src/context/GlobalContext";
import { ProductState } from "@/src/types/product.type";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCheck,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import {
  addToWishlistService,
  addToCartService,
} from "../services/productService";
import { ShowVariantSections, ShowOptionandStock } from "./VariantSections";
import { ErrorMessageType } from "./StockSelector";
import { isVariantActive } from "@/src/lib/variantCondition";

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
  const productorderdetail = useGlobalStore((s) => s.productorderdetail);
  const setproductorderdetail = useGlobalStore((s) => s.setproductorderdetail);
  const setcarttotal = useGlobalStore((s) => s.setcarttotal);
  const setcart = useGlobalStore((s) => s.setcart);
  const [loading, setloading] = useState(false);
  const [errormess, seterrormess] = useState<ErrorMessageType>({
    option: "",
    qty: "",
  });
  const [qty, setqty] = useState(0);
  const [incart, setincart] = useState(isInCart);
  const [inWishlist, setInWishlist] = useState(isInWishlist);

  // Start each product with a clean selection; simple-stock products
  // default to a quantity of 1 so Add to Cart works straight away
  useEffect(() => {
    setproductorderdetail((prev) =>
      prev.id === data.id
        ? prev
        : {
            ...Productdetailinitialize,
            id: data.id as number,
            quantity:
              data.stocktype === "stock" && (data.stock ?? 0) > 0 ? 1 : 0,
          },
    );
  }, [data.id, data.stocktype, data.stock, setproductorderdetail]);

  // A different product clears any leftover error text
  const [syncedProduct, setSyncedProduct] = useState({
    id: data.id,
    stocktype: data.stocktype,
    Variant: data.Variant,
  });
  if (
    syncedProduct.id !== data.id ||
    syncedProduct.stocktype !== data.stocktype ||
    syncedProduct.Variant !== data.Variant
  ) {
    setSyncedProduct({
      id: data.id,
      stocktype: data.stocktype,
      Variant: data.Variant,
    });
    seterrormess({
      option: "",
      qty: "",
    });
  }

  const handleWishlist = useCallback(async () => {
    setloading(true);
    try {
      const result = await addToWishlistService(data.id ?? 0);
      if (result.success) setInWishlist(true);
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
  }, [data.Variant, setproductorderdetail]);

  const hasSelections = useMemo(() => {
    const hasQty =
      productorderdetail?.quantity && productorderdetail.quantity > 0;
    const hasDetails = productorderdetail?.details?.some(
      (detail) => detail && detail.value && detail.value.length > 0,
    );
    return hasQty || hasDetails;
  }, [productorderdetail]);

  // Real problems (e.g. out of stock, missing required option) are shown
  // as errors; "what to do next" guidance is shown as a neutral hint
  const isError = !!(errormess?.qty || errormess?.option);
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

      // Name the required options (including unlocked add-ons) still missing
      const variants = data.Variant ?? [];
      const missing = variants.filter(
        (v) =>
          v.id &&
          !v.optional &&
          isVariantActive(v, variants, validDetails) &&
          !validDetails.some((d) => d.variant_id === v.id && d.value),
      );

      if (!hasSelectedOptions) {
        return missing.length > 0
          ? `Choose ${missing.map((v) => v.option_title).join(", ")}`
          : "Choose an option";
      } else if (missing.length > 0) {
        return `Choose ${missing.map((v) => v.option_title).join(", ")}`;
      } else if (!hasQty) {
        return loading ? "Checking availability…" : "Choose a quantity";
      }
    }

    return "";
  }, [errormess.qty, errormess.option, data, productorderdetail, loading]);

  const cartDisabled =
    !incart && (productorderdetail?.quantity === 0 || isAdmin || loading);

  return (
    <div className="w-full flex flex-col gap-y-6">
      {hasSelections && (
        <div className="flex justify-end -mb-4">
          <button
            type="button"
            onClick={handleClearAllSelections}
            disabled={loading}
            className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline disabled:opacity-50"
          >
            Clear selections
          </button>
        </div>
      )}

      <div className="w-full flex flex-col gap-y-6">
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

      <div className="product_action flex flex-col gap-y-3">
        <p
          role={isError ? "alert" : "status"}
          className={`min-h-5 text-sm ${
            isError ? "font-semibold text-red-600" : "text-gray-500"
          }`}
        >
          {isAdmin && !isError
            ? "Admin accounts can't add items to the cart."
            : currentErrorMessage}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={incart ? () => setcart(true) : handleCart}
            disabled={cartDisabled}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-4 focus-visible:ring-gray-300 disabled:cursor-not-allowed ${
              incart
                ? "border border-gray-900 bg-white text-gray-900 hover:bg-gray-50"
                : "bg-gray-900 text-white hover:bg-black disabled:bg-gray-200 disabled:text-gray-500"
            }`}
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : incart ? (
              <>
                <FontAwesomeIcon icon={faCheck} />
                In cart · View cart
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCartShopping} />
                Add to cart
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => !inWishlist && handleWishlist()}
            disabled={loading}
            aria-pressed={inWishlist}
            aria-label={inWishlist ? "In wishlist" : "Add to wishlist"}
            title={inWishlist ? "In wishlist" : "Add to wishlist"}
            className={`grid h-12 w-12 shrink-0 place-content-center rounded-xl border transition-colors outline-none focus-visible:ring-4 focus-visible:ring-gray-300 disabled:opacity-50 ${
              inWishlist
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-gray-300 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
        </div>
      </div>
    </div>
  );
};
