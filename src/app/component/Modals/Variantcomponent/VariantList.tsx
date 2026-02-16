"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  VariantSectionType,
  Varianttype,
  VariantValueObjType,
} from "@/src/types/product.type";

interface VariantListProps {
  variants: Array<Varianttype>;
  variantSections?: Array<VariantSectionType>;
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
  selectedForDelete?: Set<number>;
  onToggleDeleteSelection?: (variantId: number) => void;
  showDeleteCheckbox?: boolean;
}

// Memoize individual variant item for better performance
const VariantItem = memo(
  ({
    obj,
    idx,
    sectionName,
    onEdit,
    onDelete,
    isSelected,
    onToggleSelection,
    showCheckbox,
  }: {
    obj: Varianttype;
    idx: number;
    sectionName: string | null | undefined;
    onEdit: (idx: number) => void;
    onDelete: (idx: number) => void;
    isSelected?: boolean;
    onToggleSelection?: () => void;
    showCheckbox?: boolean;
  }) => {
    return (
      <motion.div
        initial={{ x: "-120%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        key={idx}
        className={`relative varaint_container w-[90%] max-small_phone:w-full h-fit border-2 rounded-xl p-4 shadow-xs hover:shadow-lg transition-all duration-300 bg-linear-to-br from-white to-gray-50 ${
          isSelected
            ? "border-red-400 bg-red-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
      >
        <div className="flex flex-row items-center justify-between mb-3">
          {showCheckbox && (
            <div className="flex items-center mr-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                className="w-5 h-5 text-red-600 border-gray-300 rounded-sm focus:ring-red-500 cursor-pointer"
              />
            </div>
          )}
          <div className="flex-1 flex flex-row items-center justify-between">
            <h3 className="variant_name font-semibold text-xl text-gray-800 w-fit h-fit capitalize">
              {obj.option_title === "" ? "No Name" : obj.option_title}
            </h3>
            <div className="flex items-center gap-2">
              {sectionName && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 border border-purple-300">
                  {sectionName}
                </span>
              )}
              {obj.optional && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                  Optional
                </span>
              )}
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                {obj.option_type === "COLOR" ? "Color" : "Text"}
              </span>
            </div>
          </div>
        </div>
        <motion.div className="varaints flex flex-row flex-wrap gap-3 w-full items-center mb-4">
          {obj.option_type === "TEXT" &&
            obj.option_value.map((item, idx) => (
              <div
                key={idx}
                className="min-w-[40px] h-fit max-w-full wrap-break-word font-normal text-base px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
              >
                {typeof item === "string" ? item : item.val}
              </div>
            ))}
          {obj.option_type === "COLOR" &&
            obj.option_value.map((item, idx) => {
              const data = item as VariantValueObjType;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div
                    style={{ backgroundColor: data.val }}
                    className="w-[36px] h-[36px] rounded-full border-2 border-white shadow-md group-hover:scale-110 transition-transform duration-200"
                  ></div>
                  {data.name && (
                    <span className="text-xs text-gray-600 font-medium">
                      {data.name}
                    </span>
                  )}
                </div>
              );
            })}
        </motion.div>
        <div className="action flex flex-row items-center w-full h-fit gap-x-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => onEdit(idx)}
            className="edit text-sm font-medium cursor-pointer px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-xs hover:shadow-md"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(idx)}
            className="delete text-sm font-medium cursor-pointer px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-all duration-200 shadow-xs hover:shadow-md"
          >
            Delete
          </button>
        </div>
      </motion.div>
    );
  },
);

VariantItem.displayName = "VariantItem";

export const VariantList: React.FC<VariantListProps> = memo(
  ({
    variants,
    variantSections,
    onEdit,
    onDelete,
    selectedForDelete,
    onToggleDeleteSelection,
    showDeleteCheckbox = false,
  }) => {
    const getSectionName = (sectionId?: number) => {
      if (!sectionId || !variantSections) return null;
      const section = variantSections.find((s) => s.id === sectionId);
      return section?.name;
    };

    return (
      <>
        {variants.map((obj, idx) => {
          const sectionName = getSectionName(obj.sectionId);
          const variantId = obj.id ?? obj.tempId ?? 0;
          const isSelected = selectedForDelete?.has(variantId) ?? false;
          return (
            <VariantItem
              key={obj.id ?? obj.tempId ?? idx}
              obj={obj}
              idx={idx}
              sectionName={sectionName}
              onEdit={onEdit}
              onDelete={onDelete}
              isSelected={isSelected}
              onToggleSelection={
                onToggleDeleteSelection && variantId
                  ? () => onToggleDeleteSelection(variantId)
                  : undefined
              }
              showCheckbox={showDeleteCheckbox}
            />
          );
        })}
      </>
    );
  },
);

VariantList.displayName = "VariantList";
