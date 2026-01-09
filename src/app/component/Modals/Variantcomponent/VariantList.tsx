import React from "react";
import { motion } from "framer-motion";
import { VariantColorValueType } from "@/src/context/GlobalContext";

interface Variant {
  option_title: string;
  option_type: "COLOR" | "TEXT";
  option_value: Array<string | VariantColorValueType>;
}

interface VariantListProps {
  variants: Variant[];
  onEdit: (idx: number) => void;
  onDelete: (idx: number) => void;
}

export const VariantList: React.FC<VariantListProps> = ({
  variants,
  onEdit,
  onDelete,
}) => {
  return (
    <>
      {variants.map((obj, idx) => (
        <motion.div
          initial={{ x: "-120%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          key={idx}
          className="relative varaint_container w-[90%] max-small_phone:w-[100%] h-fit border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
        >
          <div className="flex flex-row items-center justify-between mb-3">
            <h3 className="variant_name font-semibold text-xl text-gray-800 w-fit h-fit capitalize">
              {obj.option_title === "" ? "No Name" : obj.option_title}
            </h3>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
              {obj.option_type === "COLOR" ? "Color" : "Text"}
            </span>
          </div>
          <motion.div className="varaints flex flex-row flex-wrap gap-3 w-full items-center mb-4">
            {obj.option_type === "TEXT" &&
              obj.option_value.map((item, idx) => (
                <div
                  key={idx}
                  className="min-w-[40px] h-fit max-w-full break-words font-normal text-base px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors duration-200"
                >
                  {item.toString()}
                </div>
              ))}
            {obj.option_type === "COLOR" &&
              obj.option_value.map((item, idx) => {
                const data = item as VariantColorValueType;
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
              className="edit text-sm font-medium cursor-pointer px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(idx)}
              className="edit text-sm font-medium cursor-pointer px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Delete
            </button>
          </div>
        </motion.div>
      ))}
    </>
  );
};
