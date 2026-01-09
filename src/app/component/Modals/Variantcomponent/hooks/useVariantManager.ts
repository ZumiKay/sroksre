import { useState, useCallback } from "react";
import { errorToast } from "@/src/app/component/Loading";
import { VariantColorValueType } from "@/src/context/GlobalContext";
import { Colortype, Colorinitalize } from "../../types";

interface VariantDataType {
  id?: number;
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<string | VariantColorValueType>;
}

export const useVariantManager = () => {
  const [temp, setTemp] = useState<VariantDataType>();
  const [name, setName] = useState("");
  const [option, setOption] = useState("");
  const [edit, setEdit] = useState(-1);
  const [added, setAdded] = useState(-1);
  const [colorData, setColorData] = useState({
    color: Colorinitalize,
    name: "",
  });

  const resetState = useCallback(() => {
    setName("");
    setTemp(undefined);
    setEdit(-1);
    setAdded(-1);
    setOption("");
    setColorData({ color: Colorinitalize, name: "" });
  }, []);

  const addColor = useCallback(() => {
    const { color, name: colorName } = colorData;
    if (color?.hex === "" || !colorName) {
      errorToast(color.hex === "" ? "Please Select Color" : "Name is Required");
      return false;
    }

    setTemp((prev) => {
      if (!prev) return prev;
      const newColor = { val: color.hex, name: colorName };

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

    setColorData({ color: Colorinitalize, name: "" });
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
        const updated = { ...prev };

        if (edit === -1) {
          updated.value?.push(option);
        } else if (updated.value) {
          updated.value[edit] = option;
        }
        return updated;
      });

      setEdit(-1);
      return true;
    },
    [option, edit]
  );

  return {
    temp,
    setTemp,
    name,
    setName,
    option,
    setOption,
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
