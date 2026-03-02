"use client";

import React, { useMemo } from "react";
import { ProductState } from "@/src/types/product.type";
import { VariantSelector } from "./VariantSelector";
import { StockSelector, ErrorMessageType } from "./StockSelector";
import {
  separateVariantsBySections,
  sortVariantsByRequired,
} from "../utils/productHelpers";

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
      () => separateVariantsBySections(prob.Variant || []),
      [prob.Variant],
    );

  // Sort variant sections to place required variants before optional ones
  const sortedVariantSections = useMemo(() => {
    return prob.Variantsection?.map(sortVariantsByRequired);
  }, [prob.Variantsection]);

  return (
    <>
      {sortedVariantSections?.map((section) => (
        <div
          key={section.id}
          className="w-full h-fit flex flex-col gap-y-3 p-4 bg-linear-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
        >
          <h3 className="text-xl font-bold text-purple-800 mb-2">
            {section.name}
          </h3>
          <div className="flex flex-col gap-y-5">
            {section.Variants?.map((variant: any, idx: number) => {
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

      {/* Show stock/quantity selector */}
      {prob.Stock && prob.Stock.length !== 0 ? (
        <StockSelector
          max={qty}
          errormess={errormess}
          setmess={setmess}
          isloading={isloading}
        />
      ) : qty === 0 ? (
        <ProductUnavailable />
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
        <ProductUnavailable />
      ) : null}
    </>
  ) : null;
};
