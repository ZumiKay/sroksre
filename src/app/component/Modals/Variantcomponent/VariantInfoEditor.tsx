"use client";
import React, { useState } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import PrimaryButton from "../../Button";
import { ColorVariantEditor } from "./ColorVariantEditor";
import { TextVariantEditor } from "./TextVariantEditor";
import { ModalOpenState } from "../types";
import {
  VariantTypeEnum,
  VariantSectionType,
  VariantValueObjType,
} from "@/src/types/product.type";
import { UseVariantManagerReturn } from "./hooks/useVariantManager";

interface VariantInfoEditorProps {
  variantManager: UseVariantManagerReturn;
  variantSectionId?: number;
  open: ModalOpenState;
  setOpen: React.Dispatch<React.SetStateAction<ModalOpenState>>;
  setNew: React.Dispatch<React.SetStateAction<any>>;
  onColorSelect: (idx: number, selectType: "color" | "text") => void;
  onUpdateOption: (e: React.FormEvent<HTMLFormElement>) => void;
  onCreate: ({
    setloading,
  }: {
    setloading?: (val: boolean) => void;
  }) => Promise<void>;
  price?: number;
  setPrice: React.Dispatch<React.SetStateAction<number | undefined>>;
  optional: boolean;
  setOptional: React.Dispatch<React.SetStateAction<boolean>>;
  setVariantSectionId: React.Dispatch<React.SetStateAction<number | undefined>>;
  variantSections?: Array<VariantSectionType>;
}

