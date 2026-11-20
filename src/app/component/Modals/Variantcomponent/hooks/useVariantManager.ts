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
  edit: number;
  setEdit: React.Dispatch<React.SetStateAction<number>>;
  added: number;
  setAdded: React.Dispatch<React.SetStateAction<number>>;
  colorData: {
    color: typeof Colorinitalize;
    name: string;
    price?: number;
  };
  setColorData: React.Dispatch<
    React.SetStateAction<{
      color: typeof Colorinitalize;
      name: string;
      price?: number;
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
  const [edit, setEdit] = useState(-1);
  const [added, setAdded] = useState(-1);
  const [colorData, setColorData] = useState<{
    color: typeof Colorinitalize;
    name: string;
    price?: number;
  }>({
    color: Colorinitalize,
    name: "",
    price: undefined,
  });

  const resetState = useCallback(() => {
    setName("");
    setTemp(undefined);
    setEdit(-1);
    setAdded(-1);
    setOption("");
    setOptionPrice(undefined);
    setColorData({
      color: Colorinitalize,
      name: "",
      price: undefined,
    });
  }, []);

  const addColor = useCallback(() => {
    const { color, name: colorName, price } = colorData;
    if (color?.hex === "" || !colorName) {
      errorToast(color.hex === "" ? "Please Select Color" : "Name is Required");
      return false;
    }

    // Stock and the product page identify a color by its hex value, so two
    // colors with the same hex can't be told apart
    const isDuplicate = temp?.value.some(
      (v, idx) =>
        idx !== edit &&
        (typeof v === "string" ? v : v.val).toLowerCase() ===
          color.hex.toLowerCase(),
    );
    if (isDuplicate) {
      errorToast("This color is already added. Pick a different color.");
      return false;
    }

    setTemp((prev) => {
      if (!prev) return prev;
      const newColor: VariantValueObjType = {
        val: color.hex,
        name: colorName,
        ...(price !== undefined && { price: price.toString() }),
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
    });
    setEdit(-1);
    return true;
  }, [colorData, edit, temp]);

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
      // Only check for duplicates when adding a new option, not when editing
      if (edit === -1 && existingOptions.some((opt) => {
        const val = typeof opt === "string" ? opt : (opt as unknown as { val: string }).val;
        return val === option;
      })) {
        errorToast("Option Exist");
        return false;
      }

      setTemp((prev) => {
        if (!prev) return prev;

        const newOption: string | VariantValueObjType =
          optionPrice !== undefined
            ? { val: option, price: optionPrice.toString() }
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
      return true;
    },
    [option, optionPrice, edit],
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
