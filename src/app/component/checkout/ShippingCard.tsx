"use client";

import { useState } from "react";
import { updateShippingService } from "@/src/app/checkout/action";
import { errorToast, LoadingText } from "../Loading";

export const Shippingservicecard = ({
  type,
  price,
  estimate,
  value,
  isSelected,
  orderId,
  disabled,
}: {
  type: string;
  price: number;
  estimate: string;
  value: string;
  isSelected: boolean;
  orderId: string;
  disabled?: boolean;
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (disabled) return;
    setLoading(true);
    const request = await updateShippingService.bind(null, orderId, value)();
    setLoading(false);
    if (!request.success) {
      errorToast(request.message ?? "Error Occurred");
    }
  };

  const formattedPrice = `$${parseFloat(price.toString()).toFixed(2)}`;

  return (
    <>
      {loading && <LoadingText />}
      <div
        onClick={handleClick}
        className={`group relative w-full h-40 p-6 flex flex-col justify-between bg-white rounded-xl border-2 transition-all duration-300 ${disabled ? "cursor-default" : "cursor-pointer"} ${
          isSelected
            ? "border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-200"
            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
        }`}
      >
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800">{type}</h3>
          <p className="text-2xl font-bold text-blue-600">{formattedPrice}</p>
        </div>
        <p className="text-sm text-gray-500 font-medium">{estimate}</p>
      </div>
    </>
  );
};
