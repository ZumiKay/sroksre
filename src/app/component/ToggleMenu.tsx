"use client";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import "../globals.css";

import {
  ProductInfo,
  SelectType,
  VariantColorValueType,
  useGlobalContext,
} from "@/src/context/GlobalContext";
import PrimaryButton from "./Button";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select/async";
import makeAnimated from "react-select/animated";

import { GetProductName } from "../dashboard/inventory/varaint_action";
import { errorToast } from "./Loading";
import { Button, Input } from "@nextui-org/react";
import React from "react";
interface toggleprops {
  name: string;
  isAdmin: boolean;
  type?: string;
  data?: ProductInfo[];
  index?: number;
  paragraph?: {
    id?: number;
    title?: string;
    content: string;
  }[];
}

export default function ToggleMenu(props: toggleprops) {
  const { openmodal, product, setproduct, setopenmodal, setglobalindex } =
    useGlobalContext();
  const [open, setopen] = useState(false);
  const handleEdit = (index: number) => {
    setglobalindex((prev) => ({ ...prev, productdetailindex: index }));
    setopenmodal({ ...openmodal, productdetail: true });
  };
  const handleDelete = (index: number) => {
    const updatedetail = [...product.details];
    updatedetail.splice(index, 1);
    setproduct({ ...product, details: updatedetail });
    setopenmodal({ ...openmodal, productdetail: false });
  };

  return (
    <motion.div
      initial={{ height: "0%" }}
      animate={open ? { height: "max-content" } : { height: "0%" }}
      transition={{
        ease: "linear",
        duration: 0.2,
      }}
      className="toggle__container w-full h-fit flex flex-col gap-y-1"
    >
      <h3 className="togglebtn sticky top-0 mb-5 font-normal text-lg flex flex-row items-center justify-start gap-x-5">
        <strong className="underline font-bold text-xl">{props.name}</strong>
        <i
          onClick={() => setopen(!open)}
          className={`ml-2 fa-solid ${
            open ? "fa-minus text-red-500" : "fa-plus text-black"
          } rounded-2xl text-xl p-2 no-underline transition hover:-translate-y-[.5] active:-translate-y-1`}
        ></i>{" "}
      </h3>
      <AnimatePresence>
        {(open || props.isAdmin) && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "fit-content", y: 0, opacity: 1 }}
            exit={{ height: 0, y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="detailheader w-full h-fit  break-words flex flex-col items-start gap-y-3"
          >
            {props.paragraph
              ? props.paragraph.map((i) => (
                  <div
                    key={i.id}
                    className="w-full h-fit flex flex-col gap-y-3"
                  >
                    {i.title && (
                      <h3 className="w-full text-xl font-bold break-words">
                        {i.title}
                      </h3>
                    )}
                    <p className="w-full h-fit text-lg font-normal">
                      {i.content}
                    </p>
                  </div>
                ))
              : props.data?.map((obj, index) => (
                  <div
                    key={index}
                    className="text-base font-normal flex flex-row items-center gap-x-5"
                  >
                    {" "}
                    {obj.info_title} : {obj.info_value[0] as string}
                    {props.isAdmin && (
                      <>
                        <div
                          onClick={() => handleEdit(index)}
                          className="text-blue-400 underline transition hover:text-black"
                        >
                          Edit
                        </div>
                        <div
                          onClick={() => handleDelete(index)}
                          className="text-red-400 underline transition hover:text-black"
                        >
                          Delete
                        </div>
                      </>
                    )}
                  </div>
                ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
interface toggledownmenuprops {
  style?: CSSProperties;
  children: ReactNode;
  open: boolean;
}
export function ToggleDownMenu(props: toggledownmenuprops) {
  return (
    <div
      style={{ ...props.style, display: !props.open ? "none" : "" }}
      className="toggleDownMenu__container w-full h-[75vh] flex flex-col items-start gap-y-5 pl-2 overflow-y-auto overflow-x-hidden"
    >
      {props.children}
    </div>
  );
}

export function AddSubCategoryMenu({ index }: { index: number }) {
  const { category, setcategory, setopenmodal, allData } = useGlobalContext();
  const [name, setname] = useState("");
  const [editIdx, setedit] = useState(-1);

  useEffect(() => {
    index !== -1 && allData?.category && setcategory(allData.category[index]);
  }, []);

  const handleAdd = () => {
    const updatecate = [...category.subcategories];
    const isExist = updatecate.some((i) => i.name === name);
    if (isExist) {
      errorToast("Cateogory Exist");
      return;
    }
    if ((name.length > 0 && editIdx < 0) || updatecate.length === 0) {
      updatecate.push({ name: name, type: "normal" });
    } else {
      updatecate[editIdx].name = name;
    }
    setname("");
    setedit(-1);
    setcategory((prev) => ({ ...prev, subcategories: updatecate }));
  };
  const handleCancel = () => {
    const deletesub = { ...category };
    deletesub.subcategories = [];

    setname("");
    setedit(-1);
    setcategory(deletesub);
    setopenmodal((prev) => ({ ...prev, addsubcategory: false }));
  };
  const handleDelete = (idx: number) => {
    const subcate = [...category.subcategories];
    subcate.splice(idx, 1);
    setcategory((prev) => ({ ...prev, subcategories: subcate }));
  };
  return (
    <div className="AddSubCategory_menu w-full h-fit p-1 flex flex-col justify-center gap-y-5 transition rounded-md outline outline-2 outline-gray-300">
      <h2 className="text-lg font-bold">Sub Categories</h2>
      <div className="subcategory_list flex flex-row flex-wrap gap-5 p-4 place-content-start h-full  max-h-[120px] overflow-y-auto">
        {category.subcategories?.map((cat, index) => (
          <div
            key={index}
            style={
              editIdx === index
                ? { backgroundColor: "black", color: "white" }
                : {}
            }
            className="subcategory relative text-lg font-bold p-1 rounded-md outline outline-1 outline-offset-2 outline-black w-fit h-fit max-w-[100px] break-words cursor-pointer transition hover:bg-black hover:text-white"
          >
            <h3
              onClick={() => {
                setedit((prev) => (prev === index ? -1 : index));
                setname(
                  index === editIdx ? "" : category.subcategories[index].name
                );
              }}
              className="subcategory__name text-lg font-medium"
            >
              {cat.name}
            </h3>
            <i
              onClick={() => {
                handleDelete(index);
              }}
              className="fa-solid fa-minus font-black p-[1px] h-fit absolute -right-2 -top-3  text-sm rounded-lg bg-red-500 text-white transition hover:bg-black "
            ></i>
          </div>
        ))}
      </div>

      <div className="subcategoryform w-full h-full flex flex-col gap-y-3">
        <Input
          size="lg"
          type="text"
          className="subcate_name w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => {
            setname(e.target.value);
          }}
        />
        <div className="w-full h-fit flex flex-row items-center gap-x-5">
          <PrimaryButton
            type="button"
            text={editIdx < 0 ? "Add" : "Edit"}
            onClick={() => handleAdd()}
            width="100%"
            height="30px"
            textsize="12px"
            color="#44C3A0"
            radius="10px"
            disable={name.length === 0}
          />
          <PrimaryButton
            type="button"
            text={"Delete"}
            onClick={() => handleCancel()}
            width="100%"
            height="30px"
            textsize="12px"
            color="lightcoral"
            radius="10px"
          />
        </div>
      </div>
    </div>
  );
}
interface Toggleselectprops {
  type: "color" | "size" | "text" | "pcate" | "ccate";
  title: string;
  data: Array<string> | VariantColorValueType[];
  clickfunction?: (idx: number, type: string) => void;
  selected?: string[];
  promo?: boolean;
  onClear?: (
    data: string[] | VariantColorValueType[],
    selectedvalue: string[],
    promo?: boolean,
    type?: string
  ) => void;
}
export function ToggleSelect({
  type,
  data,
  title,
  clickfunction,
  selected,
  onClear,
  promo,
}: Toggleselectprops) {
  const [open, setopen] = useState(false);
  return (
    <motion.div
      initial={{ height: "100%" }}
      whileHover={{ backgroundColor: "#f1f1f1" }}
      whileTap={{ backgroundColor: "#f1f1f1" }}
      animate={open ? { height: "100%" } : {}}
      className="toggleselect w-full h-fit rounded-lg border-2 border-black flex flex-col items-start gap-y-3 relative"
    >
      <div
        onClick={() => setopen(!open)}
        className="title h-fit text-lg font-semibold w-full text-left cursor-pointer p-2 flex flex-row items-center justify-between"
      >
        <div className="w-full h-full">
          {type === "color" ? (
            selected ? (
              "Clear Color"
            ) : (
              "Color"
            )
          ) : selected ? (
            data.some((i) => selected.includes(i as string)) ? (
              <div className="w-fit h-fit">
                {" "}
                <p className="font-bold text-red-400">Selected</p>
                <p>{title}</p>{" "}
              </div>
            ) : (
              title
            )
          ) : (
            title
          )}
        </div>
        {selected &&
          data.some((i) =>
            selected.includes(typeof i === "string" ? i : i.val)
          ) && (
            <Button
              onClick={() => onClear && onClear(data, selected, promo, type)}
              size="sm"
              variant="bordered"
              color="danger"
            >
              Clear
            </Button>
          )}
      </div>

      {open && (
        <div className="w-full max-h-[150px] overflow-y-auto ">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="selectitem_container grid grid-cols-3 gap-y-3 h-full  w-fit gap-x-3 p-2 transition-all"
          >
            {data.map((i, idx) => (
              <div
                key={idx}
                className="selectitem min-w-[50px] rounded-lg cursor-pointer w-fit h-fit break-words border border-black bg-white active:bg-gray-100 p-2"
                onClick={() => {
                  clickfunction && clickfunction(idx, type);
                }}
                style={
                  selected?.includes(typeof i === "string" ? i : i.val)
                    ? { backgroundColor: "gray" }
                    : {}
                }
              >
                {" "}
                {type === "color" && typeof i !== "string" ? (
                  <div className="w-fit h-fit flex flex-row gap-x-3 p-2 items-center justify-center rounded-full border border-black">
                    <div
                      className={`colorplattet w-[30px] h-[30px] rounded-full`}
                      style={
                        i
                          ? {
                              backgroundColor: i.val,
                              backgroundPosition: "center",
                            }
                          : {}
                      }
                    ></div>
                    {i.name && (
                      <div className="text-lg w-fit h-fit font-bold">
                        {" "}
                        {i.name}{" "}
                      </div>
                    )}
                  </div>
                ) : (
                  <h3 className="label w-fit h-fit text-lg text-center font-normal">
                    {i as string}
                  </h3>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

const animatedComponents = makeAnimated();

const getOptions = async (value: string, selectedvalue?: string[]) => {
  const product = GetProductName.bind(null, value);
  const searchreq = await product();

  const filterd = selectedvalue
    ? searchreq.data.filter((i) => !selectedvalue.includes(i.id.toString()))
    : searchreq.data;

  const result = filterd.map((i) => ({
    label: i.name,
    value: i.id,
  }));

  return result;
};
export const SearchAndMultiSelect = () => {
  const { product, setproduct } = useGlobalContext();

  const [selected, setselected] = useState<SelectType[] | undefined>(undefined);

  useEffect(() => {
    if (product.relatedproduct) {
      const selectedrelated = product.relatedproduct.map((i) => ({
        label: i.name,
        value: i.id.toString(),
      }));
      setselected(selectedrelated.length === 0 ? undefined : selectedrelated);
    }
  }, [product.relatedproduct]);

  const handleSelectChange = (val: SelectType[] | null) => {
    const selected = val ?? [];
    const productId = selected.map((i) => parseInt(i.value.toString()));

    setselected(selected);
    setproduct((prev) => ({ ...prev, relatedproductid: productId }));
  };

  return (
    <ReactSelect
      closeMenuOnSelect={false}
      components={animatedComponents}
      placeholder={"Product name"}
      value={selected?.filter((i) => i.value !== product.id?.toString())}
      loadOptions={(value) =>
        getOptions(
          value,
          selected?.map((i) => i.value as string)
        ) as any
      }
      onChange={(val) => handleSelectChange(val as SelectType[] | null)}
      isMulti
    />
  );
};
