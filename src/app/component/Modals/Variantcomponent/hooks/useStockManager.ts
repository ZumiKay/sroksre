import { useState, useCallback, useEffect } from "react";
import { Stocktype } from "@/src/context/GlobalContext";
import { errorToast } from "@/src/app/component/Loading";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { ArraysAreEqualSets } from "../../VariantModal";
import { MapSelectedValuesToVariant } from "../../VariantModalComponent";

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
      addNew?: boolean
    ): Stocktype[] | null => {
      // Validate inputs - check if we have selected values and stock

      if (!selectedValues || !stock) {
        return null;
      }

      // Check that all variant titles have selections
      const hasAllSelections = variantTitles.every((title) => {
        const values = selectedValues[title];
        return values && values.length > 0;
      });

      if (!hasAllSelections) {
        errorToast("Please select options for all variants");
        return null;
      }

      const stockValues = MapSelectedValuesToVariant(
        selectedValues,
        variantTitles
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

      // Check for overlap when adding new stock
      if (editStockIdx === -1) {
        const isOverlap = stockArray.some((item) =>
          HasPartialOverlap(
            item.Stockvalue.map((i) => i.variant_val),
            stockValues
          )
        );

        if (isOverlap) {
          errorToast("Stock Existed");
          return null;
        }
      }

      // Add or update stock
      if (editStockIdx === -1) {
        // Creating a completely new stock entry (for new product or adding new stock group)
        return [...stockArray, newStock].filter(
          (stock) => stock.Stockvalue.length > 0
        );
      } else {
        // Working with an existing stock entry
        const existingStock = stockArray[editStockIdx];

        if (addNew) {
          // Adding new sub-stock values to an existing stock entry
          // Don't update existing values, just add new ones

          const newStockValues = stockValues.map((i) => ({
            qty: parsedQty,
            variant_val: i,
          }));

          // Update the stock array immutably - append new values to existing
          const updatedStockArray = stockArray.map((item, idx) =>
            idx === editStockIdx
              ? {
                  ...item,
                  Stockvalue: [...item.Stockvalue, ...newStockValues],
                }
              : item
          );

          return updatedStockArray.filter(
            (stock) => stock.Stockvalue.length > 0
          );
        }

        // Updating existing sub-stock values (not adding new)
        const updatedStockValue = existingStock.Stockvalue.map((i) => {
          const isMatch = stockValues.some((val) =>
            ArraysAreEqualSets(val, i.variant_val)
          );
          return isMatch ? { ...i, qty: parsedQty } : i;
        });

        // Update the stock array immutably
        const updatedStockArray = stockArray.map((item, idx) =>
          idx === editStockIdx
            ? { ...item, Stockvalue: updatedStockValue }
            : item
        );

        return updatedStockArray.filter((stock) => stock.Stockvalue.length > 0);
      }
    },
    [selectedValues, stock, editStockIdx]
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
