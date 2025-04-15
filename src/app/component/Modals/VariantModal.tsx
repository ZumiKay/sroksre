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
  Colorinitalize,
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
    color: Colorinitalize,
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
          <div className="addcontainer w-[95%] h-full flex flex-col gap-y-5 rounded-lg p-2">
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
              <div className="color_container w-full h-fit flex flex-col gap-y-5">
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

                <div className="listcolor flex flex-row flex-wrap gap-3 w-full">
                  {temp?.value?.some((i) => i !== "") ? (
                    temp?.value?.map((color, idx) => {
                      return (
                        typeof color !== "string" && (
                          <Badge
                            content="-"
                            color="danger"
                            onClick={() => handleDeleteColor(idx)}
                            key={idx}
                          >
                            <div
                              className={`w-fit h-[50px] rounded-lg flex flex-row justify-center items-center gap-x-3 cursor-pointer p-2 transition-colors active:bg-gray-300 hover:bg-gray-300`}
                              onClick={() => handleColorSelect(idx, "color")}
                            >
                              {/* Display created Color */}
                              <div
                                className="color w-[30px] h-[30px] rounded-full"
                                style={{ backgroundColor: color.val }}
                              ></div>
                              {color.name && (
                                <p className="w-fit h-fit text-lg font-light">
                                  {color.name}
                                </p>
                              )}
                            </div>
                          </Badge>
                        )
                      );
                    })
                  ) : (
                    <h3 className="warn_mess text-lg text-black font-normal">
                      No Color Added Yet
                    </h3>
                  )}
                </div>
              </div>
            ) : (
              <>
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
                <div className="text-container flex flex-col items-center justify-start gap-y-3">
                  <h3
                    onClick={() => {
                      setedit(-1);
                      setoption("");
                      setopen((prev) => ({ ...prev, addoption: true }));
                    }}
                    className="text-sm w-ft h-fit cursor-pointer font-medium text-blue-500 transition duration-300 hover:text-gray-300 active:text-gray-300"
                  >
                    Add Option
                  </h3>
                  <div className="opitonlist flex flex-row gap-3 flex-wrap w-full items-start justify-start h-fit">
                    {temp?.value.length === 0 && (
                      <h3 className="warn_mess text-lg text-black font-normal">
                        No Option Yet
                      </h3>
                    )}
                    {temp?.value.map((i, idx) => (
                      <Badge
                        key={idx}
                        content="-"
                        color="danger"
                        onClick={() => handleDeleteVaraint(idx)}
                      >
                        <h3
                          onClick={() => handleColorSelect(idx, "text")}
                          className="option text-[15px] cursor-pointer p-2 rounded-lg text-black outline outline-2 outline-black font-normal transition duration-200 w-fit h-fit"
                        >
                          {i.toString()}
                        </h3>
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-row gap-x-5 w-full h-[35px]">
              <PrimaryButton
                text={`${added === -1 ? "Create" : "Update"}`}
                type="button"
                disable={name === "" || temp?.value.length === 0}
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
                  setedit(-1);
                  setname("");
                  settemp(undefined);
                  setnew(added === -1 ? "type" : "variant");
                }}
                radius="10px"
                width="100%"
                height="100%"
              />
            </div>
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
          <>
            <div className="w-[90%] h-full grid grid-cols-1 gap-5 place-items-center">
              <div
                onClick={() => setnew("variant")}
                className="card w-[350px] h-[250px] 
                max-small_phone:w-[200px] max-small_phone:h-[150px]
              bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
              >
                <Image
                  src={Variantimg}
                  alt="Icon"
                  className="w-[100px] h-[100px] object-contain pb-10"
                />
                <div className=" w-full h-fit text-black flex flex-row items-center gap-x-5">
                  <h3 className="text-2xl font-bold">
                    {`${
                      !product.variants || product.variants.length === 0
                        ? "Create"
                        : ""
                    } Variant`}
                  </h3>
                  <div
                    style={
                      !product.variants || product.variants.length === 0
                        ? { display: "none" }
                        : {}
                    }
                    className="font-bold w-[40px] h-[40px] text-[15px] p-1 bg-black text-white rounded-full grid place-content-center"
                  >
                    {product.variants?.length}
                  </div>
                </div>
              </div>
              <div
                onClick={() => {
                  if (!product.variants || product.variants.length === 0) {
                    errorToast("Please Create Variant");
                    return;
                  }
                  setnew("stock");
                }}
                className="card w-[350px] h-[250px] max-small_phone:w-[200px] max-small_phone:h-[150px] bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
              >
                <Image
                  src={Variantstockimg}
                  alt="Icon"
                  className="w-[70px] h-[70px[ object-contain pb-10"
                />

                <div className=" w-full h-fit text-black flex flex-row items-center gap-x-5">
                  <h3 className="text-2xl font-bold">
                    {`${
                      !product.varaintstock || product.varaintstock.length === 0
                        ? "Create"
                        : ""
                    } Stock`}
                  </h3>
                  <div
                    style={
                      !product.varaintstock || product.varaintstock.length === 0
                        ? { display: "none" }
                        : {}
                    }
                    className="font-bold w-[40px] h-[40px] text-[15px] p-1 bg-black text-white rounded-full grid place-content-center"
                  >
                    {product.varaintstock?.length}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-row justify-end gap-x-5 w-full h-fit bg-white rounded-b-lg p-2 border-t-2 border-gray-500">
        {editsubstockidx === -1 && (
          <>
            <PrimaryButton
              text={newadd !== "none" ? "Back" : "Close"}
              onClick={() => handleBack()}
              status={loading ? "loading" : "authenticated"}
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
