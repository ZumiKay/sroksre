"use client";

import React, { useCallback } from "react";
import { Skeleton } from "@heroui/react";
import { useGlobalStore } from "@/src/context/GlobalContext";
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
  ({ max, setmess, incart, isStock, isloading }: StockSelectorProps) => {
    const setproductorderdetail = useGlobalStore(
      (s) => s.setproductorderdetail,
    );
    const quantity = useGlobalStore((s) => s.productorderdetail?.quantity ?? 0);
    const disabled = max === 0 || !!incart;

    const setQuantity = useCallback(
      (next: number) => {
        setmess({ qty: "", option: "" });
        const val = Math.min(Math.max(next, 1), max);
        setproductorderdetail(
          (prev) =>
            ({
              ...prev,
              ...(isStock ? { details: [] } : {}),
              quantity: val,
            }) as Productordertype,
        );
      },
      [setmess, setproductorderdetail, isStock, max],
    );

    const shown = quantity > 0 ? quantity : max > 0 ? 1 : 0;

    return (
      <div className="flex flex-col gap-y-2">
        <p className="text-sm font-semibold text-gray-900">Quantity</p>
        {isloading ? (
          <Skeleton className="h-11 w-36 rounded-xl" />
        ) : (
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex h-11 items-center rounded-xl border border-gray-300 bg-white ${
                disabled ? "opacity-50" : ""
              }`}
            >
              <StepButton
                label="Decrease quantity"
                onClick={() => setQuantity(shown - 1)}
                disabled={disabled || shown <= 1}
              >
                −
              </StepButton>
              <input
                aria-label="Quantity"
                inputMode="numeric"
                value={shown}
                disabled={disabled}
                onChange={(e) => {
                  const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
                  if (!isNaN(n)) setQuantity(n);
                }}
                className="h-full w-12 bg-transparent text-center text-sm font-semibold text-gray-900 outline-none disabled:cursor-not-allowed"
              />
              <StepButton
                label="Increase quantity"
                onClick={() => setQuantity(shown + 1)}
                disabled={disabled || shown >= max}
              >
                +
              </StepButton>
            </div>
            {max > 0 && max <= 5 && (
              <span className="text-sm font-medium text-orange-600">
                Only {max} left
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

StockSelector.displayName = "StockSelector";

const StepButton = ({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className="grid h-full w-11 place-content-center text-lg text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 rounded-xl"
  >
    {children}
  </button>
);
