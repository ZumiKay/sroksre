"use client";
import {
  ProductStockType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import { ContainerLoading, errorToast } from "../Loading";
import { FormEvent, useEffect, useState } from "react";
import { RGBColor } from "react-color";
import { ApiRequest, Delayloading } from "@/src/context/CustomHook";
import tinycolor from "tinycolor2";
import { Deletevairiant } from "../../dashboard/inventory/varaint_action";
import Modal from "../Modals";
import { motion } from "framer-motion";
import PrimaryButton, { Selection } from "../Button";
import Image from "next/image";
import Variantimg from "../../../../public/Image/Variant.png";
import Variantstockimg from "../../../../public/Image/Stock.png";
import {
  ColorSelectModal,
  ManageStockContainer,
} from "./VariantModalComponent";
import { Button } from "@nextui-org/react";
import TemplateContainer, {
  AddTemplateModal,
} from "./Variantcomponent/TemplateContainer";
import { VariantTemplateType } from "./Variantcomponent/Action";

interface variantdatatype {
  id?: number;
  type: "COLOR" | "TEXT";
  name: string;
  value: Array<string>;
}

interface colortype {
  hex: string;
  rgb: RGBColor;
}

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
  action,
  closename,
}: {
  closename: string;
  type?: "stock";
  editindex?: number;
  action?: () => void;
}) => {
  const { setopenmodal, product, setproduct, globalindex, setreloaddata } =
    useGlobalContext();
  const [temp, settemp] = useState<variantdatatype | undefined>(undefined);
  const [reloadtemp, setreloadtemp] = useState(true);

  const [newadd, setnew] = useState<Variantcontainertype>(type ?? "none");
  const [option, setoption] = useState("");
  const [added, setadded] = useState(-1);
  const [edit, setedit] = useState(-1);
  const [addstock, setaddstock] = useState(-1);
  const [name, setname] = useState("");
  const [stock, setstock] = useState("");
  const [templates, settemplates] = useState<VariantTemplateType[] | []>([]);
  const [edittemplate, setedittemplate] = useState<
    VariantTemplateType | undefined
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
    await Delayloading(asyncfetchdata, setloading, 1000);
  };
  const handleUpdateVariant = async (idx: number) => {
    setloading(true);

    const updateReq = await ApiRequest(
      "/api/products/crud",
      undefined,
      "PUT",
      "JSON",
      {
        id: idx,
        ...product,
      }
    );
    setloading(false);
    if (!updateReq.success) {
      return null;
    }
    return true;
  };

  const colorinitalize: colortype = {
    hex: "#f5f5f5",
    rgb: {
      r: 245,
      g: 245,
      b: 245,
      a: 1,
    },
  };
  const [color, setcolor] = useState<colortype>(colorinitalize);
  const [open, setopen] = useState({
    addcolor: false,
    addoption: false,
    addtemplate: false,
  });

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
        if (product.varaintstock) {
          const stock = [...product.varaintstock];

          setproduct((prev) => ({ ...prev, varaintstock: stock }));
        }

        update[added] = {
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
        };
      } else {
        update.push({
          option_title: name,
          option_type: temp?.type as "COLOR" | "TEXT",
          option_value: temp?.value as string[],
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
    if (color?.hex === "") {
      errorToast("Please Select Color");
      return;
    }
    const update = { ...temp };
    if (edit === -1) {
      update.value?.push(color.hex);
    } else if (update.value && edit !== -1) {
      if (product.varaintstock) {
      }
      update.value[edit] = color.hex;
    }
    settemp(update as variantdatatype);
    setcolor(colorinitalize);
    setedit(-1);
  };

  const handleColorSelect = (idx: number, type: "color" | "text") => {
    const data = temp?.value[idx];
    if (type === "color") {
      const rgb = tinycolor(data).toRgb();
      setedit(idx);
      setcolor({ hex: data as string, rgb: rgb });
      setopen((prev) => ({ ...prev, addcolor: true }));
    } else {
      setedit(idx);
      setoption(data as string);
      setopen((prev) => ({ ...prev, addoption: true }));
    }
  };

  const handleUpdateVariantOption = () => {
    const update = { ...temp };

    if (edit === -1) {
      update.value?.push(option);
    } else if (update.value) {
      if (product.varaintstock) {
      }

      update.value[edit] = option;
      setedit(-1);
    }

    setopen((prev) => ({ ...prev, addoption: false }));
  };
  const handleVariantEdit = (idx: number) => {
    if (product.variants) {
      const data = product.variants[idx];
      if (data) {
        setname(data.option_title);
        settemp({
          name: data.option_title,
          value: [...data.option_value],
          type: data.option_type as "COLOR" | "TEXT",
        });
        setadded(idx);
        setnew("info");
      }
    }
  };
  const handleVariantDelete = async (idx: number) => {
    const { variants, varaintstock } = product;
    if (!variants || idx < 0 || idx >= variants.length) return;

    const variantId = variants[idx].id;
    const optionValuesToRemove = variants[idx].option_value;

    if (globalindex.producteditindex !== -1 && variantId !== undefined) {
      const req = await Deletevairiant(variantId);
      if (!req.success) {
        errorToast(req.message ?? "Error Occured");
        return;
      }
    }

    const updatedVariants = variants.filter((_, index) => index !== idx);

    if (varaintstock) {
      setproduct((prev) => ({
        ...prev,
        variants: updatedVariants,
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
    if (edit !== -1) {
      let update = { ...temp };
      update?.value?.splice(idx, 1);
      settemp(update as variantdatatype);
      setedit(-1);
    }
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
        value: selectedtemp.variant?.option_value as string[],
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
      if (newadd === "stockinfo") {
        setnew("stock");
        return;
      }
      if (newadd === "type") {
        setnew("variant");
        return;
      }
      setnew("none");
    }
  };

  return (
    <Modal closestate={"none"} customZIndex={150} customheight="70vh">
      <div className="relative productvariant_creation rounded-t-md w-full min-h-full max-h-[70vh] overflow-x-hidden overflow-y-auto bg-white flex flex-col items-center justify-start pt-5 gap-y-5">
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
                    className="relative varaint_container w-[90%] h-fit border border-black rounded-lg p-2"
                  >
                    <h3 className="variant_name font-medium text-lg w-fit h-fit">
                      {obj.option_title === "" ? "No Name" : obj.option_title}
                    </h3>
                    <motion.div className="varaints flex flex-row w-full gap-x-3">
                      {obj.option_type === "TEXT" &&
                        obj.option_value.map((item) => (
                          <div className="min-w-[40px] h-fit max-w-full break-words font-normal text-lg">
                            {item}
                          </div>
                        ))}
                      {obj.option_type === "COLOR" &&
                        obj.option_value.map((item) => (
                          <div
                            style={{ backgroundColor: item }}
                            className="w-[30px] h-[30px] rounded-3xl"
                          ></div>
                        ))}
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
                    option_title: item.variant?.option_title ?? "",
                    option_type: item.variant?.option_type ?? "",
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
                  handleDeleteVaraint={handleDeleteVaraint}
                  edit={edit}
                  setedit={setedit}
                  openmodal={open.addcolor}
                />

                <div className="listcolor flex flex-row flex-wrap gap-x-3 gap-y-3 w-full">
                  {temp?.value?.some((i) => i !== "") ? (
                    temp?.value?.map((color, idx) => (
                      <div
                        className={`color w-[50px] h-[50px] rounded-3xl transition duration-500 hover:border-2 hover:border-gray-300 active:border-2  active:border-gray-300`}
                        onClick={() => handleColorSelect(idx, "color")}
                        style={
                          color !== ""
                            ? {
                                backgroundColor: color,
                              }
                            : {}
                        }
                      ></div>
                    ))
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
                    <form className="addoption w-1/3 h-1/3 bg-white p-3 flex flex-col gap-y-5 items-center justify-start rounded-md">
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
                          type="button"
                          disable={option === ""}
                          onClick={() => {
                            handleUpdateVariantOption();
                          }}
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
                      {edit !== -1 && (
                        <PrimaryButton
                          text="Delete"
                          type="button"
                          textsize="12px"
                          radius="10px"
                          width="100%"
                          onClick={() => {
                            handleDeleteVaraint(edit);
                            setopen((prev) => ({ ...prev, addoption: false }));
                          }}
                          height="40px"
                          color="lightcoral"
                        />
                      )}
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
                      <h3
                        onClick={() => handleColorSelect(idx, "text")}
                        className="option text-[15px] cursor-pointer p-2 rounded-lg text-black outline outline-2 outline-black font-normal transition duration-200 w-fit h-fit"
                      >
                        {i}
                      </h3>
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
                className="card w-[350px] h-[250px] bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
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
                onClick={() => setnew("stock")}
                className="card w-[350px] h-[250px] bg-blue-300 rounded-lg grid place-content-center place-items-center transition duration-200 cursor-pointer hover:bg-transparent hover:outline hover:outline-1 hover:outline-black"
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

      <div className="flex flex-row justify-end gap-x-5 w-full h-fit bg-white rounded-b-lg p-2">
        {newadd === "stockinfo" && edit !== -1 && (
          <PrimaryButton
            text="Delete"
            type="button"
            onClick={() => {
              let updatestock = product.varaintstock;

              updatestock && updatestock.splice(addstock, 1);
              setaddstock(-1);
              setproduct((prev) => ({
                ...prev,
                varaintstock: updatestock,
              }));
              setnew("stock");
            }}
            width="30%"
            height="40px"
            radius="10px"
            color="#674C54"
          />
        )}

        <PrimaryButton
          text={newadd !== "none" ? "Back" : "Close"}
          onClick={() => handleBack()}
          type="button"
          width="30%"
          height="40px"
          color="lightcoral"
          radius="10px"
        />
      </div>
    </Modal>
  );
};
