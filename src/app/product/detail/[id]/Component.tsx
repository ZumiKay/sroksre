"use client";

import PrimaryButton, {
  SelectContainer,
  Selection,
} from "@/src/app/component/Button";
import {
  Productdetailinitialize,
  ProductStockType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import {
  Productorderdetailtype,
  Productordertype,
} from "@/src/types/order.type";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import { Addtocart, AddWishlist } from "./action";
import { errorToast, successToast } from "@/src/app/component/Loading";
import { ApiRequest } from "@/src/context/CustomHook";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@heroui/react";
import { ProductState, VariantValueObjType } from "@/src/types/product.type";

export const ShowPrice = React.memo(
  ({ price, discount }: Pick<ProductState, "price" | "discount">) => {
    const priceString = useMemo(() => price.toFixed(2), [price]);
    const isDiscount = typeof discount !== "number" && discount?.discount;
    const discountPrice = useMemo(
      () =>
        isDiscount && isDiscount.newprice
          ? isDiscount.newprice.toFixed(2)
          : null,
      [discount],
    );

    if (isDiscount) {
      return (
        <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
          <h3 className="oldprice line-through w-fit font-normal">
            {`$ ${priceString}`}
          </h3>
          <h3 className="w-fit text-red-400">{`-${isDiscount.percent}%`}</h3>
          <h3 className="w-fit">{`$ ${discountPrice}`}</h3>
        </div>
      );
    }

    return <h3 className="text-lg font-bold w-full">{`$${priceString}`}</h3>;
  },
);

ShowPrice.displayName = "ShowPrice";

interface errormessType {
  qty?: string;
  option?: string;
}

export const OptionSection = ({
  data,
  isAdmin,
  isInWishlist,
  isInCart,
}: {
  data: Pick<
    ProductState,
    "id" | "stocktype" | "stock" | "Variant" | "Stock" | "Variantsection"
  >;
  isAdmin: boolean;
  isInWishlist: boolean;
  isInCart: boolean;
}) => {
  const { productorderdetail, setproductorderdetail, setcarttotal } =
    useGlobalContext();
  const [loading, setloading] = useState(false);
  const [errormess, seterrormess] = useState<errormessType>({
    option: "",
    qty: "",
  });
  const [qty, setqty] = useState(0);
  const [incart, setincart] = useState(isInCart);

  //Initialize product detail options
  useEffect(() => {
    setproductorderdetail(
      (prev) => ({ ...prev, id: data.id as number }) as Productordertype,
    );
    seterrormess({
      option: "",
      qty: "",
    });
  }, [data.id, data.stocktype, data.Variant]);

  const handleWishlist = useCallback(async () => {
    setloading(true);
    try {
      const makereq = AddWishlist.bind(null, data.id ?? 0);
      const added = await makereq();

      if (!added.success) {
        errorToast(added.message);
        return;
      }

      successToast(added.message);
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
      const addtocart = Addtocart.bind(null, productorderdetail);
      const makerequest = await addtocart();

      if (!makerequest.success) {
        errorToast(makerequest.message ?? "Error Occured");
        return;
      }

      successToast("Added to cart");
      setproductorderdetail((prev) => ({
        ...Productdetailinitialize,
        id: prev.id,
      }));
      setincart(true);
      setcarttotal((prev) => prev + 1);
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

  // Compute the appropriate error message based on current state
  const currentErrorMessage = useMemo(() => {
    // Prioritize explicit error messages from errormess state
    if (errormess?.qty || errormess?.option) {
      return errormess.qty || errormess.option || "";
    }

    // Fall back to computed validation messages
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
      <div className="w-full h-fit overflow-x-hidden overflow-y-auto flex flex-col gap-y-5 pl-2">
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
          Icon={<i className="fa-regular fa-heart text-lg"></i>}
          onClick={() => !isInWishlist && handleWishlist()}
        />
      </div>
    </div>
  );
};

const StockSelector = React.memo(
  ({
    max,
    errormess,
    setmess,
    incart,
    isStock,
    isloading,
  }: {
    max: number;
    errormess: errormessType;
    setmess: React.Dispatch<React.SetStateAction<errormessType>>;
    incart?: boolean;
    isStock?: boolean;
    isloading?: boolean;
  }) => {
    const showLowStock = useMemo(() => max > 0 && max <= 5, [max]);
    const { setproductorderdetail, productorderdetail } = useGlobalContext();

    const quantityOptions = useMemo(
      () =>
        Array.from({ length: max }, (_, idx) => ({
          label: idx + 1,
          value: idx + 1,
        })),
      [max],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setmess({ qty: "", option: "" });
        const { value, name } = e.target;
        const val =
          name === "quantity" && value !== "QTY" ? parseInt(value) : 0;

        setproductorderdetail(
          (prev) =>
            ({
              ...prev,
              ...(isStock ? { details: [] } : {}),
              quantity: val,
            }) as Productordertype,
        );
      },
      [setmess, setproductorderdetail, isStock],
    );

    const warningMessage = useMemo(
      () => (showLowStock && max > 0 ? "Low on stock" : ""),
      [max, showLowStock],
    );

    return (
      <div className="flex flex-col gap-y-3">
        <label htmlFor="qty" className="text-lg font-bold">
          Quantity
        </label>
        {isloading ? (
          <Skeleton className="w-[90%] h-[40px] rounded-lg" />
        ) : (
          <Selection
            default="QTY"
            data={quantityOptions}
            style={{ height: "50px", width: "200px", maxWidth: "250px" }}
            onChange={handleChange}
            disable={max === 0 || incart}
            value={productorderdetail?.quantity}
            name="quantity"
          />
        )}
        {warningMessage && (
          <h3 className="text-sm text-orange-500 w-full text-left font-medium">
            {warningMessage}
          </h3>
        )}
      </div>
    );
  },
);

StockSelector.displayName = "StockSelector";

/**
 * Fetches available quantity from backend API based on selected variants.
 * Uses debouncing to prevent excessive API calls.
 */
let stockCheckTimeout: NodeJS.Timeout | null = null;

const fetchAvailableQuantity = async (
  productId: number,
  selectedVariants: Productorderdetailtype[],
): Promise<number> => {
  // Clear previous timeout
  if (stockCheckTimeout) {
    clearTimeout(stockCheckTimeout);
  }

  return new Promise((resolve) => {
    stockCheckTimeout = setTimeout(async () => {
      try {
        const response = await ApiRequest(
          "/api/products/stock/available",
          undefined,
          "POST",
          "JSON",
          {
            productId,
            selectedVariants: selectedVariants.filter(
              (i) => i && i.value && i.value.length > 0,
            ),
          },
        );

        if (response.success) {
          resolve(response.data.availableQuantity || 0);
        } else {
          console.log("Error fetching stock:", response.error);
          resolve(0);
        }
      } catch (error) {
        console.log("Error fetching available quantity:", error);
        resolve(0);
      }
    }, 300); // 300ms debounce
  });
};

let cartCheckTimeout: NodeJS.Timeout | null = null;

const inCartCheck = async (
  selecteddetail: Productorderdetailtype[],
  pid: number,
): Promise<{ success: boolean; incart: boolean }> => {
  // Clear previous timeout
  if (cartCheckTimeout) {
    clearTimeout(cartCheckTimeout);
  }

  return new Promise((resolve) => {
    cartCheckTimeout = setTimeout(async () => {
      try {
        const req = await ApiRequest(
          "/api/order/cart/check",
          undefined,
          "POST",
          "JSON",
          { selecteddetail, pid },
        );
        resolve({
          success: req.success,
          incart: (req.data?.incart ?? false) as boolean,
        });
      } catch (error) {
        console.log("Cart check failed:", error);
        resolve({ success: false, incart: false });
      }
    }, 300); // 300ms debounce
  });
};

const VariantSelector = React.memo(
  ({
    id,
    name,
    type,
    idx,
    data,
    prob,
    errormess,
    setmess,
    setqty,
    setloading,
    setincart,
  }: {
    id: number;
    name: string;
    type: "COLOR" | "TEXT";
    idx: number;
    data: (string | VariantValueObjType)[];
    prob: Pick<ProductState, "id" | "Stock" | "Variant">;
    errormess: errormessType;
    setmess: React.Dispatch<React.SetStateAction<errormessType>>;
    setqty: React.Dispatch<React.SetStateAction<number>>;
    setloading: React.Dispatch<React.SetStateAction<boolean>>;
    setincart: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const { productorderdetail, setproductorderdetail } = useGlobalContext();

    const selected = useMemo(() => {
      const detail = productorderdetail?.details
        ?.filter((i) => i)
        .find((i) => i.variant_id === id);
      return detail?.value;
    }, [productorderdetail, id]);

    const handleSelectVariant = useCallback(
      async (idx: number, value: string) => {
        const variant = prob.Variant?.[idx];
        if (!variant || !productorderdetail?.details) return;

        const orderDetail = { ...productorderdetail } as Productordertype;
        const validDetails = orderDetail?.details?.filter((i) => i);

        // Find existing detail with matching variant_id
        const existingDetailIdx = validDetails?.findIndex(
          (i) => i.variant_id === id,
        );
        const currentDetail =
          existingDetailIdx !== -1
            ? validDetails?.[existingDetailIdx as number]
            : null;
        const isSelected = currentDetail?.value === value;

        // Update detail
        if (isSelected) {
          // Remove selection
          if (existingDetailIdx !== -1 && orderDetail.details) {
            const actualIdx = orderDetail.details.findIndex(
              (i) => i && i.variant_id === id,
            );
            if (actualIdx !== -1) {
              orderDetail.details[actualIdx] = { variant_id: 0, value: "" };
            }
          }
          setincart(false);
        } else {
          // Add or update selection
          if (orderDetail.details) {
            const actualIdx = orderDetail.details.findIndex(
              (i) => i && i.variant_id === id,
            );
            const targetIdx = actualIdx !== -1 ? actualIdx : idx;
            orderDetail.details[targetIdx] = {
              variant_id: id,
              value: value,
            };
          }
        }

        // Check if any selection exists
        const filteredDetails = orderDetail?.details?.filter(
          (i) => i?.value?.length > 0,
        );
        if (filteredDetails?.length === 0) {
          setmess({ qty: "", option: "" });
          setqty(0);
          setproductorderdetail(orderDetail);
          return;
        }

        if (!orderDetail.details) {
          setmess({ qty: "", option: "Please select option" });
          return;
        }

        const selectedOptionSet = new Set(
          orderDetail.details.map((i) => i.variant_id),
        );
        const isMissingRequired =
          prob.Variant?.filter(
            (i) => i.id && !i.optional && !selectedOptionSet.has(i.id),
          ) ?? [];
        if (isMissingRequired?.length > 0) {
          setmess({ qty: "", option: "Please select all required option" });
          setproductorderdetail(orderDetail);
          return;
        }

        // Fetch quantity and check cart
        setloading(true);
        try {
          const maxqty = prob.id
            ? await fetchAvailableQuantity(prob.id, orderDetail?.details ?? [])
            : 0;

          // Clear previous errors and set new ones only if needed
          const mess: errormessType = {
            qty: maxqty === 0 ? "Product Unavailable" : "",
            option: "",
          };

          if (maxqty && prob.id && filteredDetails) {
            const checkreq = await inCartCheck(filteredDetails, prob.id);
            setincart(checkreq.incart);
          }

          setmess(mess);
          setqty(maxqty);
          setproductorderdetail(orderDetail);
        } finally {
          setloading(false);
        }
      },
      [
        prob,
        productorderdetail,
        setincart,
        setloading,
        setmess,
        setqty,
        setproductorderdetail,
      ],
    );

    return (
      <div className="w-full h-fit flex flex-col gap-y-5">
        <label htmlFor={name} className="text-lg font-bold w-fit h-fit">
          {name}
        </label>
        <SelectContainer
          type={type}
          data={data}
          onSelect={(val) => handleSelectVariant(idx, val)}
          isSelected={selected}
        />
      </div>
    );
  },
);

VariantSelector.displayName = "VariantSelector";

const ShowVariantSections = ({
  prob,
  qty,
  errormess,
  setmess,
  setqty,
  setloading,
  setincart,
  isloading,
}: {
  prob: Pick<
    ProductState,
    "stocktype" | "stock" | "Variant" | "Stock" | "Variantsection"
  >;
  qty: number;
  errormess: errormessType;
  setmess: React.Dispatch<React.SetStateAction<errormessType>>;
  setqty: React.Dispatch<React.SetStateAction<number>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  setincart: React.Dispatch<React.SetStateAction<boolean>>;
  isloading?: boolean;
}) => {
  const Productunvaliable = (
    <h3 className="text-lg text-gray-400 font-medium"> Product Unavaliable </h3>
  );

  // Get variants that are not in any section
  const variantsNotInSection = useMemo(
    () => prob.Variant?.filter((variant) => !variant.sectionId) || [],
    [prob.Variant],
  );

  return (
    <>
      {/* Render Variant Sections */}
      {prob.Variantsection?.map((section) => (
        <div
          key={section.id}
          className="w-full h-fit flex flex-col gap-y-3 p-4 bg-linear-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
        >
          <h3 className="text-xl font-bold text-purple-800 mb-2">
            {section.name}
          </h3>
          <div className="flex flex-col gap-y-5">
            {section.Variants?.map((variant, idx) => {
              const globalIdx =
                prob.Variant?.findIndex((v) => v.id === variant.id) ?? idx;
              return (
                <VariantSelector
                  key={variant.id}
                  id={variant.id ?? 0}
                  name={variant.option_title}
                  type={variant.option_type}
                  idx={globalIdx}
                  data={variant.option_value}
                  prob={prob}
                  errormess={errormess}
                  setmess={setmess}
                  setqty={setqty}
                  setloading={setloading}
                  setincart={setincart}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Render standalone variants not in any section */}
      {variantsNotInSection.length > 0 && (
        <div className="w-full h-fit flex flex-col gap-y-5">
          {variantsNotInSection.map((variant, idx) => {
            const globalIdx =
              prob.Variant?.findIndex((v) => v.id === variant.id) ?? idx;
            return (
              <VariantSelector
                key={variant.id}
                id={variant.id ?? 0}
                name={variant.option_title}
                type={variant.option_type}
                idx={globalIdx}
                data={variant.option_value}
                prob={prob}
                errormess={errormess}
                setmess={setmess}
                setqty={setqty}
                setloading={setloading}
                setincart={setincart}
              />
            );
          })}
        </div>
      )}

      {/* Show stock/quantity selector */}
      {prob.Stock && prob.Stock.length !== 0 ? (
        <StockSelector
          max={qty}
          errormess={errormess}
          setmess={setmess}
          isloading={isloading}
        />
      ) : qty === 0 ? (
        Productunvaliable
      ) : null}
    </>
  );
};

const ShowOptionandStock = ({
  prob,
  qty,
  errormess,
  setmess,
  setqty,
  setloading,
  setincart,
  isloading,
}: {
  prob: Pick<ProductState, "stocktype" | "stock" | "Variant" | "Stock">;
  qty: number;
  errormess: errormessType;
  setmess: React.Dispatch<React.SetStateAction<errormessType>>;
  setqty: React.Dispatch<React.SetStateAction<number>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  setincart: React.Dispatch<React.SetStateAction<boolean>>;
  isloading?: boolean;
}) => {
  const type = prob.stocktype;
  const Productunvaliable = (
    <h3 className="text-lg text-gray-400 font-medium"> Product Unavaliable </h3>
  );

  return type === "stock" ? (
    prob.stock && prob.stock > 0 ? (
      <StockSelector
        max={prob.stock}
        errormess={errormess}
        setmess={setmess}
        isStock={true}
      />
    ) : (
      Productunvaliable
    )
  ) : prob.Variant ? (
    <>
      {prob.Variant.map((i, idx) => (
        <VariantSelector
          key={i.id}
          id={i.id ?? 0}
          name={i.option_title}
          type={i.option_type}
          idx={idx}
          data={i.option_value}
          prob={prob}
          errormess={errormess}
          setmess={setmess}
          setqty={setqty}
          setloading={setloading}
          setincart={setincart}
        />
      ))}
      {prob.Stock && prob.Stock.length !== 0 ? (
        <StockSelector
          max={qty}
          errormess={errormess}
          setmess={setmess}
          isloading={isloading}
        />
      ) : qty === 0 ? (
        Productunvaliable
      ) : null}
    </>
  ) : null;
};

export const ButtonForSimilarProd = React.memo(({ lt }: { lt: number }) => {
  const router = useRouter();
  const searchParam = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = useCallback(() => {
    startTransition(() => {
      const param = new URLSearchParams(searchParam);
      param.set("lt", `${lt + 3}`);
      router.push(`?${param}`, { scroll: false });
      router.refresh();
    });
  }, [lt, searchParam, router]);

  return (
    <div className="w-full h-fit flex justify-center">
      <PrimaryButton
        type="button"
        text={isPending ? "Loading..." : "Load more"}
        radius="10px"
        width="20%"
        height="40px"
        disable={isPending}
        style={{ marginTop: "100px" }}
        onClick={handleLoadMore}
        status={isPending ? "loading" : "authenticated"}
      />
    </div>
  );
});

ButtonForSimilarProd.displayName = "ButtonForSimilarProd";
