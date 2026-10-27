import { useGlobalContext } from "@/src/context/GlobalContext";
import React, { ChangeEvent, useState } from "react";
import PrimaryButton from "../Button";
import {
  ArraysAreEqualSets,
  Colorinitalize,
  Colortype,
  Variantcontainertype,
} from "./VariantModal";
import { errorToast, successToast } from "../Loading";
import { SecondaryModal } from "../Modals";
import { CirclePicker, ChromePicker } from "react-color";
import { Button, Chip, Input } from "@heroui/react";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { ApiRequest, useScreenSize } from "@/src/context/CustomHook";
import Multiselect from "../MutiSelect";
import { NormalSkeleton } from "../Banner";
import RenderStockCards, {
  LOW_STOCK_LIMIT,
} from "./Variantcomponent/StockCard";
import { Stocktype } from "@/src/types/product.type";
import {
  VariantStockIcon,
  BackArrowIcon,
  PlusIcon,
  WarningIcon,
} from "../svg/icons";
import { AddIcon } from "../Asset";

interface ManageStockContainerProps {
  editindex?: number;
  newadd: string;
  stock: string;
  setstock: React.Dispatch<React.SetStateAction<string>>;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  setnew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
  setaddstock: React.Dispatch<React.SetStateAction<number>>;
  isloading: boolean;
  edit: number;
  addstock: number;
  selectedstock: { [key: string]: string[] };
  setselectedstock: React.Dispatch<
    React.SetStateAction<{ [key: string]: string[] } | undefined>
  >;
  handleUpdateStock: (isAddnew?: boolean) => void;
  editsubidx: number;
  seteditsubidx: React.Dispatch<React.SetStateAction<number>>;
  setadded: React.Dispatch<React.SetStateAction<number>>;
  isAddNew: boolean;
  setisAddNew: React.Dispatch<React.SetStateAction<boolean>>;
  setreloaddata: React.Dispatch<React.SetStateAction<boolean>>;
}

function GenerateCombinations(arrays: (string[] | undefined)[]): string[][] {
  if (arrays.length === 0) return [[]];

  // Start with an empty combination
  let result: string[][] = [[]];

  // Build combinations
  for (const array of arrays) {
    const newResult: string[][] = [];

    if (array && array.length > 0) {
      // For each existing combination, add each value from current array
      for (const combination of result) {
        for (const value of array) {
          newResult.push([...combination, value]);
        }
      }
    } else {
      // If array is undefined or empty
      for (const combination of result) {
        newResult.push([...combination]);
      }
    }

    result = newResult;
  }

  return result;
}

export function MapSelectedValuesToVariant(
  selectedValues: { [key: string]: string[] },
  variantKeys: string[],
): string[][] {
  const arrays: (string[] | undefined)[] = variantKeys.map(
    (key) => selectedValues[key],
  );

  const combinations = GenerateCombinations(arrays);

  return combinations;
}

const groupSelectedValue = (
  data: { Stockvalue: { variant_val: string[] }[] },
  variants: {
    option_title: string;
    option_value: (string | { val: string; name: string })[];
  }[],
) => {
  const res: { [key: string]: Set<string> } = {};

  data.Stockvalue.forEach((stock) => {
    stock.variant_val.forEach((value) => {
      // Find the variant that includes the value, ignoring order
      const matchedVariant = variants.find((variant) =>
        variant.option_value.some((opt) =>
          typeof opt === "string" ? opt === value : opt.val === value,
        ),
      );

      if (matchedVariant) {
        const optionTitle = matchedVariant.option_title;

        if (!res[optionTitle]) {
          res[optionTitle] = new Set();
        }

        res[optionTitle].add(value);
      }
    });
  });

  // Convert Sets to arrays for the final result
  const finalRes: { [key: string]: string[] } = {};
  for (const key in res) {
    finalRes[key] = Array.from(res[key]);
  }

  return finalRes;
};

const CountLowStock = (stock?: Stocktype) => {
  if (!stock) return 0;
  return stock.Stockvalue.reduce((total, i) => {
    return i.qty <= LOW_STOCK_LIMIT ? (total += 1) : total;
  }, 0);
};

