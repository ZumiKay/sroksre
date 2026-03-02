"use client";

import React, { useMemo } from "react";
import { ProductState } from "@/src/types/product.type";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { calculateAdditionalPrice } from "../utils/productHelpers";

interface ShowPriceProps {
  price: number;
  discount: ProductState["discount"];
}

export const ShowPrice = React.memo(({ price, discount }: ShowPriceProps) => {
  const priceString = useMemo(() => price.toFixed(2), [price]);
  const isDiscount = typeof discount !== "number" && discount?.discount;
  const discountPrice = useMemo(
    () =>
      isDiscount && isDiscount.newprice ? isDiscount.newprice.toFixed(2) : null,
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
});

ShowPrice.displayName = "ShowPrice";

interface ShowPriceWithOptionsProps {
  price: number;
  discount: ProductState["discount"];
  Variant: ProductState["Variant"];
}

export const ShowPriceWithOptions = React.memo(
  ({ price, discount, Variant }: ShowPriceWithOptionsProps) => {
    const { productorderdetail } = useGlobalContext();

    const additionalPrice = useMemo(() => {
      return calculateAdditionalPrice(productorderdetail?.details, Variant);
    }, [productorderdetail, Variant]);

    const basePrice = useMemo(() => price, [price]);
    const totalPrice = useMemo(
      () => basePrice + additionalPrice,
      [basePrice, additionalPrice],
    );

    const isDiscount = typeof discount !== "number" && discount?.discount;
    const discountPrice = useMemo(() => {
      if (isDiscount && isDiscount.newprice) {
        return isDiscount.newprice + additionalPrice;
      }
      return null;
    }, [discount, additionalPrice, isDiscount]);

    const basePriceString = useMemo(() => basePrice.toFixed(2), [basePrice]);
    const totalPriceString = useMemo(() => totalPrice.toFixed(2), [totalPrice]);
    const discountPriceString = useMemo(
      () => (discountPrice ? discountPrice.toFixed(2) : null),
      [discountPrice],
    );

    if (isDiscount) {
      return (
        <div className="flex flex-col gap-y-2">
          <div className="discount_section text-lg flex flex-row items-center justify-start gap-x-5 font-semibold">
            <h3 className="oldprice line-through w-fit font-normal">
              {`$ ${totalPriceString}`}
            </h3>
            <h3 className="w-fit text-red-400">{`-${isDiscount.percent}%`}</h3>
            <h3 className="w-fit">{`$ ${discountPriceString}`}</h3>
          </div>
          {additionalPrice > 0 && (
            <PriceBreakdown
              basePrice={isDiscount.newprice?.toFixed(2) || "0.00"}
              additionalPrice={additionalPrice.toFixed(2)}
            />
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-2">
        <h3 className="text-lg font-bold w-full">{`$${totalPriceString}`}</h3>
        {additionalPrice > 0 && (
          <PriceBreakdown
            basePrice={basePriceString}
            additionalPrice={additionalPrice.toFixed(2)}
          />
        )}
      </div>
    );
  },
);

ShowPriceWithOptions.displayName = "ShowPriceWithOptions";

interface PriceBreakdownProps {
  basePrice: string;
  additionalPrice: string;
}

const PriceBreakdown = React.memo(
  ({ basePrice, additionalPrice }: PriceBreakdownProps) => {
    return (
      <div className="flex flex-col gap-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-x-2">
          <span>Base price:</span>
          <span className="font-semibold">${basePrice}</span>
        </div>
        <div className="flex items-center gap-x-2">
          <span>Options price:</span>
          <span className="font-semibold text-blue-600">
            +${additionalPrice}
          </span>
        </div>
      </div>
    );
  },
);

PriceBreakdown.displayName = "PriceBreakdown";
