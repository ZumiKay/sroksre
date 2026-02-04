"use client";

import { useState, useCallback } from "react";
import { errorToast } from "@/src/app/component/Loading";
import { Colorinitalize } from "../../types";
import { VariantValueObjType, VariantTypeEnum } from "@/src/types/product.type";

interface VariantDataType {
  id?: number;
  type: VariantTypeEnum;
  name: string;
  value: Array<string | VariantValueObjType>;
  optional?: boolean;
}

export interface UseVariantManagerReturn {
  temp: VariantDataType | undefined;
  setTemp: React.Dispatch<React.SetStateAction<VariantDataType | undefined>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  option: string;
  setOption: React.Dispatch<React.SetStateAction<string>>;
  optionPrice: number | undefined;
  setOptionPrice: React.Dispatch<React.SetStateAction<number | undefined>>;
  optionQty: number | undefined;
  setOptionQty: React.Dispatch<React.SetStateAction<number | undefined>>;
  edit: number;
  setEdit: React.Dispatch<React.SetStateAction<number>>;
  added: number;
  setAdded: React.Dispatch<React.SetStateAction<number>>;
  colorData: {
    color: typeof Colorinitalize;
    name: string;
    price?: number;
    qty?: number;
  };
  setColorData: React.Dispatch<
    React.SetStateAction<{
      color: typeof Colorinitalize;
      name: string;
      price?: number;
      qty?: number;
    }>
  >;
  resetState: () => void;
  addColor: () => boolean;
  deleteValue: (idx: number) => void;
  addTextOption: (existingOptions: string[]) => boolean;
}

export const useVariantManager = (): UseVariantManagerReturn => {
  const [temp, setTemp] = useState<VariantDataType>();
  const [name, setName] = useState("");
  const [option, setOption] = useState("");
  const [optionPrice, setOptionPrice] = useState<number | undefined>();
  const [optionQty, setOptionQty] = useState<number | undefined>();
  const [edit, setEdit] = useState(-1);
  const [added, setAdded] = useState(-1);
  const [colorData, setColorData] = useState<{
    color: typeof Colorinitalize;
    name: string;
    price?: number;
    qty?: number;
  }>({
    color: Colorinitalize,
    name: "",
    price: undefined,
    qty: undefined,
  });

  const resetState = useCallback(() => {
    setName("");
    setTemp(undefined);
    setEdit(-1);
    setAdded(-1);
    setOption("");
    setOptionPrice(undefined);
    setOptionQty(undefined);
    setColorData({
      color: Colorinitalize,
      name: "",
      price: undefined,
      qty: undefined,
    });
  }, []);

  const addColor = useCallback(() => {
    const { color, name: colorName, price, qty } = colorData;
    if (color?.hex === "" || !colorName) {
      errorToast(color.hex === "" ? "Please Select Color" : "Name is Required");
      return false;
    }

    setTemp((prev) => {
      if (!prev) return prev;
      const newColor: VariantValueObjType = {
        val: color.hex,
        name: colorName,
        ...(price !== undefined && { price: price.toString() }),
        ...(qty !== undefined && { qty }),
      };

      if (edit === -1) {
        // Create a new array instead of mutating
        return {
          ...prev,
          value: [...(prev.value || []), newColor],
        };
      } else if (prev.value && edit !== -1) {
        // Create a new array with the updated value
        const newValue = [...prev.value];
        newValue[edit] = newColor;
        return {
          ...prev,
          value: newValue,
        };
      }
      return prev;
    });

    setColorData({
      color: Colorinitalize,
      name: "",
      price: undefined,
      qty: undefined,
    });
    setEdit(-1);
    return true;
  }, [colorData, edit]);

  const deleteValue = useCallback((idx: number) => {
    setTemp((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated.value?.splice(idx, 1);
      return updated;
    });
  }, []);

  const addTextOption = useCallback(
    (existingOptions: string[]) => {
      if (existingOptions.includes(option)) {
        errorToast("Option Exist");
        return false;
      }

      setTemp((prev) => {
        if (!prev) return prev;

        const newOption: string | VariantValueObjType =
          optionPrice !== undefined || optionQty !== undefined
            ? {
                val: option,
                ...(optionPrice !== undefined && {
                  price: optionPrice.toString(),
                }),
                ...(optionQty !== undefined && { qty: optionQty }),
              }
            : option;

        if (edit === -1) {
          // Create a new array instead of mutating
          return {
            ...prev,
            value: [...(prev.value || []), newOption],
          };
        } else if (prev.value) {
          // Create a new array with the updated value
          const newValue = [...prev.value];
          newValue[edit] = newOption;
          return {
            ...prev,
            value: newValue,
          };
        }
        return prev;
      });

      setEdit(-1);
      setOption(""); // Reset the option input after adding
      setOptionPrice(undefined);
      setOptionQty(undefined);
      return true;
    },
    [option, optionPrice, optionQty, edit],
  );

  return {
    temp,
    setTemp,
    name,
    setName,
    option,
    setOption,
    optionPrice,
    setOptionPrice,
    optionQty,
    setOptionQty,
    edit,
    setEdit,
    added,
    setAdded,
    colorData,
    setColorData,
    resetState,
    addColor,
    deleteValue,
    addTextOption,
  };
};
