"use client";

import { useState, useCallback } from "react";
import { errorToast } from "@/src/app/component/Loading";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { ArraysAreEqualSets } from "../../VariantModal";
import { MapSelectedValuesToVariant } from "../../VariantModalComponent";
import { Stocktype } from "@/src/types/product.type";

export const useStockManager = () => {
  const [stock, setStock] = useState("");
  const [selectedValues, setSelectedValues] = useState<
    { [key: string]: string[] } | undefined
  >();
  const [editStockIdx, setEditStockIdx] = useState(-1);
  const [editSubStockIdx, setEditSubStockIdx] = useState(-1);
  const [addNewSubStock, setAddNewSubStock] = useState(false);

  const resetStockState = useCallback(() => {
    setStock("");
    setSelectedValues(undefined);
    setEditStockIdx(-1);
    setEditSubStockIdx(-1);
    setAddNewSubStock(false);
  }, []);

  const createOrUpdateStock = useCallback(
    (
      currentStock: Stocktype[],
      variantTitles: string[],
      addNew?: boolean,
    ): Array<Stocktype> | null => {
      // Validate inputs - check if we have selected values and stock

      if (!selectedValues || !stock) {
        return null;
      }

      const stockValues = MapSelectedValuesToVariant(
        selectedValues,
        variantTitles,
      );

      const parsedQty = parseInt(stock, 10);

      if (isNaN(parsedQty) || parsedQty < 0) {
        errorToast("Invalid quantity");
        return null;
      }

      const newStock: Stocktype = {
        qty: parsedQty,
        Stockvalue: stockValues.map((i) => ({
          qty: parsedQty,
          variant_val: i,
        })),
      };

      const stockArray = [...currentStock];

      // Check for exact duplicate within the same stock when adding new sub-stock
      if (addNew && editStockIdx !== -1) {
        const existingStock = stockArray[editStockIdx];
        const hasDuplicate = existingStock.Stockvalue.some((existing) =>
          stockValues.some((newVal) =>
            ArraysAreEqualSets(newVal, existing.variant_val),
          ),
        );

        if (hasDuplicate) {
          errorToast("This stock variant combination already exists");
          return null;
        }
      }

      // Check for overlap across ALL stocks (including other main stocks)
      const isOverlap = stockArray.some((item, idx) => {
        // When editing/adding to existing stock, skip checking against itself
        if (editStockIdx !== -1 && idx === editStockIdx && !addNew) {
          return false;
        }
        return HasPartialOverlap(
          item.Stockvalue.map((i) => i.variant_val),
          stockValues,
        );
      });

      if (isOverlap) {
        errorToast(
          "Stock with these variant values already exists in another stock",
        );
        return null;
      }

      // Add or update stock
      if (editStockIdx === -1) {
        return [...stockArray, newStock].filter(
          (stock) => stock.Stockvalue.length > 0,
        );
      } else {
        const existingStock = stockArray[editStockIdx];

        if (addNew) {
          // Don't update existing values, just add new ones

          const newStockValues = stockValues.map((i) => ({
            qty: parsedQty,
            variant_val: i,
          }));

          const updatedStockArray = stockArray.map((item, idx) =>
            idx === editStockIdx
              ? {
                  ...item,
                  Stockvalue: [...item.Stockvalue, ...newStockValues],
                }
              : item,
          );

          return updatedStockArray.filter(
            (stock) => stock.Stockvalue.length > 0,
          );
        }

        // Updating existing sub-stock values (not adding new)
        const updatedStockValue = existingStock.Stockvalue.map((i) => {
          const isMatch = stockValues.some((val) =>
            ArraysAreEqualSets(val, i.variant_val),
          );
          return isMatch ? { ...i, qty: parsedQty } : i;
        });

        // Update the stock array immutably
        const updatedStockArray = stockArray.map((item, idx) =>
          idx === editStockIdx
            ? { ...item, Stockvalue: updatedStockValue }
            : item,
        );

        return updatedStockArray.filter((stock) => stock.Stockvalue.length > 0);
      }
    },
    [selectedValues, stock, editStockIdx],
  );

  return {
    stock,
    setStock,
    selectedValues,
    setSelectedValues,
    editStockIdx,
    setEditStockIdx,
    editSubStockIdx,
    setEditSubStockIdx,
    addNewSubStock,
    setAddNewSubStock,
    resetStockState,
    createOrUpdateStock,
  };
};
