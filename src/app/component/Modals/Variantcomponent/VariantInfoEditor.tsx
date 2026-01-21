"use client";
import React from "react";
import { Input } from "@nextui-org/react";
import PrimaryButton from "../../Button";
import { ColorVariantEditor } from "./ColorVariantEditor";
import { TextVariantEditor } from "./TextVariantEditor";
import { ModalOpenState } from "../types";
import { VariantTypeEnum } from "@/src/types/product.type";

interface VariantInfoEditorProps {
  variantManager: any;
  open: ModalOpenState;
  setOpen: React.Dispatch<React.SetStateAction<ModalOpenState>>;
  setNew: React.Dispatch<React.SetStateAction<any>>;
  onColorSelect: (idx: number, selectType: "color" | "text") => void;
  onUpdateOption: (e: React.FormEvent<HTMLFormElement>) => void;
  onCreate: () => void;
}

export const VariantInfoEditor: React.FC<VariantInfoEditorProps> = ({
  variantManager,
  open,
  setOpen,
  setNew,
  onColorSelect,
  onUpdateOption,
  onCreate,
}) => {
  const handleBack = () => {
    variantManager.setEdit(-1);
    variantManager.setName("");
    variantManager.setTemp(undefined);
    setNew(variantManager.added === -1 ? "type" : "variant");
  };

  return (
    <div className="addcontainer w-[95%] h-full flex flex-col gap-y-6 rounded-xl bg-white shadow-sm border border-gray-200 p-6">
      <Input
        name="name"
        type="text"
        label="Variant Name"
        value={variantManager.name}
        onChange={(e) => variantManager.setName(e.target.value)}
        size="lg"
        className="w-full"
      />
      {variantManager.temp &&
      variantManager.temp.type === VariantTypeEnum.color ? (
        <ColorVariantEditor
          variantManager={variantManager}
          open={open}
          setOpen={setOpen}
          onColorSelect={onColorSelect}
        />
      ) : (
        <TextVariantEditor
          variantManager={variantManager}
          open={open}
          setOpen={setOpen}
          onTextSelect={onColorSelect}
          onUpdateOption={onUpdateOption}
        />
      )}

      <div className="flex flex-row gap-x-5 w-full h-[35px]">
        <PrimaryButton
          text={`${variantManager.added === -1 ? "Create" : "Update"}`}
          type="button"
          disable={
            variantManager.name === "" ||
            variantManager.temp?.value.length === 0
          }
          textsize="12px"
          onClick={onCreate}
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
          radius="10px"
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
};
