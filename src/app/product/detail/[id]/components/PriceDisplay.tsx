"use client";

import React, { useMemo } from "react";
import { ProductState } from "@/src/types/product.type";
import { useGlobalStore } from "@/src/context/GlobalContext";
import { calculateAdditionalPrice } from "../utils/productHelpers";

const money = (n: number) => `$${n.toFixed(2)}`;

/** Big current price, with the old price and saving when discounted */
const PriceBlock = ({
  current,
  original,
  percent,
  optionsExtra = 0,
}: {
  current: number;
  original?: number;
  percent?: number;
  optionsExtra?: number;
}) => (
  <div className="flex flex-col gap-y-1">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-3xl font-bold tracking-tight text-gray-900">
        {money(current)}
      </span>
      {original !== undefined && original > current && (
        <>
          <span className="text-lg text-gray-400 line-through">
            {money(original)}
          </span>
          {percent ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-red-600">
              -{percent}%
            </span>
          ) : null}
        </>
      )}
    </div>
    {original !== undefined && original > current && (
      <p className="text-sm font-medium text-green-700">
        You save {money(original - current)}
      </p>
    )}
    {optionsExtra > 0 && (
      <p className="text-sm text-gray-500">
        Includes +{money(optionsExtra)} for selected options
      </p>
    )}
  </div>
);

interface ShowPriceProps {
  price: number;
  discount: ProductState["discount"];
}

export const ShowPrice = React.memo(({ price, discount }: ShowPriceProps) => {
  const isDiscount = typeof discount !== "number" && discount?.discount;
  if (isDiscount && isDiscount.newprice) {
    return (
      <PriceBlock
        current={isDiscount.newprice}
        original={price}
        percent={isDiscount.percent}
      />
    );
  }
  return <PriceBlock current={price} />;
});

ShowPrice.displayName = "ShowPrice";

interface ShowPriceWithOptionsProps {
  price: number;
  discount: ProductState["discount"];
  Variant: ProductState["Variant"];
}

export const ShowPriceWithOptions = React.memo(
  ({ price, discount, Variant }: ShowPriceWithOptionsProps) => {
    const productorderdetail = useGlobalStore((s) => s.productorderdetail);

    const additionalPrice = useMemo(
      () => calculateAdditionalPrice(productorderdetail?.details, Variant),
      [productorderdetail, Variant],
    );

    const isDiscount = typeof discount !== "number" && discount?.discount;
    if (isDiscount && isDiscount.newprice) {
      return (
        <PriceBlock
          current={isDiscount.newprice + additionalPrice}
          original={price + additionalPrice}
          percent={isDiscount.percent}
          optionsExtra={additionalPrice}
        />
      );
    }
    return (
      <PriceBlock current={price + additionalPrice} optionsExtra={additionalPrice} />
    );
  },
);

ShowPriceWithOptions.displayName = "ShowPriceWithOptions";
