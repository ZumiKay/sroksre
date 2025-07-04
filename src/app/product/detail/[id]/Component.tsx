"use client";

import PrimaryButton, {
  SelectContainer,
  Selection,
} from "@/src/app/component/Button";
import { Productordertype } from "@/src/context/OrderContext";
import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
import { Addtocart, AddWishlist } from "./action";
import { errorToast, successToast } from "@/src/app/component/Loading";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Skeleton } from "@heroui/react";
import {
  ProductState,
  SelectTypeVariant,
  VariantColorValueType,
  VariantOptionEnum,
} from "@/src/context/GlobalType.type";
import {
  Productdetailinitialize,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ProductStockType } from "@/src/app/component/ServerComponents";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faHeart } from "@fortawesome/free-solid-svg-icons";
import { IsInCartAndGetStock } from "./detail_action";

interface errormessType {
  qty?: string;
  option?: string;
}

const EMPTY_ERROR_STATE = { option: "", qty: "" };

export const ShowPrice = memo(
  ({ price, discount }: Pick<ProductState, "price" | "discount">) => {
    const priceString = useMemo(() => price.toFixed(2), [price]);

    if (!discount) {
      return <h3 className="text-lg font-bold w-full">{`$${priceString}`}</h3>;
    }

    return (
      <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
        <h3 className="oldprice line-through w-fit font-normal">
          {`$ ${priceString}`}
        </h3>
        <h3 className="w-fit text-red-400">{`-${discount.percent}%`}</h3>
        <h3 className="w-fit">{`$ ${parseFloat(discount.newprice).toFixed(
          2
        )}`}</h3>
      </div>
    );
  }
);

ShowPrice.displayName = "ShowPrice";

const Stock = memo(
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
    const { setproductorderdetail, productorderdetail } = useGlobalContext();

    const showLowStock = useMemo(() => max > 0 && max <= 5, [max]);

    const quantityOptions = useMemo(
      () =>
        Array.from({ length: max }, (_, idx) => ({
          label: idx + 1,
          value: idx + 1,
        })),
      [max]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>, isStock?: boolean) => {
        setmess(EMPTY_ERROR_STATE);
        const { value, name } = e.target;
        const val = value !== "QTY" ? parseInt(value) : 0;

        setproductorderdetail(
          (prev) =>
            ({
              ...prev,
              ...(isStock ? { details: [] } : {}),
              [name]: val,
            } as Productordertype)
        );
      },
      [setmess, setproductorderdetail]
    );

    const errorMessage = useMemo(() => {
      if (max === 0) return errormess.qty ?? "Product Unavaliable";
      return showLowStock ? "Low on stock" : "";
    }, [max, errormess.qty, showLowStock]);

    if (isloading) {
      return (
        <div className="flex flex-col gap-y-3">
          <label htmlFor="qty" className="text-lg font-bold">
            Quantity
          </label>
          <Skeleton className="w-[90%] h-[40px] rounded-lg" />
          <h3 className="text-lg text-red-500 w-full text-left font-bold">
            {`  ${errorMessage}`}
          </h3>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-3">
        <label htmlFor="qty" className="text-lg font-bold">
          Quantity
        </label>
        <Selection
          default="QTY"
          data={quantityOptions}
          style={{ height: "50px", width: "200px", maxWidth: "250px" }}
          onChange={(e) => handleChange(e, isStock)}
          disable={max === 0 || incart}
          value={productorderdetail?.quantity}
          name="quantity"
        />
        <h3 className="text-lg text-red-500 w-full text-left font-bold">
          {`  ${errorMessage}`}
        </h3>
      </div>
    );
  }
);

Stock.displayName = "Stock";

