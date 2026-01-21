"use client";
import React, { FormEvent } from "react";
import { motion } from "framer-motion";
import { Badge, Button } from "@nextui-org/react";
import Modal from "../../Modals";
import { ModalOpenState } from "../types";
import { PlusRoundSignIcon, TextBasedOptionIcon } from "../../svg/icons";

interface TextVariantEditorProps {
  variantManager: any;
  open: ModalOpenState;
  setOpen: React.Dispatch<React.SetStateAction<ModalOpenState>>;
  onTextSelect: (idx: number, selectType: "color" | "text") => void;
  onUpdateOption: (e: FormEvent<HTMLFormElement>) => void;
}

export const TextVariantEditor: React.FC<TextVariantEditorProps> = ({
  variantManager,
  open,
  setOpen,
  onTextSelect,
  onUpdateOption,
}) => {
  return (
    <>
      {open.addoption && (
        <Modal closestate="none" customZIndex={150}>
          <form
            onSubmit={onUpdateOption}
            className="addoption w-[340px] max-smallest_phone:w-[300px] h-fit bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-6 flex flex-col gap-y-6 items-center justify-start rounded-2xl shadow-2xl border-2 border-gray-200/60 backdrop-blur-sm"
          >
            <div className="w-full flex flex-col gap-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {variantManager.edit === -1 ? "Add Option" : "Edit Option"}
              </h3>
              <p className="text-sm text-gray-600">
                {variantManager.edit === -1
                  ? "Create a new variant option"
                  : "Update variant option"}
              </p>
            </div>
            <input
              name="option"
              placeholder="Enter option name..."
              type="text"
              value={variantManager.option}
              onChange={(e) => variantManager.setOption(e.target.value)}
              className="text-base font-semibold px-4 py-3 h-[56px] w-full border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none shadow-sm hover:shadow-md"
            />
            <div className="action-btn flex flex-row w-full gap-x-3">
              <Button
                type="submit"
                isDisabled={variantManager.option === ""}
                className="flex-1 h-12 font-bold text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {variantManager.edit === -1 ? "Create" : "Update"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setOpen((prev) => ({
                    ...prev,
                    addoption: false,
                  }));
                }}
                className="flex-1 h-12 font-bold text-base bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
      <div className="text-container flex flex-col items-start justify-start gap-y-4 w-full">
        <button
          onClick={() => {
            variantManager.setEdit(-1);
            variantManager.setOption("");
            setOpen((prev) => ({ ...prev, addoption: true }));
          }}
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
            variantManager.temp?.value.map((i: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Badge
                  content="×"
                  color="danger"
                  onClick={() => variantManager.deleteValue(idx)}
                  className="cursor-pointer"
                >
                  <div
                    onClick={() => onTextSelect(idx, "text")}
                    className="option text-sm cursor-pointer px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 text-gray-700 font-medium transition-all duration-200 hover:shadow-md hover:border-blue-400 active:scale-95 w-fit h-fit"
                  >
                    {i.toString()}
                  </div>
                </Badge>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
