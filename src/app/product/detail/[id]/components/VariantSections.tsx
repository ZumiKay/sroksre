"use client";

import React, { useMemo } from "react";
import { ProductState, Varianttype } from "@/src/types/product.type";
import { VariantSelector } from "./VariantSelector";
import { StockSelector, ErrorMessageType } from "./StockSelector";
import {
  separateVariantsBySections,
  sortVariantsByRequired,
} from "../utils/productHelpers";
import { orderWithAddons } from "@/src/lib/variantCondition";

interface VariantSectionProps {
  prob: Pick<
    ProductState,
    "stocktype" | "stock" | "Variant" | "Stock" | "Variantsection" | "id"
  >;
  qty: number;
  errormess: ErrorMessageType;
  setmess: React.Dispatch<React.SetStateAction<ErrorMessageType>>;
  setqty: React.Dispatch<React.SetStateAction<number>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  setincart: React.Dispatch<React.SetStateAction<boolean>>;
  isloading?: boolean;
}

const ProductUnavailable = () => (
  <h3 className="text-lg text-gray-400 font-medium">Product Unavailable</h3>
);

export const ShowVariantSections = (props: VariantSectionProps) => {
  const {
    prob,
    qty,
    errormess,
    setmess,
    setqty,
    setloading,
    setincart,
    isloading,
  } = props;

  // Get variants that are not in any section, separated by required/optional
  const { requiredVariantsNotInSection, optionalVariantsNotInSection } =
    useMemo(
      () => {
        const groups = separateVariantsBySections(prob.Variant || []);
        return {
          requiredVariantsNotInSection: orderWithAddons(
            groups.requiredVariantsNotInSection,
          ),
          optionalVariantsNotInSection: orderWithAddons(
            groups.optionalVariantsNotInSection,
          ),
        };
      },
      [prob.Variant],
    );

  // Sort variant sections to place required variants before optional ones
  const sortedVariantSections = useMemo(() => {
    return prob.Variantsection?.map((section) => {
      const sorted = sortVariantsByRequired(section);
      return {
        ...sorted,
        Variants: orderWithAddons((sorted.Variants ?? []) as Varianttype[]),
      };
    });
  }, [prob.Variantsection]);

  return (
    <>
      {sortedVariantSections?.map((section) => (
        <div
          key={section.id}
          className="w-full h-fit flex flex-col gap-y-3 p-4 rounded-2xl border border-gray-200 bg-gray-50/60"
        >
          <h3 className="text-base font-semibold text-gray-900">
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

      {/* Render required standalone variants not in any section */}
      {requiredVariantsNotInSection.length > 0 && (
        <div className="w-full h-fit flex flex-col gap-y-5">
          {requiredVariantsNotInSection.map((variant, idx) => {
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

      {/* Render optional standalone variants not in any section */}
      {optionalVariantsNotInSection.length > 0 && (
        <div className="w-full h-fit flex flex-col gap-y-5">
          {optionalVariantsNotInSection.map((variant, idx) => {
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

      {/* Show stock/quantity selector.
           When there are no DB Stock records (no-stock-tracking products)
           qty is auto-defaulted to 1 in fetchAndUpdateQuantity once all
           required options are selected, so this naturally becomes visible.
           "Product Unavailable" for a truly OOS combination is surfaced via
           setmess → currentErrorMessage in OptionSection, not rendered here. */}
      {qty > 0 ? (
        <StockSelector
          max={qty}
          errormess={errormess}
          setmess={setmess}
          isloading={isloading}
        />
      ) : null}
    </>
  );
};

export const ShowOptionandStock = (props: VariantSectionProps) => {
  const {
    prob,
    qty,
    errormess,
    setmess,
    setqty,
    setloading,
    setincart,
    isloading,
  } = props;
  const type = prob.stocktype;

  return type === "stock" ? (
    prob.stock && prob.stock > 0 ? (
      <StockSelector
        max={prob.stock}
        errormess={errormess}
        setmess={setmess}
        isStock={true}
      />
    ) : (
      <ProductUnavailable />
    )
  ) : prob.Variant ? (
    <>
      {orderWithAddons(prob.Variant).map((i) => (
        <VariantSelector
          key={i.id}
          id={i.id ?? 0}
          name={i.option_title}
          type={i.option_type}
          idx={prob.Variant?.indexOf(i) ?? 0}
          data={i.option_value}
          prob={prob}
          errormess={errormess}
          setmess={setmess}
          setqty={setqty}
          setloading={setloading}
          setincart={setincart}
        />
      ))}
      {/* Quantity appears once a complete selection has stock */}
      {qty > 0 ? (
        <StockSelector
          max={qty}
          errormess={errormess}
          setmess={setmess}
          isloading={isloading}
        />
      ) : !prob.Stock || prob.Stock.length === 0 ? (
        <ProductUnavailable />
      ) : null}
    </>
  ) : null;
};
