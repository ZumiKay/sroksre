"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { StockCard } from "../Stock";
import { Badge } from "@heroui/react";
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
}

// Memoized individual stock card item for better performance
const StockCardItem = memo(
  ({
    stockItem,
    idx,
    lowstock,
    variantLookup,
    handleDeleteSubStock,
    handleSubStockClick,
  }: {
    stockItem: SubStockType;
    idx: number;
    lowstock: number;
    variantLookup: { [key: string]: Varianttype };
    handleDeleteSubStock: (idx: number) => void;
    handleSubStockClick: (val: string[], qty: string, idx: number) => void;
  }) => {
    const isLowStock = stockItem.qty <= lowstock;

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        handleDeleteSubStock(idx);
      },
      [idx, handleDeleteSubStock],
    );

    const handleClick = useCallback(() => {
      handleSubStockClick(stockItem.variant_val, stockItem.qty.toString(), idx);
    }, [stockItem.variant_val, stockItem.qty, idx, handleSubStockClick]);

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

    return (
      <Badge
        content="-"
        color="danger"
        classNames={{
          badge: "cursor-pointer hover:scale-110 transition-transform",
        }}
        onClick={handleDelete}
        aria-label="Delete stock item"
      >
        <div
          onClick={handleClick}
          className={`
            w-fit h-fit flex flex-col gap-y-2 rounded-lg p-3 
            border-2 cursor-pointer transition-all duration-200
            shadow-xs hover:shadow-md
            ${
              isLowStock
                ? "border-red-400 bg-red-50/50 hover:border-red-500 hover:bg-red-50"
                : "border-gray-300 bg-white hover:border-gray-500 hover:bg-gray-50"
            }
            active:scale-[0.98]
          `}
          role="button"
          tabIndex={0}
          aria-label={`Stock item ${idx + 1}, quantity: ${stockItem.qty}${isLowStock ? " (Low stock)" : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          {isLowStock && (
            <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
              <LowStockIcon />
              Low Stock
            </div>
          )}
          <div className="flex flex-wrap gap-2">
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
          <div className="text-xs text-gray-600 mt-1 font-medium">
            Qty: {stockItem.qty}
          </div>
        </div>
      </Badge>
    );
  },
);

StockCardItem.displayName = "StockCardItem";

const RenderStockCards = memo(
  ({
    edit,
    handleDeleteSubStock,
    handleSubStockClick,
  }: RenderStockCardsProps) => {
    const { product } = useGlobalContext();

    const stockValues = useMemo(
      () =>
        product?.Stock?.[edit]?.Stockvalue as unknown as
          | SubStockType[]
          | undefined,
      [product?.Stock, edit],
    );

    const lowstock = useMemo(
      () => parseInt(process.env.NEXT_PUBLIC_LOWSTOCK ?? "3"),
      [],
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
        <div className="text-center py-8 text-gray-500">
          <EmptyBoxIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No stock items available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
        {stockValues.map((stockItem, idx) => (
          <StockCardItem
            key={`stock-${edit}-${idx}`}
            stockItem={stockItem}
            idx={idx}
            lowstock={lowstock}
            variantLookup={variantLookup}
            handleDeleteSubStock={handleDeleteSubStock}
            handleSubStockClick={handleSubStockClick}
          />
        ))}
      </div>
    );
  },
);

RenderStockCards.displayName = "RenderStockCards";

export default RenderStockCards;
