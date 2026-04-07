"use client";

import { ChangeEvent } from "react";
import { Input } from "@heroui/react";
import { Filterdatatype } from "./types";

interface AmountRangeProps {
  data: Filterdatatype;
  setdata: React.Dispatch<React.SetStateAction<Filterdatatype>>;
}

export const AmountRange = ({ data, setdata }: AmountRangeProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setdata((prev) => ({ ...prev, [name]: value }));
    } else {
      e.target.value = "";
    }
  };

  return (
    <div className="Pricerange_Container inline-flex gap-x-5 w-full justify-start">
      <Input
        type="number"
        id="startprice"
        name="startprice"
        placeholder="0.00"
        label="From"
        labelPlacement="outside"
        endContent="$"
        size="lg"
        value={data.startprice?.toString()}
        onChange={handleChange}
        min={0}
        className="w-full"
      />
      <Input
        type="number"
        id="endprice"
        name="endprice"
        value={data.endprice?.toString() ?? ""}
        placeholder="0.00"
        endContent="$"
        label="To"
        labelPlacement="outside"
        onChange={handleChange}
        size="lg"
        min={0}
        className="w-full"
      />
    </div>
  );
};