export const VariantInfoEditor: React.FC<VariantInfoEditorProps> = ({
  variantManager,
  variantSectionId,
  setVariantSectionId,
  open,
  setOpen,
  setNew,
  onColorSelect,
  onUpdateOption,
  onCreate,
  price,
  setPrice,
  optional,
  setOptional,
  variantSections,
}) => {
  const [loading, setloading] = useState(false);
  const handleBack = () => {
    //Reset State
    variantManager.setEdit(-1);
    variantManager.setName("");
    variantManager.setTemp(undefined);
    setNew(variantManager.added === -1 ? "type" : "variant");
  };

  const handleCancel = () => {
    variantManager.setEdit(-1);
    variantManager.setName("");
    variantManager.setTemp(undefined);
  };

  const handleSetAllOptionPrice = (val: string) => {
    variantManager.setTemp((prev) => {
      if (!prev?.value) return prev;

      return {
        ...prev,
        value: (prev.value as Array<string | VariantValueObjType>).map(
          (item) => {
            // If it's a string, convert to object with price
            if (typeof item === "string") {
              return {
                val: item,
                price: val,
              };
            }
            // If it's already an object, update the price
            return {
              ...item,
              price: val,
            };
          },
        ),
      };
    });
  };

  const checkForDifferentPrices = (): boolean => {
    if (!variantManager.temp?.value || variantManager.temp.value.length === 0) {
      return false;
    }

    const prices = (
      variantManager.temp.value as Array<string | VariantValueObjType>
    )
      .map((item) => {
        if (typeof item === "string") return undefined;
        return item.price;
      })
      .filter((price) => price !== undefined && price !== "");

    if (prices.length <= 1) return false;

    const firstPrice = prices[0];
    return prices.some((price) => price !== firstPrice);
  };

  const getOptionsWithPrices = (): Array<{ name: string; price: string }> => {
    if (!variantManager.temp?.value) return [];

    const allOptionsWithPrices = (
      variantManager.temp.value as Array<string | VariantValueObjType>
    )
      .map((item) => {
        if (typeof item === "string") {
          return null;
        }
        if (item.price && item.price !== "") {
          return {
            name: item.name || item.val,
            price: item.price,
          };
        }
        return null;
      })
      .filter((item): item is { name: string; price: string } => item !== null);

    // Only show options if there are different prices
    if (allOptionsWithPrices.length <= 1) return [];

    // Get unique prices
    const uniquePrices = Array.from(
      new Set(allOptionsWithPrices.map((opt) => opt.price)),
    );

    // If all prices are the same, don't show anything
    if (uniquePrices.length === 1) return [];

    // Return all options with prices since they differ
    return allOptionsWithPrices;
  };

  const hasDifferentPrices = checkForDifferentPrices();
  const optionsWithPrices = getOptionsWithPrices();

  return (
    <div className="addcontainer w-[95%] h-full flex flex-col gap-y-6 rounded-xl bg-white shadow-xs border border-gray-200 p-6">
      {variantSectionId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <svg
            className="w-5 h-5 text-blue-600 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-blue-700 font-medium">
            This variant will be automatically added to the selected variant
            section
          </p>
        </div>
      )}

      {variantSections && variantSections.length > 0 && (
        <Select
          label="Variant Section (Optional)"
          placeholder="Select a variant section or leave empty"
          selectedKeys={variantSectionId ? [variantSectionId.toString()] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];
            setVariantSectionId(selected ? Number(selected) : undefined);
          }}
          size="lg"
          className="w-full"
          classNames={{
            trigger: "bg-white border-gray-300",
          }}
        >
          {variantSections.map((section) => (
            <SelectItem key={section.id?.toString() ?? ""}>
              {section.name}
            </SelectItem>
          ))}
        </Select>
      )}

      <Input
        name="name"
        type="text"
        label="Variant Name"
        value={variantManager.name}
        onChange={(e) => variantManager.setName(e.target.value)}
        size="lg"
        className="w-full"
      />

      {/* Price Input */}
      <Input
        name="price"
        type="number"
        label="Price (All options)"
        placeholder="Price For All Options (0.00)"
        isDisabled={
          !variantManager.temp?.value || variantManager.temp?.value.length == 0
        }
        value={price?.toString() ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          setPrice(value ? parseFloat(value) : undefined);
          // Set price for all options when value changes
          if (value) {
            handleSetAllOptionPrice(value);
          }
        }}
        size="lg"
        className="w-full"
        startContent={
          <div className="pointer-events-none flex items-center">
            <span className="text-default-400 text-small">$</span>
          </div>
        }
      />

      {/* Warning for different prices */}
      {hasDifferentPrices && (
        <div className="flex flex-col gap-2 p-4 bg-amber-50 rounded-lg border border-amber-300">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-600 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-800 font-medium">
              Warning: Your options have different prices. Setting a price above
              will override all individual option prices.
            </p>
          </div>
          <div className="ml-7 mt-1">
            <p className="text-xs text-amber-700 font-semibold mb-1">
              Options with prices:
            </p>
            <ul className="space-y-1">
              {optionsWithPrices.map((option, idx) => (
                <li
                  key={idx}
                  className="text-xs text-amber-800 flex items-center gap-2"
                >
                  <span className="font-medium">{option.name}:</span>
                  <span className="font-semibold">${option.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Optional Checkbox */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="checkbox"
          id="variant-optional"
          checked={optional}
          onChange={(e) => setOptional(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2 cursor-pointer"
        />
        <label
          htmlFor="variant-optional"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          Mark as optional (customers can skip this variant)
        </label>
      </div>

      {variantManager.temp &&
      variantManager.temp.type === VariantTypeEnum.color ? (
        <ColorVariantEditor
          variantManager={variantManager}
          open={open}
          localGlobalPrice={price}
          setOpen={setOpen}
          onColorSelect={onColorSelect}
        />
      ) : (
        <TextVariantEditor
          variantManager={variantManager}
          localGlobalPrice={price}
          open={open}
          setOpen={setOpen}
          onTextSelect={onColorSelect}
          onUpdateOption={onUpdateOption}
        />
      )}

      <div className="flex flex-row gap-x-3 w-full h-8.75">
        <PrimaryButton
          text={`${variantManager.added === -1 ? "Create" : "Update"}`}
          type="button"
          disable={
            variantManager.name === "" ||
            variantManager.temp?.value.length === 0 ||
            loading
          }
          textsize="12px"
          status={loading ? "loading" : "authenticated"}
          onClick={() => onCreate({ setloading })}
          radius="10px"
          width="100%"
          height="100%"
        />
        <PrimaryButton
          text="Back"
          color="lightcoral"
          type="button"
          textsize="12px"
          onClick={handleBack}
          disable={loading}
          radius="10px"
          width="100%"
          height="100%"
        />
        <PrimaryButton
          text="Cancel"
          color="#6B7280"
          type="button"
          disable={loading}
          textsize="12px"
          onClick={handleCancel}
          radius="10px"
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};
