"use client";

import {
  Orderpricetype,
  OrderSelectedVariantType,
} from "@/src/types/order.type";
import { VariantValueObjType } from "@/src/types/product.type";
import { Selecteddetailcard } from "../Card";
import Image from "next/image";

// -----------------------------------------------------------------------------
// ShowPrice – internal helper
// -----------------------------------------------------------------------------

const ShowPrice = ({
  price,
  total,
  qty,
}: {
  price: Orderpricetype;
  total: number;
  qty: number;
}) => {
  const discount = price.discount || null;
  const basePrice = price.price;

  return (
    <div className="w-full flex flex-row items-center justify-between pt-4 border-t border-gray-100">
      <div className="price flex flex-row items-center flex-wrap gap-3">
        <h3
          hidden={!discount}
          className="text-base font-medium text-gray-400 line-through"
        >
          ${basePrice}
        </h3>
        <span
          hidden={!discount}
          className="px-2 py-0.5 bg-red-100 text-red-600 text-sm font-semibold rounded-full"
        >
          -{discount?.percent}%
        </span>
        <h3 className="text-lg font-semibold text-gray-800">
          ${discount ? discount.newprice?.toFixed(2) : basePrice}
        </h3>
        <span className="text-sm text-gray-500 font-medium">{`× ${qty}`}</span>
      </div>
      <h3 className="text-xl font-bold text-blue-600">
        ${parseFloat(total.toString()).toFixed(2)}
      </h3>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const isOrderSelectedVariantType = (
  details: unknown,
): details is OrderSelectedVariantType =>
  !!details &&
  !Array.isArray(details) &&
  typeof details === "object" &&
  ("variantsection" in (details as object) || "variant" in (details as object));

// -----------------------------------------------------------------------------
// Checkoutproductcard
// -----------------------------------------------------------------------------

export const Checkoutproductcard = ({
  qty,
  price,
  cover,
  details,
  name,
  total,
}: {
  qty: number;
  price: Orderpricetype;
  cover: string;
  name: string;
  total: number;
  details?: Array<string | VariantValueObjType> | OrderSelectedVariantType;
}) => {
  const renderVariants = () => {
    if (!details) return null;

    if (isOrderSelectedVariantType(details)) {
      return (
        <div className="w-full flex flex-col gap-3">
          {details.variantsection?.map((section, sectionIdx) => (
            <div key={sectionIdx} className="flex flex-col gap-2">
              {section.variantSection && (
                <span className="text-sm font-semibold text-gray-600">
                  {section.variantSection.name}:
                </span>
              )}
              <div className="w-full flex flex-row gap-2 flex-wrap">
                {section.variants.map((item, idx) => (
                  <Selecteddetailcard
                    key={sectionIdx * 1000 + idx}
                    text={item}
                  />
                ))}
              </div>
            </div>
          ))}
          {details.variant && details.variant.length > 0 && (
            <div className="w-full flex flex-row gap-2 flex-wrap">
              {details.variant.map((item, idx) => (
                <Selecteddetailcard key={idx} text={item} />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (Array.isArray(details) && details.length > 0) {
      return (
        <div className="w-full flex flex-row gap-2 flex-wrap">
          {details.map((item, idx) => (
            <Selecteddetailcard key={idx} text={item} />
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-row gap-6 items-center max-large_phone:flex-col hover:shadow-md transition-shadow duration-300">
      <div className="relative group">
        <Image
          src={cover}
          width={200}
          height={200}
          alt="thumbnail"
          className="w-40 h-40 rounded-lg object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="flex-1 w-full min-h-40 flex flex-col justify-between gap-3">
        <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{name}</h3>
        {renderVariants()}
        <ShowPrice total={total} qty={qty} price={price} />
      </div>
    </div>
  );
};
