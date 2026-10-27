"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { StockCard } from "../Stock";
import { useMemo, memo, useCallback } from "react";
import {
  SubStockType,
  VariantValueObjType,
  Varianttype,
} from "@/src/types/product.type";
import { LowStockIcon, EmptyBoxIcon } from "../../svg";

interface RenderStockCardsProps {
  handleDeleteSubStock: (idx: number) => void;
  edit: number;
  handleSubStockClick: (val: string[], qty: string, idx: number) => void;
  /** When true, clicking a card toggles its selection instead of editing it. */
  selectMode?: boolean;
  selected?: Set<number>;
  onToggleSelect?: (idx: number) => void;
}

export const LOW_STOCK_LIMIT = parseInt(
  process.env.NEXT_PUBLIC_LOWSTOCK ?? "3",
  10,
);

// Memoized individual stock card item for better performance
const StockCardItem = memo(
  ({
    stockItem,
    idx,
    variantLookup,
    handleDeleteSubStock,
    handleSubStockClick,
    selectMode,
    isSelected,
    onToggleSelect,
  }: {
    stockItem: SubStockType;
    idx: number;
    variantLookup: { [key: string]: Varianttype };
    handleDeleteSubStock: (idx: number) => void;
    handleSubStockClick: (val: string[], qty: string, idx: number) => void;
    selectMode: boolean;
    isSelected: boolean;
    onToggleSelect?: (idx: number) => void;
  }) => {
    const isLowStock = stockItem.qty <= LOW_STOCK_LIMIT;

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        handleDeleteSubStock(idx);
      },
      [idx, handleDeleteSubStock],
    );

    const handleClick = useCallback(() => {
      if (selectMode) {
        onToggleSelect?.(idx);
        return;
      }
      handleSubStockClick(stockItem.variant_val, stockItem.qty.toString(), idx);
    }, [
      selectMode,
      onToggleSelect,
      stockItem.variant_val,
      stockItem.qty,
      idx,
      handleSubStockClick,
    ]);

    // Pre-filter and compute variant data
    const variantItems = useMemo(() => {
      return stockItem.variant_val
        ?.filter((val) => val !== "")
        .map((item) => {
          const variant = variantLookup[item];
          if (!variant) return null;

          const isColor =
            variant.option_type === "COLOR"
              ? (variant.option_value as VariantValueObjType[])
              : undefined;

          return {
            item,
            label:
              variant.option_type === "COLOR"
                ? (isColor?.find((opt) => opt.val === item)?.name ?? item)
                : item,
            color: isColor ? item : undefined,
          };
        })
        .filter(Boolean);
    }, [stockItem.variant_val, variantLookup]);

    const borderClass = isSelected
      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
      : isLowStock
        ? "border-red-300 bg-red-50/60 hover:border-red-400"
        : "border-gray-200 bg-white hover:border-gray-400";

    return (
      <div
        onClick={handleClick}
        className={`group relative w-full h-full flex flex-col gap-y-2 rounded-xl p-3 border-2 cursor-pointer transition-colors duration-150 outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${borderClass}`}
        role={selectMode ? "checkbox" : "button"}
        aria-checked={selectMode ? isSelected : undefined}
        tabIndex={0}
        aria-label={`Combination ${idx + 1}, quantity ${stockItem.qty}${isLowStock ? ", low stock" : ""}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {variantItems?.map((variantData, variantIdx) =>
              variantData ? (
                <StockCard
                  key={`${idx}-${variantIdx}-${variantData.item}`}
                  label={variantData.label}
                  color={variantData.color}
                />
              ) : null,
            )}
          </div>

          {selectMode ? (
            <span
              aria-hidden="true"
              className={`shrink-0 w-5 h-5 rounded-md border-2 grid place-content-center transition-colors ${
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            >
              {isSelected && (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              aria-label={`Delete combination ${idx + 1}`}
              className="shrink-0 w-7 h-7 -mt-1 -mr-1 rounded-md grid place-content-center text-gray-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm text-gray-500">
            Qty{" "}
            <span
              className={`font-semibold ${
                isLowStock ? "text-red-600" : "text-gray-900"
              }`}
            >
              {stockItem.qty}
            </span>
          </span>
          {isLowStock && (
            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <LowStockIcon />
              Low
            </span>
          )}
        </div>
      </div>
    );
  },
);

StockCardItem.displayName = "StockCardItem";

const RenderStockCards = memo(
  ({
    edit,
    handleDeleteSubStock,
    handleSubStockClick,
    selectMode = false,
    selected,
    onToggleSelect,
  }: RenderStockCardsProps) => {
    const { product } = useGlobalContext();

    const stockValues = useMemo(
      () =>
        product?.Stock?.[edit]?.Stockvalue as unknown as
          | SubStockType[]
          | undefined,
      [product?.Stock, edit],
    );

    const variantLookup = useMemo(() => {
      if (!product?.Variant) return {};

      return product.Variant.reduce(
        (acc, variant) => {
          variant.option_value.forEach((opt) => {
            const key = typeof opt === "string" ? opt : opt.val;
            if (key) acc[key] = variant;
          });
          return acc;
        },
        {} as { [key: string]: Varianttype },
      );
    }, [product?.Variant]);

    if (!product || !product.Variant || !stockValues?.length) {
      return (
        <div className="w-full text-center py-10 text-gray-500">
          <EmptyBoxIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No combinations in this stock entry yet.</p>
        </div>
      );
    }

    return (
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stockValues.map((stockItem, idx) => (
          <StockCardItem
            key={`stock-${edit}-${idx}`}
            stockItem={stockItem}
            idx={idx}
            variantLookup={variantLookup}
            handleDeleteSubStock={handleDeleteSubStock}
            handleSubStockClick={handleSubStockClick}
            selectMode={selectMode}
            isSelected={!!selected?.has(idx)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    );
  },
);

RenderStockCards.displayName = "RenderStockCards";

export default RenderStockCards;
