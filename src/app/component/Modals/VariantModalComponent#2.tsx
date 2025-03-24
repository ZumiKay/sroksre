import { useGlobalContext } from "@/src/context/GlobalContext";
import { motion } from "framer-motion";
import { NormalSkeleton } from "../Banner";
import React, { useCallback } from "react";
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

type VariantTypeSectionProps = {
  loading: boolean;
  settemp: React.Dispatch<React.SetStateAction<variantdatatype | undefined>>;
  setname: React.Dispatch<React.SetStateAction<string>>;
  setadded: React.Dispatch<React.SetStateAction<number>>;
  setnew: React.Dispatch<React.SetStateAction<Variantcontainertype>>;
};

export const VariantTypeSection = ({
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
    [product, setname, settemp, setadded, setnew]
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
    [product]
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
    <div className="w-full flex flex-col items-center gap-y-5">
      {(product.variants?.length === 0 || !product.variants) && (
        <h3 className="text-lg text-gray-500 w-[90%] rounded-lg outline outline-1 outline-gray-500 p-2">
          No Variant
        </h3>
      )}
      {loading ? (
        <NormalSkeleton count={3} width="90%" height="fit-content" />
      ) : (
        product.variants &&
        product.variants.map((obj, idx) => (
          <motion.div
            initial={{ x: "-120%" }}
            animate={{ x: 0 }}
            transition={{
              duration: 0.2,
            }}
            key={idx}
            className="relative varaint_container w-[90%] max-small_phone:w-[100%] h-fit border border-black rounded-lg p-2"
          >
            <h3 className="variant_name font-medium text-lg w-fit h-fit">
              {obj.option_title === "" ? "No Name" : obj.option_title}
            </h3>
            <motion.div className="varaints flex flex-row flex-wrap gap-3 w-full items-center">
              <TextRender {...obj} />
              <ColorRender {...obj} />
              <div className="action flex flex-row items-start w-full h-fit gap-x-5">
                <div
                  onClick={() => handleVariantEdit(idx)}
                  className="edit text-sm cursor-pointer text-blue-500 hover:text-white active:text-white transition duration-500"
                >
                  Edit
                </div>
                <div
                  onClick={() => handleVariantDelete(idx)}
                  className="edit text-sm cursor-pointer text-red-500 hover:text-white active:text-white transition duration-500"
                >
                  Delete
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))
      )}
    </div>
  );
};

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

  const handleUpdateVariantOption = (e: React.FormEvent<HTMLFormElement>) => {
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
  };

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
