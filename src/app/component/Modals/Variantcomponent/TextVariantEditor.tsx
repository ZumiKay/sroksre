"use client";
import React, { FormEvent, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Input } from "@heroui/react";
import Modal from "../../Modals";
import { ModalOpenState } from "../types";
import { PlusRoundSignIcon, TextBasedOptionIcon } from "../../svg/icons";
import { UseVariantManagerReturn } from "./hooks/useVariantManager";
import { VariantValueObjType } from "@/src/types/product.type";

interface TextVariantEditorProps {
  variantManager: UseVariantManagerReturn;
  open: ModalOpenState;
  localGlobalPrice?: number;
  setOpen: React.Dispatch<React.SetStateAction<ModalOpenState>>;
  onTextSelect: (idx: number, selectType: "color" | "text") => void;
  onUpdateOption: (e: FormEvent<HTMLFormElement>) => void;
}

export const TextVariantEditor: React.FC<TextVariantEditorProps> = React.memo(
  ({
    variantManager,
    open,
    setOpen,
    localGlobalPrice,
    onTextSelect,
    onUpdateOption,
  }) => {
    // Memoized handlers
    const handleOptionChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        variantManager.setOption(e.target.value);
      },
      [variantManager],
    );

    const handlePriceChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        variantManager.setOptionPrice(parseFloat(!value ? "0" : value));
      },
      [variantManager],
    );

    const handleQtyChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        variantManager.setOptionQty(value ? parseInt(value, 10) : undefined);
      },
      [variantManager],
    );

    const handleAddOption = useCallback(() => {
      variantManager.setEdit(-1);
      variantManager.setOptionPrice(localGlobalPrice);
      variantManager.setOption("");
      setOpen((prev) => ({ ...prev, addoption: true }));
    }, [localGlobalPrice, variantManager, setOpen]);

    const handleCancel = useCallback(() => {
      setOpen((prev) => ({ ...prev, addoption: false }));
    }, [setOpen]);

    const modalTitle = useMemo(
      () => (variantManager.edit === -1 ? "Add Option" : "Edit Option"),
      [variantManager.edit],
    );

    const modalDescription = useMemo(
      () =>
        variantManager.edit === -1
          ? "Create a new variant option"
          : "Update variant option",
      [variantManager.edit],
    );

    const buttonText = useMemo(
      () => (variantManager.edit === -1 ? "Create" : "Update"),
      [variantManager.edit],
    );

    const qtyValue = useMemo(
      () => variantManager.optionQty?.toString() ?? "",
      [variantManager.optionQty],
    );

    const priceStartContent = useMemo(
      () => (
        <div className="pointer-events-none flex items-center">
          <span className="text-default-400 text-small">$</span>
        </div>
      ),
      [],
    );

    return (
      <>
        {open.addoption && (
          <Modal closestate="none" customZIndex={150}>
            <form
              onSubmit={onUpdateOption}
              className="addoption w-[340px] max-smallest_phone:w-[300px] h-fit bg-linear-to-br from-blue-50/50 via-white to-purple-50/50 p-6 flex flex-col gap-y-6 items-center justify-start rounded-2xl shadow-2xl border-2 border-gray-200/60 backdrop-blur-xs"
            >
              <div className="w-full flex flex-col gap-2">
                <h3 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {modalTitle}
                </h3>
                <p className="text-sm text-gray-600">{modalDescription}</p>
              </div>
              <input
                name="option"
                placeholder="Enter option name..."
                type="text"
                value={variantManager.option}
                onChange={handleOptionChange}
                className="text-base font-semibold px-4 py-3 h-[56px] w-full border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-hidden shadow-xs hover:shadow-md"
              />
              <div className="w-full flex flex-col gap-3">
                <Input
                  type="number"
                  size="lg"
                  label="Price (Optional)"
                  placeholder="0.00"
                  value={variantManager.optionPrice?.toString()}
                  onChange={handlePriceChange}
                  startContent={priceStartContent}
                />
                <Input
                  type="number"
                  size="lg"
                  label="Quantity (Optional)"
                  placeholder="0"
                  value={qtyValue}
                  onChange={handleQtyChange}
                  min="0"
                />
              </div>
              <div className="action-btn flex flex-row w-full gap-x-3">
                <Button
                  type="submit"
                  isDisabled={variantManager.option === ""}
                  className="flex-1 h-12 font-bold text-base bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {buttonText}
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 h-12 font-bold text-base bg-linear-to-r from-gray-600 to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Modal>
        )}
        <div className="text-container flex flex-col items-start justify-start gap-y-4 w-full">
          <button
            onClick={handleAddOption}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-600 font-medium text-sm transition-all duration-200 hover:bg-blue-100 hover:border-blue-400 active:scale-95 flex items-center justify-center gap-2"
          >
            <PlusRoundSignIcon />
            Add Option
          </button>
          <div className="opitonlist flex flex-row gap-3 flex-wrap w-full items-start justify-start h-fit">
            {variantManager.temp?.value.length === 0 ? (
              <div className="w-full text-center py-8 text-gray-400">
                <TextBasedOptionIcon />
                <p className="text-sm font-medium">No options added yet</p>
              </div>
            ) : (
              variantManager.temp?.value.map((i, idx: number) => (
                <OptionItem
                  key={`${idx}-${typeof i === "string" ? i : i.val}`}
                  item={typeof i === "string" ? i : i.val}
                  idx={idx}
                  onDelete={variantManager.deleteValue}
                  onSelect={onTextSelect}
                />
              ))
            )}
          </div>
        </div>
      </>
    );
  },
);

// Memoized option item component
const OptionItem = React.memo<{
  item: any;
  idx: number;
  onDelete: (idx: number) => void;
  onSelect: (idx: number, type: "text") => void;
}>(({ item, idx, onDelete, onSelect }) => {
  const handleDelete = useCallback(() => onDelete(idx), [idx, onDelete]);
  const handleSelect = useCallback(
    () => onSelect(idx, "text"),
    [idx, onSelect],
  );
  const displayValue = useMemo(() => item.toString(), [item]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, delay: idx * 0.05 }}
    >
      <Badge
        content="×"
        color="danger"
        onClick={handleDelete}
        className="cursor-pointer"
      >
        <div
          onClick={handleSelect}
          className="option text-sm cursor-pointer px-4 py-2.5 rounded-lg bg-linear-to-r from-blue-50 to-purple-50 border-2 border-blue-200 text-gray-700 font-medium transition-all duration-200 hover:shadow-md hover:border-blue-400 active:scale-95 w-fit h-fit"
        >
          {displayValue}
        </div>
      </Badge>
    </motion.div>
  );
});
