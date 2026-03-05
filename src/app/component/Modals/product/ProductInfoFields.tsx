"use client";

import { ChangeEvent } from "react";
import { Input } from "@heroui/react";
import { useGlobalContext } from "@/src/context/GlobalContext";

const inputClasses = {
  label: "text-sm font-semibold text-gray-700",
  input: "text-base",
  inputWrapper:
    "border-2 hover:border-blue-400 focus-within:border-blue-500 transition-colors",
};

interface ProductInfoFieldsProps {
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

export const ProductInfoFields = ({
  handleChange,
  loading,
}: ProductInfoFieldsProps) => {
  const { product } = useGlobalContext();

  return (
    <>
      <Input
        type="text"
        label="Product Name"
        labelPlacement="outside"
        placeholder="Enter product name"
        name="name"
        onChange={handleChange}
        value={product.name}
        required
        size="lg"
        variant="bordered"
        isDisabled={loading}
        classNames={inputClasses}
      />
      <Input
        type="text"
        label="Short Description"
        placeholder="Enter a brief description"
        labelPlacement="outside"
        name="description"
        onChange={handleChange}
        value={product.description}
        required
        size="lg"
        variant="bordered"
        isDisabled={loading}
        classNames={inputClasses}
      />
      <Input
        type="number"
        label="Price"
        labelPlacement="outside"
        placeholder="0.00"
        step=".01"
        value={product.price === 0 ? "" : product.price.toString()}
        name="price"
        onChange={handleChange}
        min={0}
        max={10000}
        isDisabled={loading}
        startContent={
          <span className="pointer-events-none text-default-400 text-lg font-semibold">
            $
          </span>
        }
        required
        size="lg"
        variant="bordered"
        classNames={{
          label: "text-sm font-semibold text-gray-700",
          input: "text-base font-semibold",
          inputWrapper:
            "border-2 hover:border-green-400 focus-within:border-green-500 transition-colors",
        }}
      />
    </>
  );
};
