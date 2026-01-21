"use client";
import {
  ProductStockType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { errorToast } from "../Loading";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import tinycolor from "tinycolor2";
import { SecondaryModal } from "../Modals";
import PrimaryButton from "../Button";
import Variantimg from "../../../../public/Image/Variant.png";
import Variantstockimg from "../../../../public/Image/Stock.png";
import { ManageStockContainer } from "./VariantModalComponent";
import React from "react";

// Import types and utilities
import {
  Colortype,
  Colorinitalize,
  Variantcontainertype,
  ModalOpenState,
} from "./types";
import { useVariantManager } from "./Variantcomponent/hooks/useVariantManager";
import { useStockManager } from "./Variantcomponent/hooks/useStockManager";
import { useTemplateManager } from "./Variantcomponent/hooks/useTemplateManager";
import { SelectionCard } from "./Variantcomponent/SelectionCards";
import { VariantTypeSelection } from "./Variantcomponent/VariantTypeSelection";
import { VariantInfoEditor } from "./Variantcomponent/VariantInfoEditor";
import { VariantView } from "./Variantcomponent/VariantView";
import {
  ArraysAreEqualSets,
  checkVariantExists,
  updateStockOnVariantEdit,
  cleanEmptyStock,
} from "./Variantcomponent/utils";
import {
  Stocktype,
  VariantColorValueType,
  VariantTypeEnum,
} from "@/src/types/product.type";

export { Colorinitalize, ArraysAreEqualSets };
export type { Colortype, Variantcontainertype };

export const Variantcontainer = ({
  type,
  editindex,
  closename,
}: {
  type?: "stock";
  editindex?: number;
  closename?: string;
}) => {
  const { openmodal, setopenmodal, product, setproduct } = useGlobalContext();

  // Use custom hooks
  const variantManager = useVariantManager();
  const stockManager = useStockManager();
  const templateManager = useTemplateManager();

  // Local state
  const [open, setOpen] = useState<ModalOpenState>({
    addcolor: false,
    addoption: false,
    addtemplate: false,
  });
  const [newadd, setNew] = useState<Variantcontainertype>(type ?? "none");
  const [addstock, setaddstock] = useState(-1);
  const [reloaddata, setreloaddata] = useState(true);
  const [mainLoading, setMainLoading] = useState(false);

  // Fetch variant stock
  const fetchstock = useCallback(
    async (index: number) => {
      const asyncfetchdata = async () => {
        const URL = `/api/products?ty=${type}&pid=${index}`;
        const response = await ApiRequest(URL, undefined, "GET");

        if (!response.success) {
          errorToast("Error Connection");
          return;
        }

        const { varaintstock, variants } = response.data;
        setproduct((prev) => ({
          ...prev,
          Stock: varaintstock,
          Variant: variants,
        }));
        setreloaddata(false);
      };
      await Delayloading(asyncfetchdata, setMainLoading, 500);
    },
    [type, setproduct],
  );

  useEffect(() => {
    if (editindex && type && type === ProductStockType.stock && reloaddata) {
      fetchstock(editindex);
    }
  }, [reloaddata, editindex, type, fetchstock]);

  useEffect(() => {
    templateManager.fetchTemplates();
  }, [templateManager.reloadTemp]);

  // Handler functions
  const handleCreate = useCallback(() => {
    let update = product.Variant ? [...product.Variant] : undefined;

    if (
      variantManager.added === -1 &&
      checkVariantExists(update, variantManager.name)
    ) {
      errorToast("Variant name exist");
      return;
    }

    const variantData = {
      option_title: variantManager.name,
      option_type: variantManager.temp?.type as VariantTypeEnum,
      option_value: variantManager.temp?.value ?? [],
    };

    if (!update) {
      update = [variantData];
    } else {
      if (variantManager.added !== -1) {
        update[variantManager.added] = variantData;

        if (product.Stock) {
          const updatestock = updateStockOnVariantEdit(product.Stock, update);
          setproduct((prev) => ({ ...prev, Stock: updatestock }));
        }
      } else {
        update.push(variantData);
      }
    }

    setproduct((prev) => ({ ...prev, Variant: update }));
    variantManager.setAdded(-1);
    variantManager.setName("");
    setNew("variant");
  }, [product.Variant, product.Stock, variantManager, setproduct]);

  const handleColorSelect = useCallback(
    (idx: number, selectType: "color" | "text") => {
      if (selectType === "color") {
        const data = variantManager.temp?.value[idx] as VariantColorValueType;
        const rgb = tinycolor(data.val).toRgb();
        variantManager.setEdit(idx);
        variantManager.setColorData({
          name: data.name ?? "",
          color: { hex: data.val as string, rgb: rgb },
        });
        setOpen((prev) => ({ ...prev, addcolor: true }));
      } else {
        const data = variantManager.temp?.value[idx] as string;
        variantManager.setEdit(idx);
        variantManager.setOption(data);
        setOpen((prev) => ({ ...prev, addoption: true }));
      }
    },
    [variantManager],
  );

  const handleUpdateVariantOption = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const existingTextOptions =
        product.Variant?.filter((v) => v.option_type === "TEXT").flatMap(
          (v) => v.option_value as string[],
        ) ?? [];

      if (variantManager.addTextOption(existingTextOptions)) {
        setOpen((prev) => ({ ...prev, addoption: false }));
      }
    },
    [product.Variant, variantManager],
  );

  const handleVariantEdit = useCallback(
    (idx: number) => {
      if (!product.Variant) return;

      const variantToEdit = product.Variant[idx];
      if (variantToEdit) {
        variantManager.setName(variantToEdit.option_title);
        variantManager.setTemp({
          name: variantToEdit.option_title,
          value: [...variantToEdit.option_value],
          type: variantToEdit.option_type as VariantTypeEnum,
        });
        variantManager.setAdded(idx);
        setNew("info");
      }
    },
    [product.Variant, variantManager],
  );

  const handleVariantDelete = useCallback(
    async (idx: number) => {
      const { Variant: variants, Stock: varaintstock } = product;
      if (!variants || idx < 0 || idx >= variants.length) return;

      const updatedVariants = variants.filter((_, i) => i !== idx);

      setproduct((prev) => ({
        ...prev,
        Variant: updatedVariants,
        Stock: varaintstock
          ? varaintstock.filter((stock) =>
              stock.Stockvalue.some((val) => {
                return updatedVariants.some((currentVariant) =>
                  currentVariant.option_value.some((v) => {
                    const variantVal = typeof v === "string" ? v : v.val;
                    return val.variant_val.includes(variantVal);
                  }),
                );
              }),
            )
          : undefined,
      }));

      setNew("variant");
    },
    [product, setproduct],
  );

  const handleSelectTemplate = useCallback(
    (id: number) => {
      //Find selected template
      const selectedTemp = templateManager.templates.find((i) => i.id === id);
      if (!selectedTemp) return;

      if (templateManager.isEditTemp) {
        templateManager.setEditTemplate(selectedTemp);
        setOpen((prev) => ({ ...prev, addtemplate: true }));
      } else {
        variantManager.setName(selectedTemp.variant?.option_title ?? "");
        variantManager.setTemp({
          name: selectedTemp.variant?.option_title ?? "",
          type: selectedTemp.variant?.option_type as any,
          value: selectedTemp.variant?.option_value as any,
        });
        setNew("info");
      }
    },
    [templateManager, variantManager],
  );

  const handleBack = async () => {
    if (newadd === "none") {
      setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
      return;
    }

    if (newadd === "stockinfo") {
      console.log("Back-BTN", stockManager.selectedValues);

      handleCreateAndUpdateVariantStock();
      return;
    }

    if (newadd === "stock" && editindex) {
      if (closename) {
        setopenmodal((prev) => ({ ...prev, [closename]: false }));
      } else {
        setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
      }
      return;
    }

    if (newadd === "type") {
      setNew("variant");
      return;
    }

    setNew("none");
  };

  const handleCreateAndUpdateVariantStock = useCallback(
    async (addnew?: boolean) => {
      //?addnew arg for flag addnew sub stock

      const cleanedStock = cleanEmptyStock(product.Stock);

      const result = stockManager.createOrUpdateStock(
        cleanedStock,
        product.Variant?.map((i) => i.option_title) ?? [],
        addnew,
      );

      //If stockvalue is null reset stock state
      if (!result) {
        if (stockManager.editStockIdx !== -1 && !addnew) {
          stockManager.setEditStockIdx(-1);
        }
        stockManager.resetStockState();

        if (!addnew) setNew("stock");

        if (
          variantManager.added === -1 &&
          stockManager.editStockIdx === -1 &&
          closename
        ) {
          setopenmodal((prev) => ({ ...prev, [closename]: false }));
        }
        variantManager.setAdded(-1);
        return;
      }

      //Update Stock when in editmode

      if (editindex) {
        await handleSaveUpdateSubStock(result);
      }

      setproduct((prev) => ({ ...prev, Stock: result }));
      if (addnew) {
        setNew("stockinfo");
      } else {
        stockManager.resetStockState();
        setNew("stock");
      }
    },
    [
      product.Stock,
      product.Variant,
      stockManager,
      variantManager,
      editindex,
      closename,
      setproduct,
      setopenmodal,
    ],
  );

  const handleSaveUpdateSubStock = useCallback(
    async (Stock: Array<Stocktype>) => {
      setMainLoading(true);
      const res = await ApiRequest(
        "/api/products/crud",
        undefined,
        "PUT",
        "JSON",
        {
          id: editindex,
          Stock,
          type: "editvariantstock",
        },
      );
      setMainLoading(false);

      if (!res.success) {
        errorToast("Error occurred");
        return;
      }

      stockManager.setEditStockIdx(-1);
      stockManager.resetStockState();
      setNew("stock");
    },
    [editindex, stockManager],
  );

  return (
    <SecondaryModal
      size="4xl"
      open={
        closename
          ? (openmodal[closename] as boolean)
          : openmodal.addproductvariant
      }
      onPageChange={() =>
        setopenmodal((prev) => ({ ...prev, [closename as string]: false }))
      }
    >
      <div className="relative productvariant_creation rounded-t-md w-full h-full bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-start pt-6 gap-y-6">
        <h3 className="title text-2xl font-bold text-left w-full h-fit px-6 pb-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {newadd === "variant" || newadd === "type" || newadd === "info"
            ? "Variant"
            : newadd === "stock" || newadd === "stockinfo"
              ? "Stock"
              : "Variant and Stock"}
        </h3>

        {newadd === "variant" && (
          <VariantView
            variants={product.Variant}
            loading={mainLoading || templateManager.loading}
            onEdit={handleVariantEdit}
            onDelete={handleVariantDelete}
            onAddNew={() => {
              variantManager.setName("");
              variantManager.setAdded(-1);
              variantManager.setEdit(-1);
              setNew("type");
            }}
          />
        )}

        {(newadd === "stock" || newadd === "stockinfo") && (
          <ManageStockContainer
            setreloaddata={setreloaddata}
            isloading={mainLoading}
            editindex={editindex}
            newadd={newadd}
            setedit={stockManager.setEditStockIdx}
            edit={stockManager.editStockIdx}
            stock={stockManager.stock}
            setstock={stockManager.setStock}
            addstock={addstock}
            setnew={setNew}
            setaddstock={setaddstock}
            selectedstock={stockManager.selectedValues ?? {}}
            setselectedstock={stockManager.setSelectedValues}
            editsubidx={stockManager.editSubStockIdx}
            seteditsubidx={stockManager.setEditSubStockIdx}
            setadded={variantManager.setAdded}
            isAddNew={stockManager.addNewSubStock}
            setisAddNew={stockManager.setAddNewSubStock}
            handleUpdateStock={(isAddnew) =>
              handleCreateAndUpdateVariantStock(isAddnew)
            }
          />
        )}

        {/* Chose type for Variant */}
        {newadd === "type" && (
          <VariantTypeSelection
            variantManager={variantManager}
            templateManager={templateManager}
            open={open}
            setOpen={setOpen}
            setNew={setNew}
            onSelectTemplate={handleSelectTemplate}
          />
        )}
        {newadd === "info" && (
          <VariantInfoEditor
            variantManager={variantManager}
            open={open}
            setOpen={setOpen}
            setNew={setNew}
            onColorSelect={handleColorSelect}
            onUpdateOption={handleUpdateVariantOption}
            onCreate={handleCreate}
          />
        )}

        {/* Choose Type of between Variant and Stock */}
        {newadd === "none" && (
          <>
            <div className="w-[90%] h-full grid grid-cols-1 gap-6 place-items-center">
              <SelectionCard
                title={`${
                  !product.Variant || product.Variant.length === 0
                    ? "Create"
                    : "Manage"
                } Variant`}
                image={Variantimg}
                count={product.Variant?.length}
                onClick={() => setNew("variant")}
                gradientFrom="from-blue-400"
                gradientVia="via-blue-500"
                gradientTo="to-purple-600"
                badgeColor="text-blue-600"
              />
              <SelectionCard
                title={`${
                  !product.Stock || product.Stock.length === 0
                    ? "Create"
                    : "Manage"
                } Stock`}
                image={Variantstockimg}
                count={product.Stock?.length}
                disabled={!product.Variant || product.Variant.length === 0}
                onClick={() => {
                  if (!product.Variant || product.Variant.length === 0) {
                    errorToast("Please Create Variant");
                    return;
                  }
                  setNew("stock");
                }}
                gradientFrom="from-green-400"
                gradientVia="via-emerald-500"
                gradientTo="to-teal-600"
                badgeColor="text-green-600"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-row justify-end gap-x-5 w-full h-fit bg-gradient-to-r from-gray-50 to-white rounded-b-lg p-4 border-t-2 border-gray-200 shadow-inner">
        {stockManager.editSubStockIdx === -1 && (
          <>
            <PrimaryButton
              text={newadd !== "none" ? "Back" : "Close"}
              onClick={() => handleBack()}
              status={mainLoading ? "loading" : "authenticated"}
              type="button"
              width="30%"
              height="40px"
              color="lightcoral"
              radius="10px"
            />
          </>
        )}
      </div>
    </SecondaryModal>
  );
};
