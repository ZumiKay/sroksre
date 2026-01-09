"use client";
import {
  ProductStockType,
  Stocktype,
  useGlobalContext,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import { errorToast } from "../Loading";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import tinycolor from "tinycolor2";
import Modal, { SecondaryModal } from "../Modals";
import { motion } from "framer-motion";
import PrimaryButton, { Selection } from "../Button";
import Variantimg from "../../../../public/Image/Variant.png";
import Variantstockimg from "../../../../public/Image/Stock.png";
import {
  ColorSelectModal,
  ManageStockContainer,
} from "./VariantModalComponent";
import { Badge, Button, Input } from "@nextui-org/react";
import TemplateContainer, {
  AddTemplateModal,
} from "./Variantcomponent/TemplateContainer";
import { NormalSkeleton } from "../Banner";
import React from "react";

// Import types and utilities
import {
  VariantDataType,
  Colortype,
  Colorinitalize,
  Variantcontainertype,
  ModalOpenState,
} from "./types";
import { useVariantManager } from "./Variantcomponent/hooks/useVariantManager";
import { useStockManager } from "./Variantcomponent/hooks/useStockManager";
import { useTemplateManager } from "./Variantcomponent/hooks/useTemplateManager";
import { VariantList } from "./Variantcomponent/VariantList";
import { EmptyState } from "./Variantcomponent/EmptyState";
import { SelectionCard } from "./Variantcomponent/SelectionCards";
import {
  ArraysAreEqualSets,
  checkVariantExists,
  checkColorTypeExists,
  updateStockOnVariantEdit,
  cleanEmptyStock,
} from "./Variantcomponent/utils";

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
    [type, setproduct]
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

    if (
      checkColorTypeExists(update) &&
      variantManager.added === -1 &&
      variantManager.temp?.type === "COLOR"
    ) {
      errorToast("Variant of type color can only have one");
      return;
    }

    const variantData = {
      option_title: variantManager.name,
      option_type: variantManager.temp?.type as "COLOR" | "TEXT",
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
    [variantManager]
  );

  const handleUpdateVariantOption = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const existingTextOptions =
        product.Variant?.filter((v) => v.option_type === "TEXT").flatMap(
          (v) => v.option_value as string[]
        ) ?? [];

      if (variantManager.addTextOption(existingTextOptions)) {
        setOpen((prev) => ({ ...prev, addoption: false }));
      }
    },
    [product.Variant, variantManager]
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
          type: variantToEdit.option_type as "COLOR" | "TEXT",
        });
        variantManager.setAdded(idx);
        setNew("info");
      }
    },
    [product.Variant, variantManager]
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
                  })
                );
              })
            )
          : undefined,
      }));

      setNew("variant");
    },
    [product, setproduct]
  );

  const handleSelectTemplate = useCallback(
    (id: number) => {
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
    [templateManager, variantManager]
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
      const cleanedStock = cleanEmptyStock(product.Stock);

      const result = stockManager.createOrUpdateStock(
        cleanedStock,
        product.Variant?.map((i) => i.option_title) ?? [],
        addnew
      );

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

      setproduct((prev) => ({ ...prev, Stock: result }));

      if (editindex) {
        await handleSaveUpdateSubStock(result);
      }

      stockManager.resetStockState();
      if (!addnew) setNew("stock");
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
    ]
  );

  const handleSaveUpdateSubStock = useCallback(
    async (Stock: Stocktype[]) => {
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
        }
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
    [editindex, stockManager]
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

        {newadd === "variant" ? (
          <>
            <div className="w-full flex flex-col items-center gap-y-5">
              {(!product.Variant || product.Variant.length === 0) && (
                <EmptyState
                  title="No Variants Yet"
                  description="Create your first variant to get started"
                />
              )}
              {mainLoading || templateManager.loading ? (
                <NormalSkeleton count={3} width="90%" height="fit-content" />
              ) : (
                product.Variant && (
                  <VariantList
                    variants={product.Variant}
                    onEdit={handleVariantEdit}
                    onDelete={handleVariantDelete}
                  />
                )
              )}
            </div>
          </>
        ) : (
          (newadd === "stock" || newadd === "stockinfo") && (
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
          )
        )}

        {/* Chose type for Variant */}
        {newadd === "type" && (
          <>
            <div className="w-[90%]">
              <Selection
                default="Choose Variant Type"
                style={{ width: "100%" }}
                onChange={(e) => {
                  variantManager.setTemp({
                    name: "",
                    value: [],
                    type: e.target.value as any,
                  });
                  setNew("info");
                }}
                data={[
                  {
                    label: "Color",
                    value: "COLOR",
                  },
                  { label: "Text", value: "TEXT" },
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
                    data={templateManager.templates.map((item) => ({
                      id: item.id,
                      val: item.variant?.option_title ?? "",
                      type: item.variant?.option_type ?? "",
                    }))}
                    edit={!templateManager.isEditTemp}
                    onItemsClick={handleSelectTemplate}
                    onItemsDelete={templateManager.deleteTemplate}
                    group={true}
                  />
                )}
              </div>

              <Button
                color="primary"
                variant="bordered"
                style={{ height: "40px" }}
                onClick={() =>
                  setOpen((prev) => ({ ...prev, addtemplate: true }))
                }
              >
                Add Template
              </Button>
            </div>

            {open.addtemplate && (
              <AddTemplateModal
                close={() =>
                  setOpen((prev) => ({ ...prev, addtemplate: false }))
                }
                refresh={() => templateManager.setReloadTemp(true)}
                data={templateManager.editTemplate}
              />
            )}
          </>
        )}
        {newadd === "info" && (
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
            {variantManager.temp && variantManager.temp.type === "COLOR" ? (
              <div className="color_container w-full h-fit flex flex-col gap-y-5">
                <ColorSelectModal
                  handleAddColor={variantManager.addColor}
                  edit={variantManager.edit}
                  setedit={variantManager.setEdit}
                  open={open.addcolor}
                  setopen={(val) =>
                    setOpen((prev) => ({ ...prev, addcolor: val }))
                  }
                  color={variantManager.colorData.color}
                  name={variantManager.colorData.name}
                  setcolor={(val) => {
                    if (typeof val === "string") {
                      variantManager.setColorData((prev) => ({
                        ...prev,
                        name: val,
                      }));
                    } else {
                      variantManager.setColorData((prev) => ({
                        ...prev,
                        color: val,
                      }));
                    }
                  }}
                />

                <div className="listcolor flex flex-row flex-wrap gap-4 w-full">
                  {variantManager.temp?.value?.some((i) => i !== "") ? (
                    variantManager.temp?.value?.map((color, idx) => {
                      const val = color as VariantColorValueType;
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
                              onClick={() => handleColorSelect(idx, "color")}
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
                      <svg
                        className="w-10 h-10 mx-auto mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                      </svg>
                      <p className="text-sm font-medium">No colors added yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {open.addoption && (
                  <Modal closestate="none" customZIndex={150}>
                    <form
                      onSubmit={(e) => handleUpdateVariantOption(e)}
                      className="addoption w-[340px] max-smallest_phone:w-[300px] h-fit bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 p-6 flex flex-col gap-y-6 items-center justify-start rounded-2xl shadow-2xl border-2 border-gray-200/60 backdrop-blur-sm"
                    >
                      <div className="w-full flex flex-col gap-2">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {variantManager.edit === -1
                            ? "Add Option"
                            : "Edit Option"}
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
                        onChange={(e) =>
                          variantManager.setOption(e.target.value)
                        }
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
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Option
                  </button>
                  <div className="opitonlist flex flex-row gap-3 flex-wrap w-full items-start justify-start h-fit">
                    {variantManager.temp?.value.length === 0 ? (
                      <div className="w-full text-center py-8 text-gray-400">
                        <svg
                          className="w-10 h-10 mx-auto mb-2"
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
                        <p className="text-sm font-medium">
                          No options added yet
                        </p>
                      </div>
                    ) : (
                      variantManager.temp?.value.map((i, idx) => (
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
                              onClick={() => handleColorSelect(idx, "text")}
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
                onClick={() => handleCreate()}
                radius="10px"
                width="100%"
                height="100%"
              />
              <PrimaryButton
                text="Back"
                color="lightcoral"
                type="button"
                textsize="12px"
                onClick={() => {
                  variantManager.setEdit(-1);
                  variantManager.setName("");
                  variantManager.setTemp(undefined);
                  setNew(variantManager.added === -1 ? "type" : "variant");
                }}
                radius="10px"
                width="100%"
                height="100%"
              />
            </div>
          </div>
        )}
        {newadd === "variant" && (
          <button
            type="button"
            onClick={() => {
              variantManager.setName("");
              variantManager.setAdded(-1);
              variantManager.setEdit(-1);
              setNew("type");
            }}
            className="w-[90%] h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add New Variant
          </button>
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
