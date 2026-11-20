"use client";

import { VariantValueObjType } from "@/src/types/product.type";

interface OptionPickerProps {
  label: string;
  type: "COLOR" | "TEXT";
  data: Array<string | VariantValueObjType>;
  selected?: string;
  onSelect: (value: string) => void;
}

/** Option buttons for one variant (radio group; click again to unselect). */
export function OptionPicker({
  label,
  type,
  data,
  selected,
  onSelect,
}: OptionPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {data.map((opt, idx) => {
        const value = typeof opt === "string" ? opt : opt.val;
        const name = typeof opt === "string" ? opt : (opt.name ?? opt.val);
        const price =
          typeof opt !== "string" && opt.price ? parseFloat(opt.price) : 0;
        const isSelected = selected === value;

        return (
          <button
            key={`${value}-${idx}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(value)}
            title={name}
            className={`relative inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-4 focus-visible:ring-gray-300 ${
              isSelected
                ? type === "COLOR"
                  ? "border-gray-900 ring-1 ring-gray-900 bg-white text-gray-900"
                  : "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-800 hover:border-gray-500"
            } cursor-pointer`}
          >
            {type === "COLOR" && (
              <span
                aria-hidden
                className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: value }}
              />
            )}
            <span>{name}</span>
            {price > 0 && (
              <span
                className={`text-xs font-normal ${
                  isSelected && type !== "COLOR"
                    ? "text-gray-300"
                    : "text-gray-500"
                }`}
              >
                +${price.toFixed(2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
