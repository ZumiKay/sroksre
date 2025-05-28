import { useGlobalContext } from "@/src/context/GlobalContext";
import { motion } from "framer-motion";
import { NormalSkeleton } from "../Banner";
import React, { memo, useCallback } from "react";
import {
  VariantColorValueType,
  Variantcontainertype,
  Varianttype,
} from "@/src/context/GlobalType.type";
import { variantdatatype } from "./VariantModal";
import { SecondaryModal } from "../Modals";
import { errorToast } from "../Loading";
import PrimaryButton from "../Button";
import { Form, Input } from "@heroui/react";
import { VariantIcon } from "../Icons/VariantComponent";

type VariantTypeSectionProps = {
  loading: boolean;
  settemp: React.Dispatch<React.SetStateAction<variantdatatype | undefined>>;
  setname: React.Dispatch<React.SetStateAction<string>>;
  setadded: React.Dispatch<React.SetStateAction<number>>;
  setnew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
};

export const VariantTypeSection = memo(
  ({
    loading,
    settemp,
    setname,
    setadded,
    setnew,
  }: VariantTypeSectionProps) => {
    const { product, setproduct } = useGlobalContext();

    const handleVariantEdit = useCallback(
      (idx: number) => {
        if (product.variants) {
          const variantToEdit = product.variants[idx];
          if (variantToEdit) {
            setname(variantToEdit.option_title);
            settemp({
              name: variantToEdit.option_title,
              value: [...variantToEdit.option_value],
              type: variantToEdit.option_type as "COLOR" | "TEXT",
            });

            setadded(idx);
            setnew("info");

            if (product.varaintstock) {
              let updatedStock = [...product.varaintstock];
              updatedStock = updatedStock.map((stock) => {
                const updatedVariantValues = stock.Stockvalue.map(
                  (val, valIdx) => {
                    const currentVariant =
                      product.variants && product.variants[valIdx];
                    if (!currentVariant) return val;

                    const variantValue = currentVariant.option_value;
                    return val.variant_val.map((v, vIdx) => {
                      const newValue = variantValue[vIdx];
                      return newValue
                        ? typeof newValue === "string"
                          ? newValue
                          : newValue.val
                        : v;
                    }) as string[];
                  }
                );

                return {
                  ...stock,
                  variant_val: updatedVariantValues,
                };
              });

              setproduct((prev) => ({
                ...prev,
                varaintstock: updatedStock,
              }));
            }
          }
        }
      },
      [
        product.variants,
        product.varaintstock,
        setname,
        settemp,
        setadded,
        setnew,
        setproduct,
      ]
    );
    const handleVariantDelete = useCallback(
      (idx: number) => {
        const { variants, varaintstock } = product;
        if (!variants || idx < 0 || idx >= variants.length) return;

        const updatedVariants = variants.filter((_, i) => i !== idx);

        if (varaintstock) {
          let updatedStock = [...varaintstock];

          updatedStock = updatedStock.filter((stock) => {
            const match = stock.Stockvalue.every((val, valIdx) => {
              const currentVariant = updatedVariants[valIdx];
              if (!currentVariant) return false;

              const variantValue = currentVariant.option_value;
              return variantValue.some(
                (v) =>
                  (typeof v === "string" ? val.variant_val : v.val) ===
                  val.variant_val
              );
            });

            return !match;
          });

          setproduct((prev) => ({
            ...prev,
            variants: updatedVariants,
            varaintstock: updatedStock,
          }));
        } else {
          setproduct((prev) => ({
            ...prev,
            variants: updatedVariants,
          }));
        }

        setnew("variant");
      },
      [product, setnew, setproduct]
    );

    const ColorRender = useCallback((obj: Varianttype) => {
      return (
        obj.option_type === "COLOR" &&
        obj.option_value.map((item, idx) => {
          const data = item as VariantColorValueType;
          return (
            <div
              key={idx}
              style={{ backgroundColor: data.val }}
              className="w-[30px] h-[30px] rounded-3xl"
            ></div>
          );
        })
      );
    }, []);
    const TextRender = useCallback((obj: Varianttype) => {
      return (
        obj.option_type === "TEXT" &&
        obj.option_value.map((item, idx) => (
          <div
            key={idx}
            className="min-w-[40px] h-fit max-w-full break-words font-normal text-lg"
          >
            {item.toString()}
          </div>
        ))
      );
    }, []);
    return (
      <div className="w-full flex flex-col items-center gap-y-6 py-4">
        {/* Empty State */}
        {(product.variants?.length === 0 || !product.variants) && (
          <div className="w-[90%] py-6 px-4 rounded-lg border border-dashed border-gray-300 bg-gray-50">
            <div className="flex flex-col items-center justify-center text-center">
              <VariantIcon />
              <h3 className="text-lg font-medium text-gray-500">
                No Variants Added
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Create variants to define product options
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <NormalSkeleton count={3} width="90%" height="fit-content" />
        ) : (
          /* Variants List */
          <div className="w-full space-y-4 px-4">
            {product.variants &&
              product.variants.map((obj, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  key={idx}
                  className="variant-card relative w-full bg-white rounded-xl shadow-sm 
                      hover:shadow-md transition-all duration-200 overflow-hidden
                      border border-gray-100 hover:border-blue-200"
                >
                  {/* Variant Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {obj.option_title === ""
                        ? "Unnamed Variant"
                        : obj.option_title}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVariantEdit(idx)}
                        className="edit-btn flex items-center gap-1.5 px-3 py-1.5 text-sm 
                            bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 
                            transition-colors duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleVariantDelete(idx)}
                        className="delete-btn flex items-center gap-1.5 px-3 py-1.5 text-sm 
                            bg-red-50 text-red-600 rounded-md hover:bg-red-100 
                            transition-colors duration-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Variant Options */}
                  <div className="p-4">
                    <motion.div
                      className="flex flex-row flex-wrap gap-3 w-full items-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {/* Text and Color Renderers */}
                      <div className="options-container space-y-3 w-full">
                        <TextRender {...obj} />
                        <ColorRender {...obj} />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    );
  }
);
VariantTypeSection.displayName = "VariantTypeSection";

type VriantOptionModalProps = {
  open: boolean;
  temp?: variantdatatype;
  option: string;
  edit: number;
  setedit: React.Dispatch<React.SetStateAction<number>>;
  setoption: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
};

export const VariantOptionModal = ({
  open,
  temp,
  option,
  edit,
  setedit,
  onClose,
  setoption,
}: VriantOptionModalProps) => {
  const { product } = useGlobalContext();

  const handleUpdateVariantOption = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const update = { ...temp };
      const variant = [...(product.variants ?? [])];

      const isExist =
        variant &&
        variant
          .filter((fil) => fil.option_type === "TEXT")
          .some((i) => i.option_value.includes(option));

      if (isExist) {
        errorToast("Option Exist");
        return;
      }
      if (edit === -1) {
        update.value?.push(option);
      } else if (update.value) {
        update.value[edit] = option;
        setedit(-1);
      }
      onClose();
    },
    [edit, onClose, option, product.variants, setedit, temp]
  );

  return (
    <SecondaryModal
      closebtn
      open={open}
      onPageChange={() => onClose()}
      size="sm"
      placement="top"
    >
      <Form
        onSubmit={(e) => handleUpdateVariantOption(e)}
        className="addoption w-full h-1/3
       max-smallest_phone:w-[275px]
      bg-white p-3 flex flex-col gap-y-5 
      items-center justify-center rounded-md"
      >
        <Input
          name="option"
          aria-label="option"
          placeholder="Option (Required)"
          type="text"
          value={option}
          isRequired
          errorMessage="Option is required"
          onChange={(e) => setoption(e.target.value)}
          className="font-bold w-full"
          size="lg"
        />

        <PrimaryButton
          text={edit === -1 ? "Create" : "Update"}
          color="#35C191"
          type="submit"
          disable={option === ""}
          width="100%"
          textsize="12px"
          radius="10px"
          height="35px"
        />
      </Form>
    </SecondaryModal>
  );
};
