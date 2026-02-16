"use client";
import React from "react";
import { Button } from "@heroui/react";
import { Selection } from "../../Button";
import TemplateContainer, { AddTemplateModal } from "./TemplateContainer";
import { NormalSkeleton } from "../../Banner";
import { ModalOpenState } from "../types";
import {
  useVariantManager,
  UseVariantManagerReturn,
} from "./hooks/useVariantManager";
import {
  useTemplateManager,
  UseTemplateManagerReturn,
} from "./hooks/useTemplateManager";
import { VariantTypeEnum } from "@/src/types/product.type";
import { SelectType } from "@/src/types/productAction.type";

interface VariantTypeSelectionProps {
  variantManager: UseVariantManagerReturn;
  templateManager: UseTemplateManagerReturn;
  open: ModalOpenState;
  setOpen: React.Dispatch<React.SetStateAction<ModalOpenState>>;
  setNew: React.Dispatch<React.SetStateAction<any>>;
  onSelectTemplate: (id: number) => void;
  setSuccessMessage?: React.Dispatch<React.SetStateAction<string>>;
}

const VariantTypeSelectionOptions: Array<SelectType> = [
  { label: "Color", value: VariantTypeEnum.color },
  { label: "Text", value: VariantTypeEnum.text },
];

export const VariantTypeSelection: React.FC<VariantTypeSelectionProps> = ({
  variantManager,
  templateManager,
  open,
  setOpen,
  setNew,
  onSelectTemplate,
  setSuccessMessage,
}) => {
  return (
    <>
      <div className="w-[90%]">
        <Selection
          default="Choose Variant Type"
          style={{ width: "100%" }}
          onChange={(e) => {
            variantManager.setTemp({
              name: "",
              value: [],
              type: e.target.value as VariantTypeEnum,
            });
            setNew("info");
          }}
          data={[
            {
              label: "Color",
              value: VariantTypeEnum.color,
            },
            { label: "Text", value: VariantTypeEnum.text },
          ]}
        />
      </div>
      <div className="templatecontainer w-[90%] h-fit flex flex-col gap-y-5 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="w-full h-fit flex flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-bold text-gray-800">Templates</p>
          </div>
          <button
            onClick={() =>
              templateManager.setIsEditTemp(!templateManager.isEditTemp)
            }
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 bg-blue-100 text-blue-600 hover:bg-blue-200"
          >
            {templateManager.isEditTemp ? "✓ Done" : "✏️ Edit"}
          </button>
        </div>
        <div className="w-full h-fit p-3 max-h-[200px] overflow-y-auto overflow-x-hidden rounded-lg bg-gray-50">
          {templateManager.loading ? (
            <NormalSkeleton width="100%" height="50px" count={3} />
          ) : (
            <TemplateContainer
              data={templateManager.templates.map((item: any) => ({
                id: item.id,
                val: item.variant?.option_title ?? "",
                type: item.variant?.option_type ?? "",
              }))}
              edit={!templateManager.isEditTemp}
              onItemsClick={onSelectTemplate}
              onItemsDelete={templateManager.deleteTemplate}
              group={true}
            />
          )}
        </div>

        <Button
          color="primary"
          variant="bordered"
          style={{ height: "40px" }}
          onClick={() => setOpen((prev) => ({ ...prev, addtemplate: true }))}
        >
          Add Template
        </Button>
      </div>

      {open.addtemplate && (
        <AddTemplateModal
          close={() => setOpen((prev) => ({ ...prev, addtemplate: false }))}
          refresh={() => templateManager.setReloadTemp(true)}
          data={templateManager.editTemplate}
          setSuccessMessage={setSuccessMessage}
        />
      )}
    </>
  );
};