const Variant = memo(
  ({
    variant_id,
    variant_name,
    variant_type,
    variant_val,
    prob,
    setmess,
    setqty,
    setloading,
    setincart,
  }: {
    variant_id: number;
    variant_name: string;
    variant_type: VariantOptionEnum;
    variant_val: Array<VariantColorValueType | string>;
    prob: Pick<ProductState, "id" | "varaintstock" | "variants">;
    setmess: React.Dispatch<React.SetStateAction<errormessType>>;
    setqty: React.Dispatch<React.SetStateAction<number>>;
    setloading: React.Dispatch<React.SetStateAction<boolean>>;
    setincart: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    const { productorderdetail, setproductorderdetail } = useGlobalContext();

    const SelectTypeVariant = useMemo(
      () => ({
        label: variant_val,
        type: variant_type,
        value: variant_id,
      }),
      [variant_id, variant_type, variant_val]
    ) as unknown as SelectTypeVariant;

    const handleSelectVariant = useCallback(
      async (variantId: number, variantIdx: number) => {
        if (!prob.varaintstock) {
          setmess({ option: "No Stock Available", qty: "" });
          return;
        }

        const selectedVar = [
          ...(productorderdetail.details?.filter(Boolean) ?? []),
        ];
        const isSelected = selectedVar.findIndex(
          (i) => i.variantId === variantId
        );

        if (isSelected !== -1) {
          const isTheSameIdx = selectedVar.findIndex(
            (i) => i.variantIdx === variantIdx
          );
          if (isTheSameIdx !== -1) {
            selectedVar.splice(isSelected, 1);
            setqty(0);
          } else {
            selectedVar[isSelected] = { variantId, variantIdx };
          }
        } else {
          selectedVar.push({ variantId, variantIdx });
        }

        let stockId = 0;
        if (selectedVar.length > 0 && prob.id) {
          setloading(true);
          try {
            const checkreq = await IsInCartAndGetStock({
              selected_var: selectedVar,
              pid: prob.id,
            });

            if (!checkreq.success) {
              errorToast(checkreq.error ?? "Error Occurred");
              return;
            }

            setincart(checkreq.data?.incart ?? false);
            setqty(checkreq.data?.qty ?? 0);
            stockId = checkreq.data?.stockId ?? 0;

            if (!checkreq.data?.qty || checkreq.data.qty === 0) {
              setmess({ qty: "Product Unavailable", option: "" });
            }
          } finally {
            setloading(false);
          }
        }

        setproductorderdetail((prev) => ({
          ...prev,
          details: selectedVar,
          stock_selected_id: stockId,
        }));
      },
      [
        prob,
        productorderdetail.details,
        setincart,
        setloading,
        setmess,
        setproductorderdetail,
        setqty,
      ]
    );

    return (
      <div className="w-full h-fit flex flex-col gap-y-5">
        <label htmlFor={variant_name} className="text-lg font-bold w-fit h-fit">
          {variant_name}
        </label>
        <SelectContainer
          type={variant_type}
          data={SelectTypeVariant}
          onSelect={handleSelectVariant}
          isSelected={productorderdetail.details?.filter(Boolean)}
        />
      </div>
    );
  }
);

Variant.displayName = "Variant";

const ShowOptionandStock = memo(
  ({
    prob,
    qty,
    errormess,
    isincart,
    setmess,
    setqty,
    setloading,
    setincart,
    isloading,
  }: {
    prob: Pick<
      ProductState,
      "id" | "stocktype" | "stock" | "variants" | "varaintstock"
    >;
    qty: number;
    errormess: errormessType;
    isincart: boolean;
    setmess: React.Dispatch<React.SetStateAction<errormessType>>;
    setqty: React.Dispatch<React.SetStateAction<number>>;
    setloading: React.Dispatch<React.SetStateAction<boolean>>;
    setincart: React.Dispatch<React.SetStateAction<boolean>>;
    isloading?: boolean;
  }) => {
    const ProductUnavailable = useMemo(
      () => (
        <h3 className="text-lg text-gray-400 font-medium">
          Product Unavailable
        </h3>
      ),
      []
    );

    const renderedVariants = useMemo(() => {
      if (!prob.variants) return null;

      return prob.variants.map((variant, idx) => {
        const varaintstock = prob.varaintstock?.filter((stock) =>
          stock.Stockvalue.some((stockValue) =>
            stockValue.variant_val.some((stockval) =>
              variant.option_value.some((variantVal) =>
                typeof variantVal === "string"
                  ? variantVal === stockval
                  : variantVal.val === stockval
              )
            )
          )
        );

        const variantData = {
          id: prob.id,
          variants: variant,
          varaintstock,
        };

        return (
          <Variant
            key={variant.id ?? idx}
            prob={variantData as never}
            setmess={setmess}
            setqty={setqty}
            setincart={setincart}
            setloading={setloading}
            variant_id={variant.id ?? 0}
            variant_name={variant.option_title}
            variant_type={variant.option_type as never}
            variant_val={variant.option_value}
          />
        );
      });
    }, [
      prob.variants,
      prob.varaintstock,
      prob.id,
      setmess,
      setqty,
      setincart,
      setloading,
    ]);

    if (prob.stocktype === "stock") {
      return prob.stock && prob.stock > 0 ? (
        <Stock
          max={prob.stock}
          errormess={errormess}
          setmess={setmess}
          isStock
        />
      ) : (
        ProductUnavailable
      );
    }

    if (!prob.variants) return null;

    return (
      <>
        {renderedVariants}
        {!isincart && prob.varaintstock && prob.varaintstock.length > 0 ? (
          <Stock
            max={qty}
            errormess={errormess}
            setmess={setmess}
            isloading={isloading}
          />
        ) : qty === 0 ? (
          ProductUnavailable
        ) : null}
      </>
    );
  }
);

ShowOptionandStock.displayName = "ShowOptionandStock";

export const OptionSection = memo(
  ({
    data,
    isAdmin,
    isInWishlist,
  }: {
    data: Pick<
      ProductState,
      "id" | "stocktype" | "stock" | "variants" | "varaintstock"
    >;
    isAdmin: boolean;
    isInWishlist: boolean;
  }) => {
    const { productorderdetail, setproductorderdetail } = useGlobalContext();
    const [loading, setloading] = useState(false);
    const [errormess, seterrormess] =
      useState<errormessType>(EMPTY_ERROR_STATE);
    const [qty, setqty] = useState(0);
    const [incart, setincart] = useState(false);

    const InitializeProductOrder = useCallback(
      (
        data: Pick<
          ProductState,
          "id" | "stocktype" | "stock" | "variants" | "varaintstock"
        >
      ) => {
        const type = data.stocktype;

        if (type !== ProductStockType.stock) {
          const length = type === "size" ? 1 : data.variants?.length ?? 0;
          const arr = new Array(length).fill(null);

          setproductorderdetail(
            (prev) =>
              ({
                ...prev,
                id: data.id as number,
                details: arr,
              } as Productordertype)
          );
        } else {
          setproductorderdetail(
            (prev) =>
              ({
                ...prev,
                id: data.id as number,
              } as Productordertype)
          );
        }
      },
      [setproductorderdetail]
    );

    useEffect(() => {
      InitializeProductOrder(data);
    }, [InitializeProductOrder, data]);

    const calculatedErrorMess = useMemo(() => {
      if (data.stocktype === ProductStockType.stock) {
        return { qty: "Please Select Quantity" };
      }

      const hasValidDetails =
        productorderdetail.details &&
        productorderdetail.details?.filter(Boolean)?.length > 0;
      return hasValidDetails ? {} : { option: "Please Select Option" };
    }, [data.stocktype, productorderdetail.details]);

    useEffect(() => {
      seterrormess(calculatedErrorMess);
    }, [calculatedErrorMess]);

    const handleWishlist = useCallback(async () => {
      try {
        const added = await AddWishlist(data.id ?? 0);
        if (!added.success) {
          errorToast(added.message);
          return;
        }
        successToast(added.message);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        errorToast("Error adding to wishlist");
      }
    }, [data.id]);

    const checkallrequireddetail = useCallback(() => {
      const { stocktype } = data;
      const { details, quantity } = productorderdetail ?? {};
      const hasQuantity = quantity !== 0;

      if (stocktype === "stock") {
        if (!hasQuantity) {
          seterrormess({ qty: "Please Select the quantity", option: "" });
          return false;
        }
      } else {
        const hasValidDetails = details?.filter(Boolean);
        if (!hasValidDetails || !hasQuantity || hasValidDetails.length === 0) {
          seterrormess(
            !hasValidDetails
              ? { option: "Please Select one of the option", qty: "" }
              : { qty: "Please Select the quantity", option: "" }
          );
          return false;
        }
      }
      return true;
    }, [data, productorderdetail]);

    const handleCart = useCallback(async () => {
      if (!checkallrequireddetail() || !productorderdetail) return;

      try {
        const makerequest = await Addtocart(productorderdetail);

        if (!makerequest.success) {
          errorToast(makerequest.message ?? "Error Occurred");
          return;
        }

        successToast("Added to cart");
        setproductorderdetail((prev) => ({
          ...Productdetailinitialize,
          id: prev.id,
        }));
        setincart(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        errorToast("Error adding to cart");
      }
    }, [checkallrequireddetail, productorderdetail, setproductorderdetail]);

    const cartButtonDisabled = useMemo(
      () => productorderdetail.quantity === 0 || incart || isAdmin,
      [productorderdetail.quantity, incart, isAdmin]
    );

    const displayedErrorMessage = useMemo(
      () =>
        data.stocktype === ProductStockType.stock
          ? errormess?.qty
          : errormess?.option,
      [data.stocktype, errormess?.qty, errormess?.option]
    );

    return (
      <div className="w-full h-fit flex flex-col gap-y-5">
        <h3 className="error_mess text-lg text-red-500 font-bold w-full h-full">
          {displayedErrorMessage}
        </h3>

        <div className="w-full h-fit overflow-x-hidden overflow-y-auto flex flex-col gap-y-5 pl-2">
          <ShowOptionandStock
            prob={data}
            qty={qty}
            isincart={incart}
            setqty={setqty}
            errormess={errormess}
            setmess={seterrormess}
            setloading={setloading}
            setincart={setincart}
            isloading={loading}
          />
        </div>

        <div className="product_action w-full pt-2 flex flex-col items-center gap-y-2">
          <Button
            type="button"
            endContent={
              <FontAwesomeIcon className="text-md" icon={faCartShopping} />
            }
            className="w-[99%] h-[40px] font-bold text-md"
            variant="bordered"
            isLoading={loading}
            isDisabled={cartButtonDisabled}
            onPress={handleCart}
          >
            {incart ? "In Cart" : "Add To Cart"}
          </Button>

          <Button
            type="button"
            endContent={<FontAwesomeIcon className="text-md" icon={faHeart} />}
            className="w-[99%] h-[40px] font-bold text-md"
            variant="bordered"
            isLoading={loading}
            onPress={handleWishlist}
          >
            {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
          </Button>
        </div>
      </div>
    );
  }
);

OptionSection.displayName = "OptionSection";

export const ButtonForSimilarProd = memo(({ lt }: { lt: number }) => {
  const router = useRouter();
  const searchParam = useSearchParams();

  const handleLoadMore = useCallback(() => {
    const param = new URLSearchParams(searchParam);
    param.set("lt", `${lt + 3}`);
    router.push(`?${param}`, { scroll: false });
    router.refresh();
  }, [router, searchParam, lt]);

  return (
    <div className="w-full h-fit flex justify-center">
      <PrimaryButton
        type="button"
        text="Load more"
        radius="10px"
        width="20%"
        height="40px"
        style={{ marginTop: "100px" }}
        onClick={handleLoadMore}
      />
    </div>
  );
});

ButtonForSimilarProd.displayName = "ButtonForSimilarProd";