type BulkMode = "set" | "add" | "subtract";

const BULK_MODE_LABELS: Record<BulkMode, string> = {
  set: "Set to",
  add: "Add",
  subtract: "Remove",
};

const ToolbarButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {children}
  </button>
);

/** "3 of 8 selected" + Select all / Select low stock / Cancel */
const SelectionToolbar = ({
  total,
  noun,
  selectMode,
  selectedCount,
  allSelected,
  hasLowStock,
  onStart,
  onToggleAll,
  onSelectLow,
  onCancel,
}: {
  total: number;
  noun: [singular: string, plural: string];
  selectMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  hasLowStock: boolean;
  onStart: () => void;
  onToggleAll: () => void;
  onSelectLow: () => void;
  onCancel: () => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm text-gray-500">
      {selectMode
        ? `${selectedCount} of ${total} selected`
        : `${total} ${total === 1 ? noun[0] : noun[1]}`}
    </p>
    <div className="flex flex-wrap items-center gap-2">
      {selectMode ? (
        <>
          <ToolbarButton onClick={onToggleAll}>
            {allSelected ? "Unselect all" : "Select all"}
          </ToolbarButton>
          {hasLowStock && (
            <ToolbarButton onClick={onSelectLow}>
              Select low stock
            </ToolbarButton>
          )}
          <ToolbarButton onClick={onCancel}>Cancel</ToolbarButton>
        </>
      ) : (
        <ToolbarButton onClick={onStart}>Select to update</ToolbarButton>
      )}
    </div>
  </div>
);

/** Set to / Add / Remove + quantity + Apply */
const BulkUpdateBar = ({
  mode,
  setMode,
  qty,
  onQtyChange,
  onApply,
  canApply,
  loading,
  applyLabel,
}: {
  mode: BulkMode;
  setMode: (mode: BulkMode) => void;
  qty: string;
  onQtyChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onApply: () => void;
  canApply: boolean;
  loading: boolean;
  applyLabel: string;
}) => (
  <div className="w-full flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50">
    <div
      role="radiogroup"
      aria-label="How to update quantity"
      className="inline-flex shrink-0 rounded-lg bg-white border border-gray-200 p-0.5"
    >
      {(Object.keys(BULK_MODE_LABELS) as BulkMode[]).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={`px-3 h-8 text-sm font-medium rounded-md transition-colors ${
            mode === m
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {BULK_MODE_LABELS[m]}
        </button>
      ))}
    </div>
    <input
      type="text"
      inputMode="numeric"
      value={qty}
      onChange={onQtyChange}
      onKeyDown={(e) => {
        if (e.key === "Enter" && canApply && !loading) onApply();
      }}
      placeholder="Quantity"
      aria-label="Quantity"
      className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
    <button
      type="button"
      onClick={onApply}
      disabled={!canApply || loading}
      className="shrink-0 h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Saving…" : applyLabel}
    </button>
  </div>
);

const AsyncUpdateStock = async (editindex: number, stockArray: Stocktype[]) => {
  const res = await ApiRequest("/api/products/crud", undefined, "PUT", "JSON", {
    id: editindex,
    Stock: stockArray,
    type: "editvariantstock",
  });

  return res;
};

export function ManageStockContainer({
  newadd,
  setedit,
  edit,
  stock,
  setstock,
  setnew,
  setselectedstock,
  selectedstock,
  handleUpdateStock,
  editsubidx,
  seteditsubidx,
  setadded,
  isAddNew,
  setisAddNew,
  editindex,
  setreloaddata,
  isloading,
}: ManageStockContainerProps) {
  const { product, setproduct } = useGlobalContext();
  const [lowstock, setlowstock] = useState(0);
  const [loading, setloading] = useState(false);

  // Bulk update: select several items and change their qty at once.
  // On the stock list the items are stock entries (every combination inside
  // a selected entry is updated); inside an entry they are its combinations.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSubs, setSelectedSubs] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState<BulkMode>("set");
  const [bulkQty, setBulkQty] = useState("");

  const isEntryList = newadd === "stock";
  const stockGroups = product.Stock ?? [];
  const currentSubs = edit !== -1 ? (stockGroups[edit]?.Stockvalue ?? []) : [];
  const listLength = isEntryList ? stockGroups.length : currentSubs.length;
  const lowSubIdx = (
    isEntryList
      ? stockGroups.map((g, i) => (CountLowStock(g) > 0 ? i : -1))
      : currentSubs.map((s, i) => (s.qty <= LOW_STOCK_LIMIT ? i : -1))
  ).filter((i) => i !== -1);
  const allSelected = listLength > 0 && selectedSubs.size === listLength;
  // Combinations affected by the current selection (for the Apply button)
  const affectedCount = isEntryList
    ? stockGroups.reduce(
        (total, g, i) =>
          selectedSubs.has(i) ? total + g.Stockvalue.length : total,
        0,
      )
    : selectedSubs.size;

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedSubs(new Set());
    setBulkQty("");
  };

  // Leaving the combination list clears any selection
  const viewKey = `${edit}|${newadd}|${isAddNew}|${editsubidx}`;
  const [prevViewKey, setPrevViewKey] = useState(viewKey);
  if (prevViewKey !== viewKey) {
    setPrevViewKey(viewKey);
    exitSelectMode();
  }

  const toggleSelectSub = (idx: number) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedSubs(
      allSelected
        ? new Set()
        : new Set(Array.from({ length: listLength }, (_, i) => i)),
    );
  };

  const selectLowStock = () => {
    setSelectMode(true);
    setSelectedSubs(new Set(lowSubIdx));
  };

  const handleBulkQtyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]+$/.test(value)) setBulkQty(value);
  };

  const handleBulkApply = async () => {
    if (!product.Stock || selectedSubs.size === 0) return;
    if (!isEntryList && edit === -1) return;

    const amount = parseInt(bulkQty, 10);
    if (isNaN(amount)) {
      errorToast("Enter a quantity");
      return;
    }

    const nextQty = (current: number) =>
      bulkMode === "set"
        ? amount
        : bulkMode === "add"
          ? current + amount
          : Math.max(0, current - amount);

    const updatedStock = product.Stock.map((group, gIdx) => {
      if (isEntryList) {
        // Whole entry selected: update every combination in it
        if (!selectedSubs.has(gIdx)) return group;
        return {
          ...group,
          Stockvalue: group.Stockvalue.map((sub) => ({
            ...sub,
            qty: nextQty(sub.qty),
          })),
        };
      }
      if (gIdx !== edit) return group;
      return {
        ...group,
        Stockvalue: group.Stockvalue.map((sub, sIdx) =>
          selectedSubs.has(sIdx) ? { ...sub, qty: nextQty(sub.qty) } : sub,
        ),
      };
    });

    if (editindex) {
      setloading(true);
      const req = await AsyncUpdateStock(editindex, updatedStock);
      setloading(false);
      if (!req.success) {
        errorToast("Error Occured");
        return;
      }
      setreloaddata(true);
    }

    setproduct((prev) => ({ ...prev, Stock: updatedStock }));
    if (edit !== -1) setlowstock(CountLowStock(updatedStock[edit]));
    successToast(
      isEntryList
        ? `Updated ${affectedCount} combination${affectedCount === 1 ? "" : "s"} in ${selectedSubs.size} stock entr${selectedSubs.size === 1 ? "y" : "ies"}`
        : `Updated ${affectedCount} combination${affectedCount === 1 ? "" : "s"}`,
    );
    exitSelectMode();
  };

  const handleSelectVariant = (value: Set<string>, label: string) => {
    setselectedstock((prevSelectedStock) => {
      const updatedStock = { ...(prevSelectedStock || {}) };

      updatedStock[label] = Array.from(value).filter((i) => i !== "");

      return updatedStock;
    });
  };

  const handleEdit = (idx: number) => {
    //extract reponsible stock value for selected value

    if (product.Stock && product.Variant) {
      const createdstock = groupSelectedValue(
        product.Stock[idx] as unknown as Stocktype,
        product.Variant as any,
      );

      setselectedstock(createdstock);
      setlowstock(CountLowStock(product.Stock[idx]));
      setedit(idx);
      setnew("stockinfo");
    }
  };

  const handleStockChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[0-9\b]+$/.test(value)) {
      setstock(value);
    }
  };

  const handleAddNewSubStock = () => {
    if (isAddNew) {
      handleUpdateStock(isAddNew);
      setisAddNew(false);
      setselectedstock(undefined);
      setstock("");
    } else {
      setselectedstock(undefined);
      setisAddNew(true);
    }
  };

  const handleDeleteSubStock = async (idx: number) => {
    if (!product.Stock || edit === -1) return;

    // Only remove the combination from the stock entry being edited
    const updatedStock = product.Stock.map((group, gIdx) =>
      gIdx !== edit
        ? group
        : {
            ...group,
            Stockvalue: group.Stockvalue.filter((_, index) => index !== idx),
          },
    );

    if (editindex) {
      setloading(true);
      const req = await AsyncUpdateStock(editindex, updatedStock);
      setloading(false);
      if (!req.success) {
        errorToast("Error Occured");
        return;
      }
      setreloaddata(true);
    }

    setproduct((prev) => ({
      ...prev,
      Stock: updatedStock,
    }));
    setlowstock(CountLowStock(updatedStock[edit]));
  };

  const handleSubStockClick = (data: string[], qty: string, idx: number) => {
    const variants = [...(product.Variant ?? [])];

    //group select sub stock value
    const res: { [key: string]: string[] } = {};
    data.forEach((value, idx) => {
      if (idx < variants.length) {
        const variant = variants[idx];
        const isVal = variant.option_value.some((opt) =>
          typeof opt === "string" ? opt === value : opt.val === value,
        );

        if (isVal) {
          if (!res[variant.option_title]) {
            res[variant.option_title] = [];
          }

          if (!res[variant.option_title].includes(value)) {
            res[variant.option_title].push(value);
          }
        }
      }
    });
    setselectedstock(res);
    setstock(qty);
    seteditsubidx(idx);
  };

  const handleUpdateSubStock = async (idx: number) => {
    const stockArray = [...(product.Stock ?? [])];
    const updatestockvalue = stockArray[edit];

    const stockValues = MapSelectedValuesToVariant(
      selectedstock,
      product.Variant?.map((i) => i.option_title) ?? [],
    );

    const hasChangedVariantValues = stockValues.some(
      (val) =>
        !updatestockvalue.Stockvalue.some((i) =>
          ArraysAreEqualSets(val, i.variant_val),
        ),
    );

    if (hasChangedVariantValues) {
      const isOverlap = stockArray.some(
        (item, idx) =>
          idx !== edit &&
          HasPartialOverlap(
            item.Stockvalue.map((i) => i.variant_val),
            stockValues,
          ),
      );
      if (isOverlap) {
        errorToast("Stock Exist");
        return;
      }

      updatestockvalue.Stockvalue.splice(idx, 1);
      stockValues.forEach((i) => {
        updatestockvalue.Stockvalue.push({
          qty: parseInt(stock, 10),
          variant_val: i,
        });
      });
    } else {
      updatestockvalue.Stockvalue[idx].qty = parseInt(stock, 10);
    }

    if (editindex) {
      setloading(true);
      const req = await AsyncUpdateStock(editindex, stockArray);
      setloading(false);
      if (!req.success) {
        errorToast("Error Occured");
        return;
      }
      setreloaddata(true);
    }

    setproduct((prev) => ({ ...prev, Stock: stockArray }));

    setlowstock(CountLowStock(stockArray[edit]));
    seteditsubidx(-1);
    setstock("");
    setselectedstock(undefined);
  };

  const handleBackEditSubStock = () => {
    if (editsubidx !== -1) {
      // Check if there's stock data to save before going back
      const hasSelectedOptions = Object.values(selectedstock || {}).some(
        (arr) => arr && arr.length > 0,
      );
      if (hasSelectedOptions && stock !== "") {
        handleUpdateSubStock(editsubidx);
      } else {
        setselectedstock(undefined);
        setstock("");
        seteditsubidx(-1);
      }
    } else if (isAddNew) {
      const hasSelectedOptions = Object.values(selectedstock || {}).some(
        (arr) => arr && arr.length > 0,
      );
      if (hasSelectedOptions && stock !== "") {
        handleUpdateStock(true);
      }
      setisAddNew(false);
      setnew("stock");
    }
  };

  const handleDeleteStock = async (idx: number) => {
    const updatestock = [...(product.Stock ?? [])];
    updatestock.splice(idx, 1);
    if (editindex) {
      setloading(true);
      const req = await AsyncUpdateStock(editindex, updatestock);
      setloading(false);
      if (!req.success) {
        errorToast("Error Occured");
        return;
      }
      setreloaddata(true);
    }

    setproduct((prev) => ({
      ...prev,
      Stock: updatestock,
    }));
  };

  const inCombinationList =
    newadd === "stockinfo" && edit !== -1 && !isAddNew && editsubidx === -1;
  const showSelector = edit === -1 || isAddNew || editsubidx !== -1;

  const stockHeading =
    edit === -1
      ? "Choose variant values"
      : isAddNew
        ? "Add combinations"
        : editsubidx !== -1
          ? "Edit combination"
          : `Stock #${edit + 1}`;

  const stockHint =
    edit === -1
      ? "Pick the values this stock covers. Every combination of them gets the quantity below."
      : isAddNew
        ? "Pick values for the new combinations and set their quantity."
        : editsubidx !== -1
          ? "Change the values or quantity for this combination."
          : "Click a combination to edit it, or select several to update them at once.";

  const canApplyBulk = affectedCount > 0 && bulkQty !== "";

  return (
    <>
      <div className="stock_container w-full h-full relative px-6 pb-2">
        {newadd === "stockinfo" ? (
          <div className="createstock_container flex flex-col w-full h-full gap-y-4">
            {(editsubidx !== -1 || isAddNew) && (
              <button
                type="button"
                onClick={() => handleBackEditSubStock()}
                className="self-start inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <BackArrowIcon />
                Back to combinations
              </button>
            )}

            <div>
              <h4 className="text-base font-semibold text-gray-900">
                {stockHeading}
              </h4>
              <p className="text-sm text-gray-500 mt-0.5">{stockHint}</p>
            </div>

            {inCombinationList && lowstock !== 0 && !selectMode && (
              <div
                role="status"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200"
              >
                <WarningIcon className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-800">
                  <span className="font-semibold">
                    {lowstock} combination{lowstock > 1 ? "s" : ""}
                  </span>{" "}
                  {lowstock > 1 ? "are" : "is"} low on stock.
                </p>
                <button
                  type="button"
                  onClick={selectLowStock}
                  className="ml-auto shrink-0 text-sm font-semibold text-red-700 hover:text-red-900 hover:underline"
                >
                  Select them
                </button>
              </div>
            )}

            {showSelector ? (
              <div className="variantlist flex flex-col gap-y-5 w-full max-h-[50vh] overflow-y-auto p-5 rounded-xl bg-gray-50 border border-gray-200">
                {product.Variant?.map((item, idx) => {
                  return (
                    <Multiselect
                      key={item.id}
                      id={idx}
                      type={item.option_type}
                      isOptional={item.optional}
                      value={selectedstock[item.option_title]}
                      data={item.option_value.map((i) => {
                        if (typeof i === "string") {
                          return { label: i, value: i };
                        } else {
                          return { label: i.name ?? "", value: i.val };
                        }
                      })}
                      label={item.option_title}
                      onSelect={(val) =>
                        handleSelectVariant(val, item.option_title)
                      }
                    />
                  );
                })}
              </div>
            ) : (
              product.Stock && (
                <div className="editstock_container w-full flex flex-col gap-3">
                  {currentSubs.length > 0 && (
                    <SelectionToolbar
                      total={currentSubs.length}
                      noun={["combination", "combinations"]}
                      selectMode={selectMode}
                      selectedCount={selectedSubs.size}
                      allSelected={allSelected}
                      hasLowStock={lowSubIdx.length > 0}
                      onStart={() => setSelectMode(true)}
                      onToggleAll={toggleSelectAll}
                      onSelectLow={selectLowStock}
                      onCancel={exitSelectMode}
                    />
                  )}
                  <div className="max-h-[46vh] overflow-y-auto">
                    <RenderStockCards
                      handleDeleteSubStock={handleDeleteSubStock}
                      handleSubStockClick={handleSubStockClick}
                      edit={edit}
                      selectMode={selectMode}
                      selected={selectedSubs}
                      onToggleSelect={toggleSelectSub}
                    />
                  </div>
                </div>
              )
            )}

            {selectMode && inCombinationList ? (
              <BulkUpdateBar
                mode={bulkMode}
                setMode={setBulkMode}
                qty={bulkQty}
                onQtyChange={handleBulkQtyChange}
                onApply={handleBulkApply}
                canApply={canApplyBulk}
                loading={loading}
                applyLabel={`Apply to ${selectedSubs.size} selected`}
              />
            ) : (
              <div className="w-full flex flex-col sm:flex-row sm:items-end gap-3">
                {showSelector && (
                  <Input
                    label="Quantity"
                    labelPlacement="outside"
                    type="number"
                    placeholder="0"
                    className="flex-1"
                    value={stock}
                    onChange={handleStockChange}
                    classNames={{
                      label: "font-medium text-sm text-gray-700",
                      inputWrapper:
                        "h-11 bg-white border-2 border-gray-200 hover:border-gray-300 shadow-none",
                    }}
                  />
                )}
                {edit !== -1 && (
                  <Button
                    className={`h-11 px-6 font-semibold text-sm shrink-0 ${
                      showSelector ? "" : "w-full"
                    }`}
                    startContent={editsubidx === -1 ? <PlusIcon /> : undefined}
                    isLoading={loading}
                    color={isAddNew ? "success" : "primary"}
                    onPress={() =>
                      editsubidx === -1
                        ? handleAddNewSubStock()
                        : handleUpdateSubStock(editsubidx)
                    }
                  >
                    {editsubidx !== -1
                      ? "Update Stock"
                      : isAddNew
                        ? "Save Combinations"
                        : "Add Combination"}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="selectvariaint_container flex flex-col gap-y-4 w-full h-full">
            {/**Stock list */}
            {((product.Stock && product.Stock.length === 0) ||
              !product.Stock) &&
              !isloading && (
                <div className="w-full rounded-xl border-2 border-dashed border-gray-300 p-10 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-600 grid place-content-center">
                    <VariantStockIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">
                    No stock yet
                  </h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Add a stock entry to set quantities for your variant
                    combinations.
                  </p>
                </div>
              )}
            {isloading ? (
              <NormalSkeleton count={3} width="100%" height="64px" />
            ) : (
              product.Stock &&
              product.Stock.length > 0 && (
                <>
                  <SelectionToolbar
                    total={product.Stock.length}
                    noun={["stock entry", "stock entries"]}
                    selectMode={selectMode}
                    selectedCount={selectedSubs.size}
                    allSelected={allSelected}
                    hasLowStock={lowSubIdx.length > 0}
                    onStart={() => setSelectMode(true)}
                    onToggleAll={toggleSelectAll}
                    onSelectLow={selectLowStock}
                    onCancel={exitSelectMode}
                  />
                  <div className="liststock_container grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto">
                    {product.Stock.map((i, idx) => {
                      const lowStockCount = CountLowStock(i);
                      const totalQty = i.Stockvalue.reduce(
                        (total, s) => total + s.qty,
                        0,
                      );
                      const isSelected = selectMode && selectedSubs.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={
                            selectMode ? () => toggleSelectSub(idx) : undefined
                          }
                          onKeyDown={
                            selectMode
                              ? (e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggleSelectSub(idx);
                                  }
                                }
                              : undefined
                          }
                          role={selectMode ? "checkbox" : undefined}
                          aria-checked={selectMode ? isSelected : undefined}
                          aria-label={
                            selectMode ? `Select stock #${idx + 1}` : undefined
                          }
                          tabIndex={selectMode ? 0 : undefined}
                          className={`stockcard flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                            selectMode
                              ? "cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                              : ""
                          } ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                              : lowStockCount > 0
                                ? "bg-white border-red-200 hover:border-red-300"
                                : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {selectMode && (
                            <span
                              aria-hidden="true"
                              className={`shrink-0 w-5 h-5 rounded-md border-2 grid place-content-center transition-colors ${
                                isSelected
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-3.5 h-3.5"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                Stock #{idx + 1}
                              </h4>
                              {lowStockCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                                  <WarningIcon className="w-3 h-3" />
                                  {lowStockCount} low
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {i.Stockvalue.length} combination
                              {i.Stockvalue.length === 1 ? "" : "s"} ·{" "}
                              {totalQty} in stock
                            </p>
                          </div>
                          {!selectMode && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(idx)}
                                className="h-9 px-4 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                aria-label={`Edit stock #${idx + 1}`}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStock(idx)}
                                disabled={loading}
                                className="h-9 w-9 grid place-content-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                aria-label={`Delete stock #${idx + 1}`}
                              >
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
                                  className="w-4 h-4"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            )}

            {selectMode && isEntryList ? (
              <BulkUpdateBar
                mode={bulkMode}
                setMode={setBulkMode}
                qty={bulkQty}
                onQtyChange={handleBulkQtyChange}
                onApply={handleBulkApply}
                canApply={canApplyBulk}
                loading={loading}
                applyLabel={`Apply to ${affectedCount} combination${affectedCount === 1 ? "" : "s"}`}
              />
            ) : (
              <button
                type="button"
                className="w-full h-11 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                onClick={() => {
                  if (!product.Variant) {
                    errorToast("Please Create Variant");
                    return;
                  }
                  setadded(1);
                  setnew("stockinfo");
                }}
                aria-label="Add new stock"
              >
                <PlusIcon className="w-5 h-5" />
                Add New Stock
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface ColorSelectModal {
  handleAddColor: () => void;
  edit: number;
  open: boolean;
  setopen: (val: boolean) => void;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  color: Colortype;
  name: string;
  setcolor: (value: Colortype | string) => void;
  price?: number;
  qty?: number;
  setprice?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setqty?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export const ColorSelectModal = React.memo(
  ({
    handleAddColor,
    edit,
    setedit,
    color,
    setcolor,
    name,
    open,
    setopen,
    price,
    qty,
    setprice,
    setqty,
  }: ColorSelectModal) => {
    const [colorpicker, setcolorpicker] = useState(false);
    const { isMobile } = useScreenSize();

    // Memoized handlers
    const handleOpenColorPicker = React.useCallback(() => {
      setedit(-1);
      setcolor(Colorinitalize);
      setopen(true);
    }, [setedit, setcolor, setopen]);

    const handleClose = React.useCallback(() => {
      setedit(-1);
      setopen(false);
    }, [setedit, setopen]);

    const handleConfirm = React.useCallback(() => {
      handleAddColor();
      setopen(false);
    }, [handleAddColor, setopen]);

    const handleNameChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setcolor(e.target.value as string);
      },
      [setcolor],
    );

    const handlePriceChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setprice?.(value ? parseFloat(value) : undefined);
      },
      [setprice],
    );

    const handleQtyChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setqty?.(value ? parseInt(value, 10) : undefined);
      },
      [setqty],
    );

    const openColorPickerModal = React.useCallback(() => {
      setcolorpicker(true);
    }, []);

    const closeColorPickerModal = React.useCallback(() => {
      setcolorpicker(false);
    }, []);

    const handleCirclePickerChange = React.useCallback(
      (value: any) => {
        setcolor({ hex: value.hex, rgb: value.rgb as any });
      },
      [setcolor],
    );

    const handleChromePickerChange = React.useCallback(
      (val: any) => {
        setcolor({ hex: val.hex, rgb: val.rgb });
      },
      [setcolor],
    );

    const handleHexCodeChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Regular expression to validate hex color code (#RRGGBB or #RGB)
        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);

        if (!isValidHex) {
          errorToast("Invalid hexcode");
          return;
        }

        setcolor({
          rgb: { r: 0, g: 0, b: 0 },
          hex: value,
        });
      },
      [setcolor],
    );

    const buttonClassName = React.useMemo(
      () =>
        `px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 ${
          open
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md"
        }`,
      [open],
    );

    const buttonText = React.useMemo(
      () => (edit === -1 ? "Confirm" : "Update"),
      [edit],
    );

    const priceValue = React.useMemo(() => price?.toString() ?? "", [price]);

    const qtyValue = React.useMemo(() => qty?.toString() ?? "", [qty]);

    const priceStartContent = React.useMemo(
      () => (
        <div className="pointer-events-none flex items-center">
          <span className="text-default-400 text-small">$</span>
        </div>
      ),
      [],
    );
    return (
      <>
        <button
          onClick={handleOpenColorPicker}
          className={buttonClassName}
          disabled={open}
        >
          <span className="flex items-center gap-3">
            <AddIcon />
            Add Color
          </span>
        </button>
        {open && (
          <SecondaryModal
            open={open}
            size={isMobile ? "full" : "3xl"}
            placement={isMobile ? "top" : "center"}
            onPageChange={handleClose}
            closebtn
            footer={() => {
              return (
                <PrimaryButton
                  text={buttonText}
                  type="button"
                  onClick={handleConfirm}
                  disable={color.hex === ""}
                  width="100%"
                  textsize="13px"
                  radius="10px"
                  height="35px"
                />
              );
            }}
          >
            <form className="w-full h-fit bg-white flex flex-col items-center justify-center gap-y-3 p-3">
              <Input
                type="text"
                fullWidth
                size="lg"
                label="Name"
                onChange={handleNameChange}
                value={name}
                required
              />

              <div className="w-full flex flex-row gap-3">
                <Input
                  type="number"
                  fullWidth
                  size="lg"
                  label="Price (Optional)"
                  placeholder="0.00"
                  value={priceValue}
                  onChange={handlePriceChange}
                  startContent={priceStartContent}
                />
                <Input
                  type="number"
                  fullWidth
                  size="lg"
                  label="Quantity (Optional)"
                  placeholder="0"
                  value={qtyValue}
                  onChange={handleQtyChange}
                  min="0"
                />
              </div>

              <label
                htmlFor="color"
                className="font-semibold text-sm w-full text-left"
              >
                Color
                <strong className="text-red-400 text-lg font-normal">*</strong>
              </label>
              <div
                onClick={openColorPickerModal}
                className="w-full h-24 relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg border-4 border-gray-300 hover:border-blue-500 hover:scale-[1.02]"
              >
                <div
                  className="w-full h-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                ></div>
                <Chip
                  className="absolute top-1"
                  hidden={!color.hex}
                  title={color.hex}
                  size="sm"
                >
                  {color.hex}
                </Chip>
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-opacity-0 ${color.hex ? `bg-[${color.hex}]` : ""} group-hover:bg-opacity-30 transition-all duration-300`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                    <svg
                      className="w-7 h-7 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {colorpicker && (
                <SecondaryModal
                  onPageChange={setcolorpicker}
                  footer={() => {
                    return (
                      <PrimaryButton
                        text="Close"
                        color="lightcoral"
                        type="button"
                        radius="10px"
                        onClick={closeColorPickerModal}
                        width="100%"
                        textsize="10px"
                        height="30px"
                      />
                    );
                  }}
                  open={colorpicker}
                  size={"2xl"}
                  placement={isMobile ? "top" : "center"}
                >
                  <div className="w-full h-full flex flex-col items-center gap-y-8 justify-center p-6 bg-gray-50 rounded-2xl">
                    <div className="w-full h-fit flex flex-col gap-6 items-center bg-white p-6 rounded-2xl border border-gray-200">
                      <CirclePicker
                        color={color.hex}
                        onChange={handleCirclePickerChange}
                      />
                      <ChromePicker
                        color={color.hex}
                        onChange={handleChromePickerChange}
                        disableAlpha
                      />
                    </div>

                    <Input
                      className="w-full h-10 max-small_phone:text-2xl text-lg"
                      type="text"
                      label="Hex Code"
                      value={color.hex}
                      size="lg"
                      onChange={handleHexCodeChange}
                    />
                  </div>
                </SecondaryModal>
              )}
            </form>
          </SecondaryModal>
        )}
      </>
    );
  },
);
ColorSelectModal.displayName = "ColorSelectModal";
