"use client";

import React, { useMemo, useCallback } from "react";
import { Selection } from "@/src/app/component/Button";
import { Skeleton } from "@heroui/react";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { Productordertype } from "@/src/types/order.type";

export interface ErrorMessageType {
  qty?: string;
  option?: string;
}

interface StockSelectorProps {
  max: number;
  errormess: ErrorMessageType;
  setmess: React.Dispatch<React.SetStateAction<ErrorMessageType>>;
  incart?: boolean;
  isStock?: boolean;
  isloading?: boolean;
}

export const StockSelector = React.memo(
  ({
    max,
    errormess,
    setmess,
    incart,
    isStock,
    isloading,
  }: StockSelectorProps) => {
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
          <Skeleton className="w-[90%] h-10 rounded-lg" />
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
