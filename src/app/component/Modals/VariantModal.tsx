"use client";
import { useGlobalContext } from "@/src/context/GlobalContext";
import { errorToast } from "../Loading";
import { useCallback, useEffect, useState } from "react";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import tinycolor from "tinycolor2";
import { SecondaryModal } from "../Modals";
import PrimaryButton, { Selection } from "../Button";
import Image from "next/image";
import Variantimg from "../../../../public/Image/Variant.png";
import Variantstockimg from "../../../../public/Image/Stock.png";
import {
  ColorSelectModal,
  ManageStockContainer,
  MapSelectedValuesToVariant,
} from "./VariantModalComponent";
import { Badge, Button, Input } from "@heroui/react";
import TemplateContainer, {
  AddTemplateModal,
} from "./Variantcomponent/TemplateContainer";
import { VariantTemplateType } from "./Variantcomponent/Action";
import { HasPartialOverlap } from "@/src/lib/utilities";
import { NormalSkeleton } from "../Banner";
import React from "react";
import {
  colorPalette,
  Colortype,
  ProductState,
  Stocktype,
  VariantColorValueType,
  Variantcontainertype,
} from "@/src/context/GlobalType.type";
import { ProductStockType } from "../ServerComponents";
import {
  VariantOptionModal,
  VariantTypeSection,
} from "./VariantModalComponent#2";
import { AddIcon, DeleteIcon } from "../Asset";
import { VariantColorIcon } from "../Icons/VariantComponent";

export interface variantdatatype {
  id?: number;
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<string | VariantColorValueType>;
}

export type ColorDataType = {
  color: Colortype;
  name: string;
};

