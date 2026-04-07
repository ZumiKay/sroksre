"use client";

import { ChangeEvent } from "react";
import { Input } from "@heroui/react";
import {
  ProductStockType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import PrimaryButton, { Selection } from "@/src/app/component/Button";
import { VariantIcon } from "@/src/app/component/Asset";

const stockTypeData = [
  { label: "Normal", value: "stock" },
  { label: "Variants ( Product have multiple versions)", value: "variant" },
];

interface StockSectionProps {
  stocktype: "stock" | "variant" | "size";
  loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onStocktypeChange: (value: string) => void;
}

export const StockSection = ({
  stocktype,
  handleChange,
  onStocktypeChange,
}: StockSectionProps) => {
  const { product, setopenmodal } = useGlobalContext();

  return (
    <>
      <Selection
        label="Stock Type"
        value={product.stocktype}
        data={stockTypeData}
        onChange={(e) => onStocktypeChange(e.target.value)}
        required
      />

      {stocktype === ProductStockType.stock ? (
        <Input
          type="number"
          label="Stock"
          labelPlacement="outside"
          placeholder="0"
          name="stock"
          min={0}
          max={1000}
          onChange={handleChange}
          value={product.stock === 0 ? "" : product.stock?.toString()}
          required
          size="lg"
          variant="bordered"
          classNames={{
            label: "text-sm font-semibold text-gray-700",
            input: "text-base font-semibold",
            inputWrapper:
              "border-2 hover:border-purple-400 focus-within:border-purple-500 transition-colors",
          }}
        />
      ) : (
        <PrimaryButton
          radius="10px"
          hoverTextColor="lightblue"
          type="button"
          text="Variants"
          Icon={<VariantIcon />}
          width="100%"
          onClick={() =>
            setopenmodal((prev) => ({ ...prev, addproductvariant: true }))
          }
          height="50px"
          color="black"
        />
      )}
    </>
  );
};
