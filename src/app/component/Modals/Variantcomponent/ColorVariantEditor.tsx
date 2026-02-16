"use client";
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@heroui/react";
import { ColorSelectModal } from "../VariantModalComponent";
import { VariantValueObjType } from "@/src/types/product.type";
import { ModalOpenState } from "../types";
import { ColorSelectIcon } from "../../svg/icons";

interface ColorVariantEditorProps {
  variantManager: any;
  open: ModalOpenState;
  localGlobalPrice?: number;
  setOpen: React.Dispatch<React.SetStateAction<ModalOpenState>>;
  onColorSelect: (idx: number, selectType: "color" | "text") => void;
}

export const ColorVariantEditor: React.FC<ColorVariantEditorProps> = ({
  variantManager,
  localGlobalPrice,
  open,
  setOpen,
  onColorSelect,
}) => {
  return (
    <div className="color_container w-full h-fit flex flex-col gap-y-5">
      <ColorSelectModal
        handleAddColor={variantManager.addColor}
        edit={variantManager.edit}
        setedit={variantManager.setEdit}
        open={open.addcolor}
        setopen={(val) => setOpen((prev) => ({ ...prev, addcolor: val }))}
        color={variantManager.colorData.color}
        name={variantManager.colorData.name}
        price={localGlobalPrice ?? variantManager.colorData.price}
        qty={variantManager.colorData.qty}
        setcolor={(val) => {
          if (typeof val === "string") {
            variantManager.setColorData((prev: any) => ({
              ...prev,
              name: val,
            }));
          } else {
            variantManager.setColorData((prev: any) => ({
              ...prev,
              color: val,
            }));
          }
        }}
        setprice={(val) => {
          variantManager.setColorData((prev: any) => ({
            ...prev,
            price: val,
          }));
        }}
        setqty={(val) => {
          variantManager.setColorData((prev: any) => ({
            ...prev,
            qty: val,
          }));
        }}
      />

      <div className="listcolor flex flex-row flex-wrap gap-4 w-full">
        {variantManager.temp?.value?.some((i: any) => i !== "") ? (
          variantManager.temp?.value?.map((color: any, idx: number) => {
            const val = color as VariantValueObjType;
            return (
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
                    className="w-fit h-[56px] rounded-xl flex flex-row justify-center items-center gap-x-3 cursor-pointer px-4 transition-all duration-200 bg-gray-50 hover:bg-gray-100 active:scale-95 border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                    onClick={() => onColorSelect(idx, "color")}
                  >
                    <div
                      className="color w-[36px] h-[36px] rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: val.val }}
                    ></div>
                    {val.name && (
                      <p className="w-fit h-fit text-base font-medium text-gray-700">
                        {val.name}
                      </p>
                    )}
                  </div>
                </Badge>
              </motion.div>
            );
          })
        ) : (
          <div className="w-full text-center py-8 text-gray-400">
            <ColorSelectIcon />
            <p className="text-sm font-medium">No colors added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