export const ArraysAreEqualSets = (
  array1: string[],
  array2: string[]
): boolean => {
  if (array1.length !== array2.length) return false;

  const set1 = new Set(array1);
  const set2 = new Set(array2);

  if (set1.size !== set2.size) return false;

  const set1Array = Array.from(set1);
  for (let i = 0; i < set1Array.length; i++) {
    if (!set2.has(set1Array[i])) return false;
  }

  return true;
};
export const Variantcontainer = ({
  type,
  editindex,
  closename,
  resetState,
}: {
  type?: "stock";
  editindex?: number;
  closename?: string;
  resetState?: () => void;
}) => {
  const { openmodal, setopenmodal, product, setproduct } = useGlobalContext();
  const [temp, settemp] = useState<variantdatatype>();
  const [reloadtemp, setreloadtemp] = useState(true);
  const [colordata, setcolordata] = useState<ColorDataType>({
    color: colorPalette,
    name: "",
  });
  const [open, setopen] = useState({
    addcolor: false,
    addoption: false,
    addtemplate: false,
  });
  const [newadd, setnew] = useState<Variantcontainertype>(type ?? "none");
  const [option, setoption] = useState("");
  const [added, setadded] = useState(-1);
  const [edit, setedit] = useState(-1);
  const [addstock, setaddstock] = useState(-1);
  const [name, setname] = useState("");
  const [stock, setstock] = useState("");
  const [templates, settemplates] = useState<VariantTemplateType[] | []>([]);
  const [editsubstockidx, seteditsubstockidx] = useState(-1);
  const [reloaddata, setreloaddata] = useState(true);
  const [addNewSubStock, setaddNewSubStock] = useState(false);
  const [edittemplate, setedittemplate] = useState<
    VariantTemplateType | undefined
  >(undefined);
  const [selectedvalues, setselectedvalues] = useState<
    | {
        [key: string]: string[];
      }
    | undefined
  >(undefined);
  const [isEditTemp, setisEditTemp] = useState(false);
  const [loading, setloading] = useState(false);

  //Fetch Variant Template
  const FetchTemplate = useCallback(async () => {
    async function asyncfetch() {
      const res = await ApiRequest({
        url: "/api/products/variant/template?ty=short",
        method: "GET",
      });
      setreloadtemp(false);
      if (res.success) {
        settemplates(res.data as VariantTemplateType[]);
      }
    }
    if (reloadtemp) {
      await Delayloading(asyncfetch, setloading, 1000);
    }
  }, [reloadtemp]);

  //Fetch variant stock
  const fetchstock = useCallback(
    async (index: number) => {
      const asyncfetchdata = async () => {
        const URL = `/api/products?ty=${type}&pid=${index}`;
        const response = await ApiRequest({ url: URL, method: "GET" });

        if (!response.success) {
          errorToast("Error Connection");
          return;
        }

        const { varaintstock, variants } =
          response.data as Partial<ProductState>;

        setproduct((prev) => ({ ...prev, varaintstock, variants }));
        setreloaddata(false);
      };
      await Delayloading(asyncfetchdata, setloading, 500);
    },
    [setproduct, type]
  );

  useEffect(() => {
    if (editindex && type && type === ProductStockType.stock && reloaddata)
      fetchstock(editindex);
  }, [editindex, fetchstock, reloaddata, type]);

  useEffect(() => {
    FetchTemplate();
  }, [FetchTemplate, reloadtemp]);

  const handleCreate = () => {
    let update = product.variants ? [...product.variants] : undefined;

    const isExist =
      added === -1 && update && update.some((i) => i.option_title === name);

    if (isExist) {
      errorToast("Variant name exist");
      return;
    }

    // Check if a variant with type COLOR already exists
    const isColorTypeExist =
      added === -1 && update && update.some((i) => i.option_type === "COLOR");

    if (isColorTypeExist && temp?.type === "COLOR") {
      errorToast("Variant of type color can only have one");
      return;
    }

    if (!update) {
      update = [
        {
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
        },
      ];
    } else {
      if (added !== -1) {
        update[added] = {
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
        };

        if (product.varaintstock) {
          const updatestock = product.varaintstock?.map((stockItem) => ({
            ...stockItem,
            Stockvalue: stockItem.Stockvalue.map((stockValue) => ({
              ...stockValue,
              variant_val: stockValue.variant_val.map((val) =>
                update?.some((vars) =>
                  vars.option_type === "COLOR"
                    ? (vars.option_value as VariantColorValueType[]).some(
                        (color) => color.val === val
                      )
                    : vars.option_value.includes(val)
                )
                  ? val
                  : ""
              ),
            })).filter((stockValue) =>
              stockValue.variant_val.some((val) => val !== "")
            ),
          }));

          setproduct((prev) => ({ ...prev, varaintstock: updatestock }));
        }
      } else {
        update.push({
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value ?? [],
        });
      }
    }

    setproduct((prev) => ({ ...prev, variants: update }));

    setadded(-1);
    setname("");
    setnew("variant");
  };

  const handleColorSelect = useCallback(
    (idx: number, type: "color" | "text") => {
      if (type === "color") {
        const data = temp?.value[idx] as VariantColorValueType;
        const rgb = tinycolor(data.val).toRgb();
        setedit(idx);
        setcolordata({
          name: data.name ?? "",
          color: { hex: data.val as string, rgb: rgb },
        });
        setopen((prev) => ({ ...prev, addcolor: true }));
      } else {
        const data = temp?.value[idx] as string;
        setedit(idx);
        setoption(data as string);
        setopen((prev) => ({ ...prev, addoption: true }));
      }
    },
    [temp]
  );

  const handleDeleteVaraint = (idx: number) => {
    const update = { ...temp };
    update?.value?.splice(idx, 1);
    settemp(update as variantdatatype);
  };

  const handleSelectTemplate = useCallback(
    (id: number) => {
      const selectedtemp = { ...templates.find((i) => i.id === id) };

      if (!selectedtemp) {
        return;
      }

      if (isEditTemp) {
        setedittemplate(selectedtemp as VariantTemplateType);
        setopen((prev) => ({ ...prev, addtemplate: true }));
      } else {
        setname(selectedtemp.variant?.option_title as string);
        settemp({
          name: selectedtemp.variant?.option_title as string,
          type: selectedtemp.variant?.option_type as never,
          value: selectedtemp.variant?.option_value as never,
        });
        setnew("info");
      }
    },
    [isEditTemp, templates]
  );

  const handleDeleteTemplate = useCallback(async (id: number) => {
    setloading(true);
    const request = await ApiRequest({
      url: "/api/products/variant/template",
      method: "DELETE",
      data: { id },
    });
    setloading(false);
    if (!request.success) {
      errorToast("Error Occured");
      return;
    }
    setreloadtemp(true);
  }, []);

  const handleBack = () => {
    if (newadd == "none") {
      setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
      return;
    } else {
      if (newadd === "info") {
        setnew("type");
        setoption("");
        setadded(-1);
        setname("");
        settemp(undefined);
        if (edit !== -1) setedit(-1);
        return;
      }

      if (newadd === "stockinfo") {
        handleCreateAndUpdateVariantStock();
        return;
      }

      if (newadd === "stock" && editindex !== -1) {
        if (closename)
          setopenmodal((prev) => ({ ...prev, [closename as string]: false }));
        else setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
        return;
      }
      if (newadd === "type") {
        setnew("variant");
        return;
      }
      setnew("none");
    }
  };

  const handleCreateAndUpdateVariantStock = async (addnew?: boolean) => {
    const stockArray = product.varaintstock ? [...product.varaintstock] : [];

    const isStockEmpty = product.varaintstock?.findIndex(
      (i) => i.Stockvalue.length === 0
    );
    if (isStockEmpty !== -1) {
      setproduct((prev) => ({
        ...prev,
        varaintstock: stockArray.filter((_, idx) => idx !== isStockEmpty),
      }));
    }
    if (
      !selectedvalues ||
      !stock ||
      Object.values(selectedvalues).some((v) => v.length === 0)
    ) {
      if (edit !== -1 && !addnew) setedit(-1);
      if (selectedvalues) setselectedvalues(undefined);
      if (stock) setstock("");

      if (!addnew) setnew("stock");

      if (added === -1 && edit === -1 && closename) {
        setopenmodal((prev) => ({ ...prev, [closename]: false }));
      }
      setadded(-1);
      return;
    }

    const stockValues = MapSelectedValuesToVariant(
      selectedvalues,
      product.variants?.map((i) => i.option_title) ?? []
    );

    const parsedQty = parseInt(stock, 10);

    const newStock: Stocktype = {
      qty: parsedQty,
      Stockvalue: stockValues.map((i) => ({
        qty: parsedQty,
        variant_val: i,
      })),
    };
    if (edit === -1 || newadd) {
      const isOverlap = stockArray.some((item) =>
        HasPartialOverlap(
          item.Stockvalue.map((i) => i.variant_val),
          stockValues
        )
      );

      if (isOverlap) {
        errorToast("Stock Existed");
        setstock("");

        return;
      }
    }

    if (edit === -1) {
      stockArray.push(newStock);
    } else {
      const existingStock = stockArray[edit];
      const updatedStockValue = existingStock.Stockvalue.map((i) => {
        const isMatch = stockValues.some((val) =>
          ArraysAreEqualSets(val, i.variant_val)
        );
        return isMatch ? { ...i, qty: parsedQty } : i;
      });

      if (addnew) {
        stockValues.forEach((i) => {
          updatedStockValue.push({ qty: parsedQty, variant_val: i });
        });
      }

      stockArray[edit].Stockvalue = updatedStockValue;
      if (!addnew) setedit(-1);
    }

    //update Stock When In Product Edit Mode

    setproduct((prev) => ({
      ...prev,
      varaintstock: stockArray.filter((stock) => stock.Stockvalue.length > 0),
    }));

    if (editindex) await handleSaveUpdateSubStock(stockArray);

    setselectedvalues(undefined);
    setstock("");
    if (!addnew) setnew("stock");
  };

  const handleDeleteColor = useCallback(
    (idx: number) => {
      const update = { ...temp };
      update.value?.splice(idx, 1);
      settemp(update as variantdatatype);
    },
    [temp]
  );

  const handleSaveUpdateSubStock = useCallback(
    async (varaintstock: Stocktype[]) => {
      setloading(true);
      const res = await ApiRequest({
        url: "/api/products/crud",
        method: "PUT",
        data: {
          id: editindex,
          varaintstock,
          type: "editvariantstock",
        },
      });
      setloading(false);
      if (!res.success) {
        errorToast("Error occured");
        return;
      }
      setedit(-1);
      setselectedvalues(undefined);
      setstock("");
      if (resetState) resetState();
      setnew("stockinfo");
    },
    [editindex, resetState]
  );

  const handleClose = useCallback(() => {
    if (resetState) resetState();
    setopenmodal((prev) => ({ ...prev, [closename as string]: false }));
  }, [closename, resetState, setopenmodal]);

  return (
    <SecondaryModal
      size="4xl"
      open={
        closename
          ? (openmodal[closename] as boolean)
          : openmodal.addproductvariant ?? false
      }
      onPageChange={() => handleClose()}
    >
      <div className="relative productvariant_creation rounded-t-md w-full h-full bg-white flex flex-col items-center justify-start pt-5 gap-y-5">
        <h3 className="title text-2xl font-bold text-left w-full h-[50px] pl-2 border-b-1 border-black ">
          {newadd === "variant" || newadd === "type" || newadd === "info"
            ? "Variant"
            : newadd === "stock" || newadd === "stockinfo"
            ? "Stock"
            : "Variant and Stock"}
        </h3>

        {newadd === "variant" ? (
          <VariantTypeSection
            loading={loading}
            setadded={setadded}
            setname={setname}
            setnew={setnew}
            settemp={settemp}
          />
        ) : (
          // stock__container
          //
          //
          (newadd === "stock" || newadd === "stockinfo") && (
            <ManageStockContainer
              setreloaddata={setreloaddata}
              isloading={loading}
              editindex={editindex}
              newadd={newadd}
              setedit={setedit}
              edit={edit}
              stock={stock}
              setstock={setstock}
              addstock={addstock}
              setnew={setnew}
              setaddstock={setaddstock}
              selectedstock={selectedvalues ?? {}}
              setselectedstock={setselectedvalues}
              editsubidx={editsubstockidx}
              seteditsubidx={seteditsubstockidx}
              setadded={setadded}
              isAddNew={addNewSubStock}
              setisAddNew={setaddNewSubStock}
              handleUpdateStock={(isAddnew) =>
                handleCreateAndUpdateVariantStock(isAddnew)
              }
            />
          )
        )}

        {/* Chose type for Variant */}
        {newadd === "type" && (
          <>
            <Selection
              default="Chose Type"
              style={{ width: "90%" }}
              onChange={(e) => {
                settemp({
                  name: "",
                  value: [],
                  type: e.target.value as never,
                });
                setnew("info");
              }}
              data={[
                {
                  label: "Color",
                  value: "COLOR",
                },
                { label: "Text", value: "TEXT" },
              ]}
            />
            <div className="templatecontainer w-[90%] h-fit flex flex-col gap-y-5">
              <div className="w-full h-fit text-lg font-bold flex flex-row gap-x-3 items-center">
                <p>Template</p>

                <span
                  onClick={() => setisEditTemp(!isEditTemp)}
                  className="text-sm text-blue-400 cursor-pointer transition-colors hover:text-gray-300 active:text-gray-300"
                >
                  {isEditTemp ? "Done" : "Edit"}
                </span>
              </div>
              <div className="w-full h-fit p-3 max-h-[200px] overflow-y-auto overflow-x-hidden">
                {loading ? (
                  <NormalSkeleton width="100%" height="50px" count={3} />
                ) : (
                  <TemplateContainer
                    data={templates.map((item) => ({
                      id: item.id,
                      val: item.variant?.option_title ?? "",
                      type: item.variant?.option_type ?? "",
                    }))}
                    edit={!isEditTemp}
                    onItemsClick={handleSelectTemplate}
                    onItemsDelete={handleDeleteTemplate}
                    group={true}
                  />
                )}
              </div>

              <Button
                color="primary"
                variant="bordered"
                style={{ height: "40px" }}
                onPress={() =>
                  setopen((prev) => ({ ...prev, addtemplate: true }))
                }
              >
                Add Template
              </Button>
            </div>

            {open.addtemplate && (
              <AddTemplateModal
                close={() =>
                  setopen((prev) => ({ ...prev, addtemplate: false }))
                }
                openstate={open.addtemplate}
                refresh={() => setreloadtemp(true)}
                data={edittemplate}
              />
            )}
          </>
        )}
        {newadd === "info" && (
          <div className="w-full max-w-[95%] bg-white rounded-xl shadow-sm p-5 space-y-6 border border-gray-100">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {edit === -1 ? "Add New Variant" : "Edit Variant"}
              </h2>
              <p className="text-sm text-gray-500">
                Configure your variant options below
              </p>
            </div>

            <Input
              name="name"
              type="text"
              label="Variant Name"
              value={name}
              onChange={(e) => setname(e.target.value)}
              size="lg"
              className="w-full"
            />

            {temp && temp.type === "COLOR" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-700">
                    Color Options
                  </h3>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={() =>
                      setopen((prev) => ({ ...prev, addcolor: true }))
                    }
                    startContent={<AddIcon />}
                  >
                    Add Color
                  </Button>
                </div>

                <ColorSelectModal
                  temp={temp}
                  settemp={settemp}
                  setcolorstate={setcolordata}
                  colorstate={colordata}
                  edit={edit}
                  setedit={setedit}
                  open={open.addcolor}
                  setopen={(val) =>
                    setopen((prev) => ({ ...prev, addcolor: val }))
                  }
                  color={colordata.color}
                  name={colordata.name}
                  setcolor={(val) => {
                    if (typeof val === "string") {
                      setcolordata((prev) => ({ ...prev, name: val }));
                    } else {
                      setcolordata((prev) => ({ ...prev, color: val }));
                    }
                  }}
                />

                <div className="mt-2">
                  {!temp?.value?.some((i) => i !== "") ? (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                        <VariantColorIcon />
                      </div>
                      <h3 className="text-gray-500 font-medium">
                        No Colors Added Yet
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Click the {`"Add Color"`} button to get started
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {temp?.value?.map(
                        (color, idx) =>
                          typeof color !== "string" && (
                            <div key={idx} className="relative group">
                              <button
                                onClick={() => handleDeleteColor(idx)}
                                className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center 
                                shadow-md transform transition-transform opacity-0 group-hover:opacity-100 hover:scale-110"
                                aria-label="Delete color"
                              >
                                <DeleteIcon />
                              </button>

                              <div
                                onClick={() => handleColorSelect(idx, "color")}
                                className="w-full bg-white border border-gray-200 rounded-lg p-3 shadow-sm 
                               hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex items-center gap-3"
                              >
                                <div
                                  className="w-8 h-8 rounded-full shadow-inner flex-shrink-0"
                                  style={{
                                    backgroundColor: color.val,
                                    boxShadow:
                                      "inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)",
                                  }}
                                ></div>
                                {color.name && (
                                  <span className="text-sm font-medium text-gray-700 truncate">
                                    {color.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-700">
                    Text Options
                  </h3>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onClick={() => {
                      setedit(-1);
                      setoption("");
                      setopen((prev) => ({ ...prev, addoption: true }));
                    }}
                    startContent={<AddIcon />}
                  >
                    Add Option
                  </Button>
                </div>

                {open.addoption && (
                  <VariantOptionModal
                    open={open.addoption}
                    onClose={() =>
                      setopen((prev) => ({ ...prev, addoption: false }))
                    }
                    edit={edit}
                    setedit={setedit}
                    option={option}
                    setoption={setoption}
                    temp={temp}
                  />
                )}

                <div className="mt-2">
                  {temp?.value.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                        <VariantColorIcon />
                      </div>
                      <h3 className="text-gray-500 font-medium">
                        No Options Added Yet
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Click the {`"Add Option"`} button to get started
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {temp?.value.map((i, idx) => (
                        <div key={idx} className="relative group">
                          <button
                            onClick={() => handleDeleteVaraint(idx)}
                            className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center 
                              shadow-md transform transition-transform opacity-0 group-hover:opacity-100 hover:scale-110"
                            aria-label="Delete option"
                          >
                            <DeleteIcon />
                          </button>

                          <div
                            onClick={() => handleColorSelect(idx, "text")}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-800
                             hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200 cursor-pointer"
                          >
                            {i.toString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {newadd === "variant" && (
          <PrimaryButton
            text="Add new"
            type="button"
            onClick={() => {
              setname("");
              setadded(-1);
              setedit(-1);
              setnew("type");
            }}
            radius="10px"
            width="90%"
            textsize="12px"
            height="40px"
          />
        )}
        {/* Choose Type of between Variant and Stock */}
        {newadd === "none" && (
          <div className="w-[90%] grid grid-cols-1 md:grid-cols-2 gap-6 place-items-center py-8">
            {/* Variant Card */}
            <div
              onClick={() => setnew("variant")}
              className="w-full max-w-[350px] aspect-[7/5] bg-gradient-to-br from-blue-300 to-blue-200 
    rounded-xl shadow-md hover:shadow-lg transition-all duration-300 
    flex flex-col items-center justify-center gap-4 p-6 group
    border border-transparent hover:border-blue-400"
            >
              <div className="w-24 h-24 mb-2 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src={Variantimg}
                  alt="Variant Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                  {!product.variants || product.variants.length === 0
                    ? "Create Variant"
                    : "Variants"}
                </h3>
                {product.variants && product.variants.length > 0 && (
                  <span
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 text-white 
        text-sm font-bold rounded-full animate-pulse"
                  >
                    {product.variants.length}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Card */}
            <div
              onClick={() => {
                if (!product.variants || product.variants.length === 0) {
                  errorToast("Please Create Variant");
                  return;
                }
                setnew("stock");
              }}
              className={`w-full max-w-[350px] aspect-[7/5] rounded-xl shadow-md p-6
    flex flex-col items-center justify-center gap-4 transition-all duration-300
    border border-transparent
    ${
      !product.variants || product.variants.length === 0
        ? "bg-gradient-to-br from-gray-300 to-gray-200 cursor-not-allowed opacity-70"
        : "bg-gradient-to-br from-blue-300 to-blue-200 hover:shadow-lg group hover:border-blue-400 cursor-pointer"
    }`}
            >
              <div className="w-20 h-20 mb-2 transition-transform duration-300 group-hover:scale-110">
                <Image
                  src={Variantstockimg}
                  alt="Stock Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                  {!product.varaintstock || product.varaintstock.length === 0
                    ? "Create Stock"
                    : "Stock"}
                </h3>
                {product.varaintstock && product.varaintstock.length > 0 && (
                  <span
                    className="flex items-center justify-center w-8 h-8 bg-gray-800 text-white 
        text-sm font-bold rounded-full animate-pulse"
                  >
                    {product.varaintstock.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className=" flex flex-row justify-end gap-x-5 w-full h-fit bg-white rounded-b-lg p-2 border-t-2 border-gray-500">
        {newadd === "info" && (
          <Button
            onPress={() => handleCreate()}
            className="font-bold w-[150px]"
            color="primary"
          >
            Create
          </Button>
        )}
        {editsubstockidx === -1 && (
          <>
            <PrimaryButton
              text={newadd !== "none" ? "Back" : "Close"}
              onClick={() => handleBack()}
              status={loading ? "loading" : "authenticated"}
              type="button"
              width="150px"
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
