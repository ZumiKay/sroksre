"use client";
import {
  ProductStockType,
  Stocktype,
  useGlobalContext,
  VariantColorValueType,
} from "@/src/context/GlobalContext";
import { ContainerLoading, errorToast } from "../Loading";
import { FormEvent, useEffect, useState } from "react";
import { RGBColor } from "react-color";
import {
  ApiRequest,
  Delayloading,
  useScreenSize,
} from "@/src/context/CustomHook";
import tinycolor from "tinycolor2";
import Modal from "../Modals";
import { motion } from "framer-motion";
import PrimaryButton, { Selection } from "../Button";
import Image from "next/image";
import Variantimg from "../../../../public/Image/Variant.png";
import Variantstockimg from "../../../../public/Image/Stock.png";
import {
  ColorSelectModal,
  ManageStockContainer,
  MapSelectedValuesToVariant,
} from "./VariantModalComponent";
import { Badge, Button } from "@nextui-org/react";
import TemplateContainer, {
  AddTemplateModal,
} from "./Variantcomponent/TemplateContainer";
import { VariantTemplateType } from "./Variantcomponent/Action";
import { HasPartialOverlap } from "@/src/lib/utilities";

interface variantdatatype {
  id?: number;
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<string | VariantColorValueType>;
}

export interface Colortype {
  hex: string;
  rgb: RGBColor;
}
export const Colorinitalize: Colortype = {
  hex: "#f5f5f5",
  rgb: {
    r: 245,
    g: 245,
    b: 245,
    a: 1,
  },
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
export type Variantcontainertype =
  | "variant"
  | "stock"
  | "type"
  | "info"
  | "stockinfo"
  | "none";

export const Variantcontainer = ({
  type,
  editindex,
  closename,
}: {
  type?: "stock";
  editindex?: number;
  closename?: string;
}) => {
  const { setopenmodal, product, setproduct } = useGlobalContext();
  const [temp, settemp] = useState<variantdatatype>();
  const [reloadtemp, setreloadtemp] = useState(true);

  const [colordata, setcolordata] = useState({
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
  const { isDesktop } = useScreenSize();
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
  const FetchTemplate = async () => {
    async function asyncfetch() {
      const res = await ApiRequest(
        "/api/products/variant/template?ty=short",
        undefined,
        "GET"
      );
      setreloadtemp(false);
      if (res.success) {
        settemplates(res.data);
      }
    }
    if (reloadtemp) {
      await Delayloading(asyncfetch, setloading, 1000);
    }
  };

  //Fetch variant stock
  const fetchstock = async (index: number) => {
    const asyncfetchdata = async () => {
      const URL = `/api/products/ty=${type}_pid=${index}`;
      const response = await ApiRequest(URL, undefined, "GET");

      if (!response.success) {
        errorToast("Error Connection");
        return;
      }

      setproduct((prev) => ({ ...prev, ...response.data }));
    };
    await Delayloading(asyncfetchdata, setloading, 500);
  };

  useEffect(() => {
    editindex &&
      type &&
      type === ProductStockType.stock &&
      fetchstock(editindex);
  }, []);

  useEffect(() => {
    FetchTemplate();
  }, [reloadtemp]);

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

  const handleAddColor = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { color, name } = colordata;
    if (color?.hex === "" || !name) {
      errorToast(color.hex === "" ? "Please Select Color" : "Name is Required");
      return;
    }
    const update = { ...temp };
    if (edit === -1) {
      update.value?.push({
        val: color.hex,
        name,
      });
    } else if (update.value && edit !== -1) {
      update.value[edit] = {
        val: color.hex,
        name,
      };
    }
    settemp(update as variantdatatype);
    setcolordata((prev) => ({ ...prev, color: Colorinitalize, name: "" }));
    setedit(-1);
  };

  const handleColorSelect = (idx: number, type: "color" | "text") => {
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
  };

  const handleUpdateVariantOption = (e: FormEvent<HTMLFormElement>) => {
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

    setopen((prev) => ({ ...prev, addoption: false }));
  };
  const handleVariantEdit = (idx: number) => {
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
            const updatedVariantValues = stock.Stockvalue.map((val, valIdx) => {
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
            });

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
  };
  const handleVariantDelete = async (idx: number) => {
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
  };

  const handleDeleteVaraint = (idx: number) => {
    let update = { ...temp };
    update?.value?.splice(idx, 1);
    settemp(update as variantdatatype);
  };

  const handleSelectTemplate = (id: number) => {
    const selectedtemp = { ...templates.find((i) => i.id === id) };

    if (!selectedtemp) {
      return;
    }

    if (isEditTemp) {
      setedittemplate(selectedtemp as any);
      setopen((prev) => ({ ...prev, addtemplate: true }));
    } else {
      setname(selectedtemp.variant?.option_title as string);
      settemp({
        name: selectedtemp.variant?.option_title as string,
        type: selectedtemp.variant?.option_type as any,
        value: selectedtemp.variant?.option_value as any,
      });
      setnew("info");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    setloading(true);
    const request = await ApiRequest(
      "/api/products/variant/template",
      undefined,
      "DELETE",
      "JSON",
      { id }
    );
    setloading(false);
    if (!request.success) {
      errorToast("Error Occured");
      return;
    }
    setreloadtemp(true);
  };

  const handleBack = () => {
    if (newadd == "none") {
      setopenmodal((prev) => ({ ...prev, addproductvariant: false }));
      return;
    } else {
      if (newadd === "stockinfo" || editindex) {
        handleCreateAndUpdateVariantStock();
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

    const stockArray = product.varaintstock ? [...product.varaintstock] : [];

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
        setselectedvalues(undefined);
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

    setproduct((prev) => ({ ...prev, varaintstock: stockArray }));
    setselectedvalues(undefined);
    setstock("");
    if (!addnew) setnew("stock");
  };

  const handleDeleteColor = (idx: number) => {
    const update = { ...temp };
    update.value?.splice(idx, 1);
    settemp(update as any);
  };

  const handleSaveUpdateSubStock = async () => {
    setloading(true);
    const res = await ApiRequest(
      "/api/products/crud",
      undefined,
      "PUT",
      "JSON",
      {
        id: editindex,
        varaintstock: product.varaintstock,
        type: "editvariantstock",
      }
    );
    setloading(false);
    if (!res.success) {
      errorToast("Error occured");
      return;
    }
    setedit(-1);
    setselectedvalues(undefined);
    setstock("");
    setnew("stock");
  };

  return (
    <Modal
      closestate={"none"}
      customwidth={!isDesktop ? "100vw" : "50vw"}
      customheight={!isDesktop ? "100vh" : "70vh"}
      customZIndex={150}
    >
      <div className="relative productvariant_creation rounded-t-md w-full h-full bg-white flex flex-col items-center justify-start pt-5 gap-y-5">
        {loading && <ContainerLoading />}
        <h3 className="title text-2xl font-bold text-left w-full h-[50px] pl-2 border-b-1 border-black ">
          {newadd === "variant" || newadd === "type" || newadd === "info"
            ? "Variant"
            : newadd === "stock" || newadd === "stockinfo"
            ? "Stock"
            : "Variant and Stock"}
        </h3>

        {newadd === "variant" ? (
          <>
            <div className="w-full flex flex-col items-center gap-y-5">
              {(product.variants?.length === 0 || !product.variants) && (
                <h3 className="text-lg text-gray-500 w-[90%] rounded-lg outline outline-1 outline-gray-500 p-2">
                  No Variant
                </h3>
              )}
              {product.variants &&
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
                    <motion.div className="varaints flex flex-row w-full gap-x-3">
                      {obj.option_type === "TEXT" &&
                        obj.option_value.map((item) => (
                          <div
                            key={item as string}
                            className="min-w-[40px] h-fit max-w-full break-words font-normal text-lg"
                          >
                            {item.toString()}
                          </div>
                        ))}
                      {obj.option_type === "COLOR" &&
                        obj.option_value.map((item) => {
                          const data = item as VariantColorValueType;
                          return (
                            <div
                              key={data.val}
                              style={{ backgroundColor: data.val }}
                              className="w-[30px] h-[30px] rounded-3xl"
                            ></div>
                          );
                        })}
                    </motion.div>
                    <div className="action flex flex-row items-start w-[20%] h-fit gap-x-5 absolute right-0 top-[40%]">
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
                ))}
            </div>
          </>
        ) : (
          // stock__container
          //
          //
          (newadd === "stock" || newadd === "stockinfo") && (
            <ManageStockContainer
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
                  type: e.target.value as any,
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
              </div>

              <Button
                color="primary"
                variant="bordered"
                style={{ height: "40px" }}
                onClick={() =>
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
                refresh={() => setreloadtemp(true)}
                data={edittemplate}
              />
            )}
          </>
        )}
        {newadd === "info" && (
          <div className="addcontainer w-[95%] h-full flex flex-col gap-y-5 rounded-lg p-2">
            <input
              name="name"
              placeholder="Variant Name"
              value={name}
              onChange={(e) => setname(e.target.value)}
              className="text-sm font-medium pl-1 h-[40px] w-full border-2 border-gray-300 rounded-md"
            />
            {temp && temp.type === "COLOR" ? (
              <div className="color_container w-full h-fit flex flex-col gap-y-5">
                <ColorSelectModal
                  handleAddColor={handleAddColor}
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

                <div className="listcolor flex flex-row flex-wrap gap-x-3 gap-y-3 w-full">
                  {temp?.value?.some((i) => i !== "") ? (
                    temp?.value?.map((color, idx) => {
                      const val = color as VariantColorValueType;
                      return (
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
                              style={{ backgroundColor: val.val }}
                            ></div>
                            {val.name && (
                              <p className="w-fit h-fit text-lg font-light">
                                {val.name}
                              </p>
                            )}
                          </div>
                        </Badge>
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
                  <Modal closestate="none" customZIndex={150}>
                    <form
                      onSubmit={(e) => handleUpdateVariantOption(e)}
                      className="addoption w-[300px] h-1/3
                       max-smallest_phone:w-[275px]
                      bg-white p-3 flex flex-col gap-y-5 
                      items-center justify-start rounded-md"
                    >
                      <input
                        name="option"
                        placeholder="Option (Required)"
                        type="text"
                        value={option}
                        onChange={(e) => setoption(e.target.value)}
                        className="text-sm font-medium pl-1 h-[50px] w-full border-2 border-gray-300 rounded-md"
                      />
                      <div className="action-btn flex flex-row w-full gap-x-3">
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
                        <PrimaryButton
                          text="Back"
                          color="black"
                          type="button"
                          onClick={() => {
                            setopen((prev) => ({
                              ...prev,
                              addoption: false,
                            }));
                          }}
                          width="100%"
                          textsize="12px"
                          radius="10px"
                          height="35px"
                        />
                      </div>
                    </form>
                  </Modal>
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
                  <div className="opitonlist flex flex-row gap-x-3 w-full items-start justify-start h-fit">
                    {temp?.value.length === 0 && (
                      <h3 className="warn_mess text-lg text-black font-normal">
                        No Option Yet
                      </h3>
                    )}
                    {temp?.value.map((i, idx) => (
                      <Badge
                        content="-"
                        color="danger"
                        onClick={() => handleDeleteVaraint(idx)}
                      >
                        <h3
                          key={idx}
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
                max-smallest_phone:w-[275px]
              bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
              >
                <Image
                  src={Variantimg}
                  alt="Icon"
                  className="w-[70px] h-[70px[ object-contain pb-10"
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
                className="card w-[350px] h-[250px] max-smallest_phone:w-[275px] bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
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
        {editindex &&
          closename &&
          edit !== -1 &&
          editsubstockidx === -1 &&
          !addNewSubStock && (
            <Button
              onClick={() => handleSaveUpdateSubStock()}
              className="w-[30%]"
              color="success"
              variant="bordered"
              isLoading={loading}
            >
              Update
            </Button>
          )}

        {editsubstockidx === -1 && (
          <PrimaryButton
            text={newadd !== "none" ? "Back" : "Close"}
            onClick={() => handleBack()}
            type="button"
            width="30%"
            height="40px"
            color="lightcoral"
            radius="10px"
          />
        )}
      </div>
    </Modal>
  );
};
