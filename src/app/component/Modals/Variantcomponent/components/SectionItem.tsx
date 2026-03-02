import { memo } from "react";
import { SectionItemProps } from "../types";

export const SectionItem = memo(
  ({
    section,
    idx,
    product,
    isSelected,
    onToggleSelection,
    onEdit,
    onAddVariant,
    onDelete,
    isDeleting,
  }: SectionItemProps) => {
    const variantCount =
      product.Variant.filter((i: any) => i.sectionId === section.id)?.length ||
      0;

    return (
      <div
        className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border transition-colors ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(section.id || section.tempId)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded-sm focus:ring-blue-500"
          />
          <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
            {idx + 1}
          </span>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{section.name}</p>
            <p className="text-sm text-gray-500">{`${variantCount} variant(s)`}</p>
            {section.Variants && section.Variants.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {section.Variants.slice(0, 3).map((variant, vIdx) => (
                  <span
                    key={vIdx}
                    className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-sm"
                  >
                    {variant.option_title}
                  </span>
                ))}
                {section.Variants.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-0.5">
                    +{section.Variants.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(section.id || section.tempId)}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onAddVariant(section.id || section.tempId)}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            Manage Variants
          </button>
          <button
            onClick={() => section.id && onDelete(section.id)}
            disabled={isDeleting}
            className={`px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isDeleting ? "animate-spinner-linear-spin" : ""}`}
            title="Delete this section"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  },
);

SectionItem.displayName = "SectionItem";
